#!/usr/bin/env python3
"""Local TeslaCam browser and synchronized multi-camera viewer."""

from __future__ import annotations

import argparse
import ctypes
import hashlib
import json
import mimetypes
import os
import re
import shutil
import subprocess
import sys
import threading
import time
import traceback
import urllib.parse
import webbrowser
from datetime import datetime, timedelta
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


APP_NAME = "TeslaCam 本地查看器"
APP_VERSION = "1.2.0"
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765
BASE_DIR = Path(__file__).resolve().parent
WEB_DIR = BASE_DIR / "web"
IS_WINDOWS = os.name == "nt"

CATEGORY_ORDER = ("sentry", "saved", "recent", "other")
CATEGORY_INFO = {
    "sentry": {"label": "哨兵模式", "short": "哨兵"},
    "saved": {"label": "已保存", "short": "已保存"},
    "recent": {"label": "最近行车", "short": "最近"},
    "other": {"label": "其他视频", "short": "其他"},
}
CATEGORY_ALIASES = {
    "sentryclips": "sentry",
    "savedclips": "saved",
    "recentclips": "recent",
}
CAMERA_ORDER = (
    "front",
    "front_wide",
    "left_repeater",
    "right_repeater",
    "left_pillar",
    "right_pillar",
    "back",
    "cabin",
)
CAMERA_LABELS = {
    "front": "前置主摄",
    "front_wide": "前置广角",
    "left_repeater": "左侧 B 柱",
    "right_repeater": "右侧 B 柱",
    "left_pillar": "左前侧",
    "right_pillar": "右前侧",
    "back": "后置",
    "cabin": "车内",
}
REASON_LABELS = {
    "sentry_aware_object_detection": "检测到附近移动",
    "sentry_aware_accel": "检测到碰撞或加速度",
    "user_interaction_dashcam_icon_tapped": "手动点击保存",
    "user_interaction_dashcam_panel_save": "从行车记录仪面板保存",
    "user_interaction_honk": "鸣笛保存",
}

CLIP_NAME_RE = re.compile(
    r"^(?P<stamp>\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})(?:-(?P<camera>[A-Za-z0-9_]+))?$"
)
FOLDER_TIME_RE = re.compile(r"^(?P<stamp>\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})")


STATE_LOCK = threading.RLock()
SCAN_LOCK = threading.Lock()
STATE: dict[str, Any] = {
    "input_path": "",
    "source_root": None,
    "media": {},
    "events": {},
    "jobs": {},
}


class ViewerError(Exception):
    pass


def safe_print(*values: Any) -> None:
    stream = getattr(sys, "stdout", None)
    if stream is None:
        return
    try:
        print(*values, file=stream)
    except Exception:
        pass


def report_fatal_error(message: str) -> None:
    log_path = BASE_DIR / "TeslaCamViewer-error.log"
    try:
        log_path.write_text(message, encoding="utf-8")
    except Exception:
        pass
    if IS_WINDOWS:
        try:
            ctypes.windll.user32.MessageBoxW(
                None,
                f"{message}\n\n详细信息已写入：\n{log_path}",
                APP_NAME,
                0x10,
            )
        except Exception:
            pass


def json_dumps(data: Any) -> bytes:
    return json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def parse_clip_name(path: Path) -> tuple[datetime, str] | None:
    match = CLIP_NAME_RE.match(path.stem)
    if not match:
        return None
    try:
        timestamp = datetime.strptime(match.group("stamp"), "%Y-%m-%d_%H-%M-%S")
    except ValueError:
        return None
    camera = (match.group("camera") or "unknown").lower()
    return timestamp, camera


def parse_folder_time(name: str) -> datetime | None:
    match = FOLDER_TIME_RE.match(name)
    if not match:
        return None
    try:
        return datetime.strptime(match.group("stamp"), "%Y-%m-%d_%H-%M-%S")
    except ValueError:
        return None


def parse_event_timestamp(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone().replace(tzinfo=None)
    return parsed


def category_from_relative(relative_path: Path) -> str | None:
    parts = relative_path.parts
    for part in parts[:2]:
        category = CATEGORY_ALIASES.get(part.lower())
        if category:
            return category
    return "other" if len(parts) > 1 else None


def resolve_tesla_root(raw_path: str) -> Path:
    value = (raw_path or "").strip().strip('"').strip("'")
    if not value:
        raise ViewerError("请输入 U 盘或 TeslaCam 目录路径。")
    expanded = os.path.expandvars(os.path.expanduser(value))
    path = Path(expanded)
    if not path.exists():
        raise ViewerError(f"找不到目录：{path}")
    if path.is_file():
        path = path.parent
    path = path.resolve()

    if path.name.lower() == "teslacam":
        return path

    direct_teslacam = path / "TeslaCam"
    if direct_teslacam.is_dir():
        return direct_teslacam

    if any((path / folder).is_dir() for folder in ("SentryClips", "SavedClips", "RecentClips")):
        return path

    for parent in path.parents:
        if parent.name.lower() == "teslacam":
            return parent

    for child in path.iterdir():
        if child.is_dir() and child.name.lower() == "teslacam":
            return child.resolve()

    raise ViewerError("这个目录中没有找到 TeslaCam、SentryClips、SavedClips 或 RecentClips。")


def get_volume_label(path: str) -> str:
    if not IS_WINDOWS:
        return ""
    try:
        volume_name = ctypes.create_unicode_buffer(261)
        filesystem_name = ctypes.create_unicode_buffer(261)
        serial = ctypes.c_uint()
        max_component = ctypes.c_uint()
        flags = ctypes.c_uint()
        ok = ctypes.windll.kernel32.GetVolumeInformationW(
            path,
            volume_name,
            len(volume_name),
            ctypes.byref(serial),
            ctypes.byref(max_component),
            ctypes.byref(flags),
            filesystem_name,
            len(filesystem_name),
        )
        return volume_name.value if ok else ""
    except Exception:
        return ""


def list_drives() -> list[dict[str, Any]]:
    if not IS_WINDOWS:
        candidates = [Path("/Volumes"), Path("/media"), Path.home()]
        return [
            {
                "path": str(item),
                "label": item.name or str(item),
                "fileSystem": "",
                "type": "root",
                "removable": True,
                "teslaCam": False,
            }
            for item in candidates
            if item.exists()
        ]

    drives: list[dict[str, Any]] = []
    try:
        mask = ctypes.windll.kernel32.GetLogicalDrives()
        for index in range(26):
            if not (mask & (1 << index)):
                continue
            letter = chr(ord("A") + index)
            path = f"{letter}:\\"
            drive_type = ctypes.windll.kernel32.GetDriveTypeW(path)
            if drive_type not in (2, 3):
                continue
            removable = drive_type == 2
            label = get_volume_label(path)
            teslacam = (Path(path) / "TeslaCam").is_dir()
            drives.append(
                {
                    "path": path,
                    "label": label or ("可移动磁盘" if removable else "本地磁盘"),
                    "fileSystem": "",
                    "type": "removable" if removable else "fixed",
                    "removable": removable,
                    "teslaCam": teslacam,
                }
            )
    except Exception:
        pass
    drives.sort(key=lambda item: (not item["teslaCam"], not item["removable"], item["path"]))
    return drives


def register_media(path: Path) -> str:
    resolved = str(path.resolve())
    token = hashlib.sha256(resolved.encode("utf-8")).hexdigest()[:32]
    with STATE_LOCK:
        STATE["media"][token] = resolved
    return token


def ordered_cameras(cameras: dict[str, Any]) -> list[str]:
    known = [camera for camera in CAMERA_ORDER if camera in cameras]
    extra = sorted(camera for camera in cameras if camera not in CAMERA_ORDER)
    return known + extra


def read_event_metadata(event_dir: Path) -> dict[str, Any]:
    event_file = event_dir / "event.json"
    if not event_file.is_file():
        return {}
    try:
        if event_file.stat().st_size > 2 * 1024 * 1024:
            return {}
        data = json.loads(event_file.read_text(encoding="utf-8-sig"))
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def group_recent_clips(clips: list[dict[str, Any]]) -> list[list[dict[str, Any]]]:
    groups: list[list[dict[str, Any]]] = []
    current: list[dict[str, Any]] = []
    previous_time: datetime | None = None
    for clip in sorted(clips, key=lambda item: (item["timestamp"], item["camera"])):
        if previous_time and (clip["timestamp"] - previous_time).total_seconds() > 180:
            if current:
                groups.append(current)
            current = []
        current.append(clip)
        previous_time = clip["timestamp"]
    if current:
        groups.append(current)
    return groups


def build_event(clips: list[dict[str, Any]], category: str, source_root: Path) -> dict[str, Any]:
    segments_by_time: dict[datetime, dict[str, Any]] = {}
    first_clip = min(clips, key=lambda item: item["timestamp"])
    event_dir = first_clip["path"].parent
    metadata = read_event_metadata(event_dir)

    for clip in clips:
        timestamp = clip["timestamp"]
        segment = segments_by_time.setdefault(
            timestamp,
            {
                "timestamp": timestamp,
                "cameras": {},
                "files": [],
            },
        )
        camera = clip["camera"]
        if camera in segment["cameras"]:
            continue
        token = register_media(clip["path"])
        segment["cameras"][camera] = {
            "key": camera,
            "label": CAMERA_LABELS.get(camera, camera),
            "name": clip["path"].name,
            "url": f"/media/video?id={token}",
        }
        segment["files"].append(clip["path"])

    segment_list: list[dict[str, Any]] = []
    for timestamp in sorted(segments_by_time):
        segment = segments_by_time[timestamp]
        cameras = segment["cameras"]
        segment_list.append(
            {
                "id": hashlib.sha256(
                    f"{category}|{first_clip['relative'].parent}|{timestamp.isoformat()}".encode("utf-8")
                ).hexdigest()[:24],
                "timestamp": timestamp.isoformat(timespec="seconds"),
                "cameras": cameras,
                "cameraOrder": ordered_cameras(cameras),
            }
        )

    all_media_files = [file for segment in segment_list for file in segments_by_time[
        datetime.fromisoformat(segment["timestamp"])
    ]["files"]]
    event_rel_dir = first_clip["relative"].parent
    event_id = hashlib.sha256(
        f"{category}|{event_rel_dir}".encode("utf-8")
    ).hexdigest()[:24]

    estimated_duration = len(segment_list) * 60
    folder_time = parse_folder_time(event_dir.name)
    metadata_time = parse_event_timestamp(metadata.get("timestamp"))
    event_time = metadata_time or folder_time or min(segments_by_time)
    recording_start = min(segments_by_time)
    recording_end = max(segments_by_time) + timedelta(seconds=estimated_duration)

    incident = None
    if metadata_time:
        segment_times = sorted(segments_by_time)
        incident_segment_index = 0
        incident_offset = 0.0
        for index, segment_time in enumerate(segment_times):
            segment_end = segment_time + timedelta(seconds=60)
            if segment_time <= metadata_time < segment_end:
                incident_segment_index = index
                incident_offset = max(0.0, (metadata_time - segment_time).total_seconds())
                break
        else:
            closest_index = min(
                range(len(segment_times)),
                key=lambda index: abs((segment_times[index] - metadata_time).total_seconds()),
            )
            incident_segment_index = closest_index
            delta = (metadata_time - segment_times[closest_index]).total_seconds()
            incident_offset = max(0.0, min(59.999, delta))
        incident = {
            "time": metadata_time.isoformat(timespec="seconds"),
            "segmentIndex": incident_segment_index,
            "offset": round(incident_offset, 3),
            "source": "event.json",
        }
    if category == "sentry":
        title = "哨兵事件"
    elif category == "saved":
        title = "已保存片段"
    elif category == "recent":
        title = "最近行车"
    else:
        title = event_dir.name

    all_camera_keys: set[str] = set()
    for segment in segment_list:
        all_camera_keys.update(segment["cameras"].keys())

    thumb_token = None
    extra_files: list[Path] = []
    metadata_files = ("event.json", "thumb.png")
    for name in metadata_files:
        candidate = event_dir / name
        if candidate.is_file():
            extra_files.append(candidate)
            if name == "thumb.png":
                thumb_token = register_media(candidate)

    reason = metadata.get("reason") if isinstance(metadata.get("reason"), str) else ""
    city = metadata.get("city") if isinstance(metadata.get("city"), str) else ""

    public_segments = []
    for segment in segment_list:
        public_segments.append(
            {
                "id": segment["id"],
                "timestamp": segment["timestamp"],
                "cameras": segment["cameras"],
                "cameraOrder": segment["cameraOrder"],
            }
        )

    return {
        "id": event_id,
        "category": category,
        "categoryLabel": CATEGORY_INFO[category]["label"],
        "title": title,
        "time": event_time.isoformat(timespec="seconds"),
        "recordingStart": recording_start.isoformat(timespec="seconds"),
        "recordingEnd": recording_end.isoformat(timespec="seconds"),
        "endTime": recording_end.isoformat(timespec="seconds"),
        "incident": incident,
        "folder": event_dir.name,
        "relativeFolder": event_rel_dir.as_posix(),
        "reason": reason,
        "reasonLabel": REASON_LABELS.get(reason, reason),
        "city": city,
        "thumbnailUrl": f"/media/thumb?id={thumb_token}" if thumb_token else None,
        "segments": public_segments,
        "segmentCount": len(public_segments),
        "cameraCount": len(all_camera_keys),
        "cameraKeys": ordered_cameras({camera: None for camera in all_camera_keys}),
        "estimatedDuration": estimated_duration,
        "_filePaths": all_media_files,
        "_extraFiles": extra_files,
        "_relativeFiles": [file.relative_to(source_root) for file in all_media_files],
        "_relativeExtras": [
            file.relative_to(source_root) for file in extra_files if file.is_relative_to(source_root)
        ],
    }


def public_event(event: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in event.items() if not key.startswith("_")}


def scan_library(raw_path: str) -> dict[str, Any]:
    with SCAN_LOCK:
        source_root = resolve_tesla_root(raw_path)
        clips: list[dict[str, Any]] = []
        for path in source_root.rglob("*"):
            if not path.is_file() or path.suffix.lower() != ".mp4":
                continue
            parsed = parse_clip_name(path)
            if not parsed:
                continue
            timestamp, camera = parsed
            relative = path.relative_to(source_root)
            category = category_from_relative(relative)
            if not category:
                continue
            clips.append(
                {
                    "path": path.resolve(),
                    "relative": relative,
                    "timestamp": timestamp,
                    "camera": camera,
                    "category": category,
                }
            )

        if not clips:
            raise ViewerError("TeslaCam 目录中还没有可读取的 MP4 视频。")

        groups: list[tuple[str, list[dict[str, Any]]]] = []
        for category in ("sentry", "saved", "other"):
            by_folder: dict[str, list[dict[str, Any]]] = {}
            for clip in clips:
                if clip["category"] != category:
                    continue
                key = clip["relative"].parent.as_posix()
                by_folder.setdefault(key, []).append(clip)
            groups.extend((category, group) for group in by_folder.values())

        recent_clips = [clip for clip in clips if clip["category"] == "recent"]
        groups.extend(("recent", group) for group in group_recent_clips(recent_clips))

        with STATE_LOCK:
            STATE["media"] = {}
            STATE["events"] = {}
            STATE["jobs"] = {}

        events = [build_event(group, category, source_root) for category, group in groups]
        events.sort(key=lambda event: event["time"], reverse=True)

        category_counts = {category: 0 for category in CATEGORY_ORDER}
        for event in events:
            category_counts[event["category"]] += 1

        with STATE_LOCK:
            STATE["input_path"] = str(Path(raw_path).expanduser())
            STATE["source_root"] = str(source_root)
            STATE["events"] = {event["id"]: event for event in events}

        stats = {
            "events": len(events),
            "segments": sum(event["segmentCount"] for event in events),
            "clips": len(clips),
            "categories": category_counts,
        }
        return {
            "ok": True,
            "version": APP_VERSION,
            "source": {
                "root": str(source_root),
                "input": str(Path(raw_path).expanduser()),
                "name": source_root.name,
            },
            "stats": stats,
            "events": [public_event(event) for event in events],
        }


def pick_directory(title: str, initial_dir: str = "") -> str:
    if not initial_dir or not Path(initial_dir).is_dir():
        initial_dir = ""
    script = (
        "import sys, tkinter as tk\n"
        "from tkinter import filedialog\n"
        "root=tk.Tk()\n"
        "root.withdraw()\n"
        "root.attributes('-topmost', True)\n"
        "path=filedialog.askdirectory(title=sys.argv[1], initialdir=sys.argv[2] or None)\n"
        "root.destroy()\n"
        "print(path or '')\n"
    )
    creation_flags = 0
    if IS_WINDOWS:
        creation_flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    try:
        completed = subprocess.run(
            [sys.executable, "-c", script, title, initial_dir],
            capture_output=True,
            text=True,
            timeout=300,
            creationflags=creation_flags,
        )
    except Exception as exc:
        raise ViewerError(f"无法打开目录选择窗口：{exc}") from exc
    if completed.returncode != 0:
        message = completed.stderr.strip() or "目录选择窗口启动失败。"
        raise ViewerError(message)
    return completed.stdout.strip().splitlines()[-1] if completed.stdout.strip() else ""


def create_export_job(event_ids: list[str], destination: str) -> str:
    destination_path = Path(destination).expanduser()
    if not destination_path.is_dir():
        raise ViewerError("导出目标目录不存在。")
    destination_path = destination_path.resolve()

    with STATE_LOCK:
        source_root_value = STATE["source_root"]
        source_root = Path(source_root_value).resolve() if source_root_value else None
        event_store = dict(STATE["events"])

    if source_root and (destination_path == source_root or destination_path.is_relative_to(source_root)):
        raise ViewerError("导出目录不能位于 U 盘 TeslaCam 目录内。")

    selected_events = []
    for event_id in event_ids:
        event = event_store.get(event_id)
        if event:
            selected_events.append(event)
    if not selected_events:
        raise ViewerError("没有找到要导出的事件。")

    transfers: list[tuple[Path, Path]] = []
    seen_targets: set[str] = set()
    for event in selected_events:
        relative_files = list(event["_relativeFiles"]) + list(event["_relativeExtras"])
        for relative in relative_files:
            source = (source_root / relative).resolve() if source_root else relative
            target = (destination_path / relative).resolve()
            key = str(target).lower()
            if key in seen_targets:
                continue
            seen_targets.add(key)
            transfers.append((source, target))

    total_bytes = sum(source.stat().st_size for source, _ in transfers if source.is_file())
    job_id = hashlib.sha256(f"{time.time()}|{destination_path}".encode("utf-8")).hexdigest()[:20]
    job = {
        "id": job_id,
        "status": "running",
        "destination": str(destination_path),
        "totalFiles": len(transfers),
        "completedFiles": 0,
        "totalBytes": total_bytes,
        "copiedBytes": 0,
        "current": "",
        "error": "",
        "startedAt": datetime.now().isoformat(timespec="seconds"),
    }
    with STATE_LOCK:
        STATE["jobs"][job_id] = job

    worker = threading.Thread(
        target=run_export_job,
        args=(job_id, transfers),
        name=f"export-{job_id}",
        daemon=True,
    )
    worker.start()
    return job_id


def run_export_job(
    job_id: str,
    transfers: list[tuple[Path, Path]],
) -> None:
    try:
        for source, target in transfers:
            with STATE_LOCK:
                job = STATE["jobs"].get(job_id)
                if not job:
                    return
                job["current"] = source.name

            if not source.is_file():
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
            size = source.stat().st_size
            with STATE_LOCK:
                job = STATE["jobs"].get(job_id)
                if not job:
                    return
                job["completedFiles"] += 1
                job["copiedBytes"] += size
        with STATE_LOCK:
            job = STATE["jobs"].get(job_id)
            if job:
                job["status"] = "complete"
                job["current"] = ""
                job["finishedAt"] = datetime.now().isoformat(timespec="seconds")
    except Exception as exc:
        with STATE_LOCK:
            job = STATE["jobs"].get(job_id)
            if job:
                job["status"] = "error"
                job["error"] = str(exc)


class TeslaCamHandler(BaseHTTPRequestHandler):
    server_version = f"TeslaCamViewer/{APP_VERSION}"

    def log_message(self, format_string: str, *args: Any) -> None:
        if args and str(args[0]).startswith("GET /media/"):
            return
        if getattr(sys, "stderr", None) is None:
            return
        try:
            super().log_message(format_string, *args)
        except Exception:
            pass

    def do_GET(self) -> None:
        self.handle_request(head_only=False)

    def do_HEAD(self) -> None:
        self.handle_request(head_only=True)

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        try:
            body = self.read_json_body()
            if parsed.path == "/api/scan":
                result = scan_library(str(body.get("root", "")))
                self.send_json(result)
                return
            if parsed.path == "/api/pick-folder":
                kind = body.get("kind", "root")
                with STATE_LOCK:
                    initial_dir = str(STATE["source_root"] or STATE["input_path"] or "")
                if kind == "output":
                    title = "选择事件导出目录"
                    initial_dir = str(Path.home() / "Videos")
                else:
                    title = "选择 TeslaCam 目录或 U 盘根目录"
                selected = pick_directory(title, initial_dir)
                self.send_json({"ok": True, "path": selected, "canceled": not bool(selected)})
                return
            if parsed.path == "/api/export/start":
                event_ids = body.get("eventIds", [])
                if not isinstance(event_ids, list):
                    raise ViewerError("eventIds 格式不正确。")
                job_id = create_export_job([str(item) for item in event_ids], str(body.get("destination", "")))
                self.send_json({"ok": True, "jobId": job_id})
                return
            if parsed.path == "/api/export/status":
                job_id = str(body.get("jobId", ""))
                with STATE_LOCK:
                    job = STATE["jobs"].get(job_id)
                    payload = dict(job) if job else None
                if not payload:
                    raise ViewerError("找不到导出任务。")
                self.send_json({"ok": True, "job": payload})
                return
            self.send_json({"ok": False, "error": "接口不存在。"}, HTTPStatus.NOT_FOUND)
        except ViewerError as exc:
            self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
        except Exception as exc:
            self.send_json({"ok": False, "error": f"处理失败：{exc}"}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def handle_request(self, head_only: bool) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        try:
            if path == "/api/status":
                with STATE_LOCK:
                    self.send_json(
                        {
                            "ok": True,
                            "version": APP_VERSION,
                            "sourceRoot": STATE["source_root"],
                            "eventCount": len(STATE["events"]),
                        },
                        head_only=head_only,
                    )
                return
            if path == "/api/drives":
                self.send_json({"ok": True, "drives": list_drives()}, head_only=head_only)
                return
            if path == "/media/video":
                self.serve_media(parsed, head_only=head_only)
                return
            if path == "/media/thumb":
                self.serve_media(parsed, head_only=head_only, cache_seconds=3600)
                return
            if path == "/favicon.ico":
                self.send_response(HTTPStatus.NO_CONTENT)
                self.end_headers()
                return
            if path.startswith("/assets/"):
                self.serve_asset(path, head_only=head_only)
                return
            self.serve_asset("/index.html", head_only=head_only)
        except FileNotFoundError:
            self.send_error(HTTPStatus.NOT_FOUND)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            return
        except Exception as exc:
            safe_print(f"请求处理失败：{exc}")
            self.send_error(HTTPStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")

    def read_json_body(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length > 4 * 1024 * 1024:
            raise ViewerError("请求内容过大。")
        raw = self.rfile.read(length) if length else b"{}"
        try:
            data = json.loads(raw.decode("utf-8"))
        except Exception as exc:
            raise ViewerError("请求格式不正确。") from exc
        return data if isinstance(data, dict) else {}

    def send_json(
        self,
        payload: dict[str, Any],
        status: HTTPStatus = HTTPStatus.OK,
        head_only: bool = False,
    ) -> None:
        body = json_dumps(payload)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        if not head_only:
            self.wfile.write(body)

    def serve_asset(self, request_path: str, head_only: bool = False) -> None:
        if request_path.startswith("/assets/"):
            relative = request_path[len("/assets/"):] or "index.html"
        else:
            relative = request_path.lstrip("/") or "index.html"
        target = (WEB_DIR / relative).resolve()
        if target != WEB_DIR and WEB_DIR.resolve() not in target.parents:
            raise FileNotFoundError
        if not target.is_file():
            raise FileNotFoundError
        content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        if target.suffix.lower() in {".html", ".css", ".js"}:
            content_type += "; charset=utf-8"
        body = target.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Security-Policy", "default-src 'self'; media-src 'self' blob:; img-src 'self' data:; style-src 'self'; script-src 'self'")
        self.end_headers()
        if not head_only:
            self.wfile.write(body)

    def serve_media(
        self,
        parsed: urllib.parse.ParseResult,
        head_only: bool = False,
        cache_seconds: int = 300,
    ) -> None:
        query = urllib.parse.parse_qs(parsed.query)
        token = (query.get("id") or [""])[0]
        with STATE_LOCK:
            file_name = STATE["media"].get(token)
        if not file_name:
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        path = Path(file_name)
        if not path.is_file():
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        file_size = path.stat().st_size
        content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        range_header = self.headers.get("Range", "")
        start = 0
        end = max(file_size - 1, 0)
        status = HTTPStatus.OK
        if range_header.startswith("bytes="):
            range_value = range_header[6:].split(",", 1)[0]
            start_text, _, end_text = range_value.partition("-")
            try:
                if start_text:
                    start = int(start_text)
                if end_text:
                    end = min(int(end_text), file_size - 1)
                else:
                    end = file_size - 1
            except ValueError:
                self.send_error(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                return
            if start < 0 or start >= file_size or end < start:
                self.send_response(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                self.send_header("Content-Range", f"bytes */{file_size}")
                self.end_headers()
                return
            status = HTTPStatus.PARTIAL_CONTENT

        content_length = end - start + 1 if file_size else 0
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(content_length))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", f"private, max-age={cache_seconds}")
        self.send_header("X-Content-Type-Options", "nosniff")
        if status == HTTPStatus.PARTIAL_CONTENT:
            self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
        self.end_headers()
        if head_only or not file_size:
            return
        with path.open("rb") as stream:
            stream.seek(start)
            remaining = content_length
            while remaining > 0:
                chunk = stream.read(min(1024 * 1024, remaining))
                if not chunk:
                    break
                try:
                    self.wfile.write(chunk)
                except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
                    return
                remaining -= len(chunk)


def create_server(host: str, port: int) -> ThreadingHTTPServer:
    return ThreadingHTTPServer((host, port), TeslaCamHandler)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=APP_NAME)
    parser.add_argument("--host", default=DEFAULT_HOST, help="监听地址")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="监听端口")
    parser.add_argument("--no-browser", action="store_true", help="启动后不自动打开浏览器")
    parser.add_argument("--root", default="", help="启动后可直接扫描的 U 盘或 TeslaCam 路径")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.root:
        detected = next((drive for drive in list_drives() if drive.get("teslaCam")), None)
        if detected:
            args.root = str(Path(detected["path"]) / "TeslaCam")
    server = None
    actual_port = args.port
    for offset in range(20):
        try:
            actual_port = args.port + offset
            server = create_server(args.host, actual_port)
            break
        except OSError:
            continue
    if server is None:
        safe_print("无法启动本地服务，请检查端口是否被占用。")
        if IS_WINDOWS:
            report_fatal_error("无法启动本地服务，请检查端口是否被其他程序占用。")
        return 1

    url = f"http://{args.host}:{actual_port}/"
    if args.root:
        try:
            scan_library(args.root)
        except ViewerError as exc:
            safe_print(f"初始扫描失败：{exc}")
    safe_print(f"{APP_NAME} 已启动：{url}")
    safe_print("按 Ctrl+C 停止。")
    if not args.no_browser:
        threading.Timer(0.7, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    try:
        exit_code = main()
    except Exception:
        error_message = traceback.format_exc()
        safe_print(error_message)
        report_fatal_error(f"{APP_NAME} 启动失败：\n\n{error_message}")
        raise SystemExit(1)
    raise SystemExit(exit_code)
