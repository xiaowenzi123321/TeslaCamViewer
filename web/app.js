(function () {
  "use strict";

  const ICONS = {
    car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18.4 7c-.3-.6-1-1-1.7-1H7.3c-.7 0-1.4.4-1.7 1L3.5 11.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/><path d="M6 11h12l-1.4-3H7.4z"/>',
    "folder-open": '<path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/>',
    refresh: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    "hard-drive": '<line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/><line x1="10" x2="10.01" y1="16" y2="16"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 12.5-9.17 4.16a2 2 0 0 1-1.66 0L2 12.5"/><path d="m22 17.5-9.17 4.16a2 2 0 0 1-1.66 0L2 17.5"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    columns: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    "skip-back": '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5"/>',
    "skip-forward": '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>',
    maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
    "video-off": '<path d="M10.66 6H14a2 2 0 0 1 2 2v2.34l1 1L22 8v8"/><path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2l10 10Z"/><line x1="2" x2="22" y1="2" y2="22"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
    crosshair: '<circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>'
  };

  const CATEGORY_LABELS = {
    sentry: "哨兵",
    saved: "已保存",
    recent: "最近",
    other: "其他"
  };

  const state = {
    library: null,
    events: [],
    activeEventId: null,
    activeCategory: "all",
    search: "",
    currentSegmentIndex: 0,
    videos: new Map(),
    playing: false,
    syncing: false,
    pendingSeek: null,
    playbackRate: 1,
    layout: "all",
    exportJobId: null
  };

  const elements = {
    sourceStatus: document.getElementById("sourceStatus"),
    sourceStatusText: document.getElementById("sourceStatusText"),
    refreshButton: document.getElementById("refreshButton"),
    chooseButton: document.getElementById("chooseButton"),
    librarySummary: document.getElementById("librarySummary"),
    libraryCount: document.getElementById("libraryCount"),
    categoryTabs: document.getElementById("categoryTabs"),
    searchInput: document.getElementById("searchInput"),
    eventList: document.getElementById("eventList"),
    setupView: document.getElementById("setupView"),
    viewerContent: document.getElementById("viewerContent"),
    rootInput: document.getElementById("rootInput"),
    scanButton: document.getElementById("scanButton"),
    rescanDrivesButton: document.getElementById("rescanDrivesButton"),
    driveList: document.getElementById("driveList"),
    eventCategory: document.getElementById("eventCategory"),
    eventTitle: document.getElementById("eventTitle"),
    eventDate: document.getElementById("eventDate"),
    eventTime: document.getElementById("eventTime"),
    eventSegments: document.getElementById("eventSegments"),
    incidentStrip: document.getElementById("incidentStrip"),
    incidentTime: document.getElementById("incidentTime"),
    incidentMeta: document.getElementById("incidentMeta"),
    incidentJumpButton: document.getElementById("incidentJumpButton"),
    exportButton: document.getElementById("exportButton"),
    cameraLayout: document.getElementById("cameraLayout"),
    videoGrid: document.getElementById("videoGrid"),
    stageEmpty: document.getElementById("stageEmpty"),
    previousButton: document.getElementById("previousButton"),
    playButton: document.getElementById("playButton"),
    playIcon: document.getElementById("playIcon"),
    nextButton: document.getElementById("nextButton"),
    timeCode: document.getElementById("timeCode"),
    durationCode: document.getElementById("durationCode"),
    progressInput: document.getElementById("progressInput"),
    rateSelect: document.getElementById("rateSelect"),
    fullscreenButton: document.getElementById("fullscreenButton"),
    segmentSummary: document.getElementById("segmentSummary"),
    segmentSection: document.getElementById("segmentSection"),
    segmentPosition: document.getElementById("segmentPosition"),
    segmentTrack: document.getElementById("segmentTrack"),
    eventItemTemplate: document.getElementById("eventItemTemplate"),
    segmentTemplate: document.getElementById("segmentTemplate"),
    toastStack: document.getElementById("toastStack")
  };

  document.querySelectorAll("[data-icon]").forEach((node) => {
    node.innerHTML = icon(node.dataset.icon);
  });

  function icon(name) {
    const path = ICONS[name] || ICONS.alert;
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function api(path, options = {}) {
    const response = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...options
    });
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new Error(`请求失败 (${response.status})`);
    }
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.error || `请求失败 (${response.status})`);
    }
    return payload;
  }

  function showToast(title, message = "", options = {}) {
    const toast = document.createElement("div");
    toast.className = `toast${options.error ? " is-error" : ""}`;
    toast.innerHTML = `
      <div class="toast-title">${icon(options.error ? "alert" : "check")}${escapeHtml(title)}</div>
      ${message ? `<div class="toast-message">${escapeHtml(message)}</div>` : ""}
      ${options.progress ? '<div class="toast-progress"><span></span></div>' : ""}
    `;
    elements.toastStack.appendChild(toast);
    const duration = options.duration ?? 3600;
    if (duration > 0) {
      setTimeout(() => toast.remove(), duration);
    }
    return toast;
  }

  function formatDate(isoValue) {
    const date = new Date(isoValue);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short"
    }).format(date);
  }

  function formatTime(isoValue) {
    const date = new Date(isoValue);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(date);
  }

  function formatDuration(seconds) {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const rest = safe % 60;
    if (hours) {
      return `${hours} 小时 ${minutes} 分`;
    }
    if (minutes) {
      return `${minutes} 分 ${rest} 秒`;
    }
    return `${rest} 秒`;
  }

  function formatClock(seconds) {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const rest = safe % 60;
    return [hours, minutes, rest].map((part) => String(part).padStart(2, "0")).join(":");
  }

  function dateKey(isoValue) {
    const date = new Date(isoValue);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  function setSourceStatus(text, ready = false) {
    elements.sourceStatusText.textContent = text;
    elements.sourceStatus.classList.toggle("is-ready", ready);
  }

  function setButtonIcon(node, name) {
    node.innerHTML = icon(name);
  }

  async function loadDrives() {
    elements.driveList.innerHTML = '<div class="loading-line"><span class="spinner"></span>正在检测</div>';
    try {
      const payload = await api("/api/drives");
      renderDrives(payload.drives || []);
    } catch (error) {
      elements.driveList.innerHTML = `<div class="empty-line">${escapeHtml(error.message)}</div>`;
    }
  }

  function renderDrives(drives) {
    if (!drives.length) {
      elements.driveList.innerHTML = '<div class="empty-line">请手动输入 U 盘路径</div>';
      return;
    }
    const fragment = document.createDocumentFragment();
    drives.forEach((drive) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `drive-card${drive.teslaCam ? " is-tesla" : ""}`;
      const typeLabel = drive.removable ? "可移动磁盘" : "本地磁盘";
      button.innerHTML = `
        <span class="drive-icon">${icon("hard-drive")}</span>
        <span class="drive-copy">
          <strong>${escapeHtml(drive.label || drive.path)}</strong>
          <span>${escapeHtml(`${drive.path} · ${typeLabel}`)}</span>
        </span>
        <span class="drive-tag${drive.teslaCam ? "" : " subtle"}">${drive.teslaCam ? "TeslaCam" : "打开"}</span>
      `;
      button.addEventListener("click", () => {
        elements.rootInput.value = drive.teslaCam ? `${drive.path}TeslaCam` : drive.path;
        scanPath(elements.rootInput.value);
      });
      fragment.appendChild(button);
    });
    elements.driveList.replaceChildren(fragment);
  }

  async function chooseFolder(kind) {
    try {
      const payload = await api("/api/pick-folder", {
        method: "POST",
        body: JSON.stringify({ kind })
      });
      return payload.canceled ? "" : payload.path;
    } catch (error) {
      showToast("无法打开目录选择窗口", error.message, { error: true });
      return "";
    }
  }

  async function scanPath(path) {
    const root = String(path || "").trim();
    if (!root) {
      showToast("请输入或选择目录", "例如 E:\\ 或 E:\\TeslaCam", { error: true });
      return;
    }
    setSourceStatus("正在读取 U 盘", false);
    elements.scanButton.disabled = true;
    try {
      const payload = await api("/api/scan", {
        method: "POST",
        body: JSON.stringify({ root })
      });
      state.library = payload;
      state.events = payload.events || [];
      state.activeEventId = null;
      state.activeCategory = "all";
      state.search = "";
      elements.searchInput.value = "";
      document.querySelectorAll(".category-tab").forEach((tab) => {
        tab.classList.toggle("is-active", tab.dataset.category === "all");
      });
      elements.rootInput.value = payload.source.root;
      setSourceStatus(payload.source.root, true);
      elements.refreshButton.disabled = false;
      elements.libraryCount.textContent = String(payload.stats.events);
      elements.librarySummary.textContent = `${payload.stats.events} 个事件 · ${payload.stats.clips} 个片段`;
      elements.setupView.hidden = true;
      elements.viewerContent.hidden = false;
      renderEventList();
      if (state.events.length) {
        const initialEvent = state.events.find((event) => event.incident) || state.events[0];
        openEvent(initialEvent.id, false);
      }
      showToast("读取完成", `找到 ${payload.stats.events} 个事件，共 ${payload.stats.clips} 个视频片段。`);
    } catch (error) {
      setSourceStatus("读取失败", false);
      showToast("读取失败", error.message, { error: true });
    } finally {
      elements.scanButton.disabled = false;
    }
  }

  function filteredEvents() {
    const query = state.search.trim().toLowerCase();
    return state.events.filter((event) => {
      if (state.activeCategory !== "all" && event.category !== state.activeCategory) {
        return false;
      }
      if (!query) return true;
      const haystack = [
        event.title,
        event.folder,
        event.reasonLabel,
        formatDate(event.time),
        formatTime(event.time)
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }

  function renderEventList() {
    const events = filteredEvents();
    if (!events.length) {
      elements.eventList.innerHTML = '<div class="sidebar-placeholder">没有匹配的时间节点</div>';
      return;
    }
    const fragment = document.createDocumentFragment();
    let lastDate = "";
    events.forEach((event) => {
      const currentDate = dateKey(event.time);
      if (currentDate !== lastDate) {
        lastDate = currentDate;
        const heading = document.createElement("div");
        heading.className = "date-heading";
        heading.textContent = formatDate(event.time);
        fragment.appendChild(heading);
      }
      const item = elements.eventItemTemplate.content.firstElementChild.cloneNode(true);
      item.dataset.eventId = event.id;
      item.classList.toggle("is-active", event.id === state.activeEventId);
      const image = item.querySelector("img");
      if (event.thumbnailUrl) {
        image.src = event.thumbnailUrl;
        image.alt = "";
        image.addEventListener("error", () => {
          image.dataset.empty = "true";
        });
      } else {
        image.dataset.empty = "true";
      }
      const pill = item.querySelector(".event-pill");
      pill.dataset.category = event.category;
      pill.textContent = CATEGORY_LABELS[event.category] || "视频";
      item.querySelector(".event-item-duration").textContent = event.incident
        ? `案件 ${formatTime(event.incident.time)}`
        : `${event.segmentCount} 段`;
      item.querySelector(".event-item-time").textContent = formatTime(event.time);
      const reason = event.reasonLabel || event.city || event.categoryLabel;
      item.querySelector(".event-item-detail").textContent = `${reason} · ${event.cameraCount} 路`;
      item.addEventListener("click", () => openEvent(event.id, false));
      fragment.appendChild(item);
    });
    elements.eventList.replaceChildren(fragment);
  }

  function activeEvent() {
    return state.events.find((event) => event.id === state.activeEventId) || null;
  }

  function openEvent(eventId, autoplay) {
    const event = state.events.find((item) => item.id === eventId);
    if (!event) return;
    pauseAll();
    state.activeEventId = eventId;
    state.currentSegmentIndex = 0;
    renderEventList();
    renderEventHeader(event);
    renderVideoGrid(event);
    renderSegmentTrack(event);
    const incident = event.incident;
    const startIndex = incident ? incident.segmentIndex : 0;
    const startOffset = incident ? incident.offset : null;
    loadSegment(startIndex, Boolean(autoplay), startOffset);
  }

  function renderEventHeader(event) {
    elements.eventCategory.dataset.category = event.category;
    elements.eventCategory.textContent = event.categoryLabel;
    elements.eventTitle.textContent = `${event.title} · ${formatTime(event.time)}`;
    elements.eventDate.textContent = formatDate(event.time);
    elements.eventTime.textContent =
      `${formatTime(event.recordingStart || event.time)} - ${formatTime(event.recordingEnd || event.endTime)}`;
    elements.eventSegments.textContent = `${event.segmentCount} 个时间节点 · ${event.cameraCount} 路视频`;
    elements.segmentSummary.textContent = event.reasonLabel || event.city || `${event.estimatedDuration ? `约 ${formatDuration(event.estimatedDuration)}` : ""}`;
    renderIncidentPoint(event);
  }

  function renderIncidentPoint(event) {
    const incident = event.incident;
    elements.incidentStrip.hidden = !incident;
    if (!incident) return;
    elements.incidentTime.textContent = formatTime(incident.time);
    const details = [
      event.reasonLabel,
      event.city,
      `录像 ${formatTime(event.recordingStart || event.time)} - ${formatTime(event.recordingEnd || event.endTime)}`
    ].filter(Boolean);
    elements.incidentMeta.textContent = details.join(" · ");
  }

  function camerasForDisplay(event) {
    const firstSegment = event.segments[0];
    if (!firstSegment) return [];
    let keys = [...event.cameraKeys];
    if (state.layout === "four") {
      const preferred = ["front", "left_repeater", "right_repeater", "back"];
      keys = preferred.filter((key) => event.cameraKeys.includes(key));
      if (keys.length < 4) {
        event.cameraKeys.forEach((key) => {
          if (keys.length < 4 && !keys.includes(key)) keys.push(key);
        });
      }
    }
    return keys.slice(0, state.layout === "four" ? 4 : 8);
  }

  function renderVideoGrid(event) {
    const cameraKeys = camerasForDisplay(event);
    const fragment = document.createDocumentFragment();
    state.videos.clear();
    cameraKeys.forEach((cameraKey) => {
      const camera = event.segments[0]?.cameras[cameraKey];
      const cell = document.createElement("div");
      cell.className = "video-cell";
      cell.dataset.camera = cameraKey;
      cell.innerHTML = `
        <video playsinline muted preload="metadata"></video>
        <span class="video-label">${escapeHtml(camera?.label || cameraKey)}</span>
        <span class="video-tools">
          <button class="video-tool" type="button" title="全屏">${icon("maximize")}</button>
        </span>
      `;
      const video = cell.querySelector("video");
      state.videos.set(cameraKey, video);
      video.addEventListener("timeupdate", onMasterTimeUpdate);
      video.addEventListener("play", updatePlayState);
      video.addEventListener("pause", updatePlayState);
      video.addEventListener("loadedmetadata", () => {
        video.playbackRate = state.playbackRate;
        updateTimelineUI();
      });
      video.addEventListener("ended", () => {
        if (video === masterVideo()) nextSegment(true);
      });
      cell.querySelector(".video-tool").addEventListener("click", () => toggleVideoFullscreen(cell));
      fragment.appendChild(cell);
    });
    elements.videoGrid.replaceChildren(fragment);
    elements.stageEmpty.hidden = cameraKeys.length > 0;
  }

  function renderSegmentTrack(event) {
    const fragment = document.createDocumentFragment();
    event.segments.forEach((segment, index) => {
      const chip = elements.segmentTemplate.content.firstElementChild.cloneNode(true);
      chip.dataset.index = String(index);
      chip.classList.toggle("is-active", index === state.currentSegmentIndex);
      chip.classList.toggle("is-incident", event.incident?.segmentIndex === index);
      chip.querySelector(".segment-chip-time").textContent = formatTime(segment.timestamp);
      chip.querySelector(".segment-chip-detail").textContent =
        event.incident?.segmentIndex === index ? "案件时间点" : `${segment.cameraOrder.length} 路镜头`;
      chip.addEventListener("click", () => loadSegment(index, true));
      fragment.appendChild(chip);
    });
    elements.segmentTrack.replaceChildren(fragment);
    updateSegmentPosition();
  }

  function updateSegmentPosition() {
    const event = activeEvent();
    if (!event) return;
    elements.segmentPosition.textContent = `${state.currentSegmentIndex + 1} / ${event.segmentCount}`;
    elements.segmentTrack.querySelectorAll(".segment-chip").forEach((chip, index) => {
      chip.classList.toggle("is-active", index === state.currentSegmentIndex);
    });
    const activeChip = elements.segmentTrack.querySelector(".segment-chip.is-active");
    activeChip?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  function loadSegment(index, autoplay = false, seekOffset = null) {
    const event = activeEvent();
    if (!event || index < 0 || index >= event.segmentCount) return;
    pauseAll();
    state.pendingSeek = Number.isFinite(seekOffset) ? Math.max(0, seekOffset) : null;
    state.currentSegmentIndex = index;
    updateSegmentPosition();
    const segment = event.segments[index];
    let readyCount = 0;
    const cameraKeys = camerasForDisplay(event);
    cameraKeys.forEach((cameraKey) => {
      const video = state.videos.get(cameraKey);
      const camera = segment.cameras[cameraKey];
      if (!video) return;
      video.onloadeddata = null;
      if (!camera) {
        video.removeAttribute("src");
        video.load();
        return;
      }
      video.src = camera.url;
      video.load();
      video.onloadeddata = () => {
        readyCount += 1;
        if (state.pendingSeek !== null) {
          try {
            video.currentTime = state.pendingSeek;
          } catch {
            // Ignore a seek if the browser is still preparing this angle.
          }
          state.pendingSeek = null;
          updateTimelineUI();
        }
        if (autoplay && readyCount === 1) {
          playAll();
        }
      };
    });
    updateTimelineUI();
    if (autoplay && cameraKeys.length === 0) {
      updatePlayState();
    }
  }

  function masterVideo() {
    for (const video of state.videos.values()) {
      if (video.src) return video;
    }
    return null;
  }

  function onMasterTimeUpdate(event) {
    const master = masterVideo();
    if (!master || event.target !== master || state.syncing) return;
    const currentTime = master.currentTime;
    if (!master.seeking) {
      state.videos.forEach((video) => {
        if (video === master || !video.src || video.readyState < 1) return;
        if (Math.abs(video.currentTime - currentTime) > 0.28) {
          video.currentTime = currentTime;
        }
      });
    }
    updateTimelineUI();
  }

  function playAll() {
    const videos = [...state.videos.values()].filter((video) => video.src);
    if (!videos.length) return;
    state.playing = true;
    videos.forEach((video) => {
      video.playbackRate = state.playbackRate;
      const promise = video.play();
      if (promise?.catch) {
        promise.catch(() => {
          state.playing = false;
          updatePlayState();
        });
      }
    });
    updatePlayState();
  }

  function pauseAll() {
    state.videos.forEach((video) => video.pause());
    state.playing = false;
    updatePlayState();
  }

  function togglePlay() {
    if (state.playing) {
      pauseAll();
    } else {
      const master = masterVideo();
      if (master?.ended) {
        seekFraction(0);
      }
      playAll();
    }
  }

  function updatePlayState() {
    const master = masterVideo();
    const anyPlaying = [...state.videos.values()].some((video) => !video.paused && !video.ended);
    state.playing = anyPlaying;
    elements.playButton.setAttribute("aria-label", anyPlaying ? "暂停" : "播放");
    elements.playButton.title = anyPlaying ? "暂停" : "播放";
    setButtonIcon(elements.playIcon, anyPlaying ? "pause" : "play");
    if (master) master.playbackRate = state.playbackRate;
  }

  function updateTimelineUI() {
    const master = masterVideo();
    if (!master || !Number.isFinite(master.duration) || master.duration <= 0) {
      elements.progressInput.value = "0";
      elements.timeCode.textContent = "00:00:00";
      elements.durationCode.textContent = "00:00:00";
      return;
    }
    const segment = activeEvent()?.segments[state.currentSegmentIndex];
    const segmentStart = segment ? new Date(segment.timestamp).getTime() : 0;
    const currentEvent = activeEvent();
    const eventStart = currentEvent
      ? new Date(currentEvent.recordingStart || currentEvent.time).getTime()
      : segmentStart;
    const elapsed = Math.max(0, (segmentStart - eventStart) / 1000 + master.currentTime);
    elements.progressInput.value = String(Math.round((master.currentTime / master.duration) * 1000));
    elements.timeCode.textContent = formatClock(elapsed);
    elements.durationCode.textContent = formatClock(master.duration);
  }

  function seekFraction(fraction) {
    const master = masterVideo();
    if (!master || !Number.isFinite(master.duration) || master.duration <= 0) return;
    const time = Math.max(0, Math.min(1, fraction)) * master.duration;
    state.syncing = true;
    state.videos.forEach((video) => {
      if (!video.src || video.readyState < 1) return;
      try {
        video.currentTime = time;
      } catch {
        // Some browsers reject seeks until metadata is available.
      }
    });
    state.syncing = false;
    updateTimelineUI();
  }

  function previousSegment() {
    const master = masterVideo();
    if (master && master.currentTime > 2) {
      seekFraction(0);
      return;
    }
    if (state.currentSegmentIndex > 0) {
      loadSegment(state.currentSegmentIndex - 1, state.playing);
    }
  }

  function nextSegment(autoplay = false) {
    const event = activeEvent();
    if (!event) return;
    if (state.currentSegmentIndex < event.segmentCount - 1) {
      loadSegment(state.currentSegmentIndex + 1, autoplay || state.playing);
    } else {
      pauseAll();
    }
  }

  function toggleVideoFullscreen(cell) {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      cell.requestFullscreen?.();
    }
  }

  async function togglePageFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.getElementById("cameraStage").requestFullscreen?.();
    }
  }

  async function exportActiveEvent() {
    const event = activeEvent();
    if (!event) return;
    const destination = await chooseFolder("output");
    if (!destination) return;
    try {
      const payload = await api("/api/export/start", {
        method: "POST",
        body: JSON.stringify({ eventIds: [event.id], destination })
      });
      state.exportJobId = payload.jobId;
      const toast = showToast("正在导出事件", destination, { progress: true, duration: 0 });
      const fill = toast.querySelector(".toast-progress span");
      const message = toast.querySelector(".toast-message");
      const poll = async () => {
        try {
          const result = await api("/api/export/status", {
            method: "POST",
            body: JSON.stringify({ jobId: state.exportJobId })
          });
          const job = result.job;
          const ratio = job.totalBytes ? job.copiedBytes / job.totalBytes : job.completedFiles / Math.max(job.totalFiles, 1);
          fill.style.width = `${Math.min(100, ratio * 100)}%`;
          message.textContent = job.status === "running"
            ? `${job.completedFiles} / ${job.totalFiles} 个文件`
            : destination;
          if (job.status === "running") {
            setTimeout(poll, 500);
          } else {
            toast.remove();
            if (job.status === "complete") {
              showToast("导出完成", `${job.totalFiles} 个文件已保存到 ${job.destination}`);
            } else {
              showToast("导出失败", job.error || "未知错误", { error: true });
            }
          }
        } catch (error) {
          toast.remove();
          showToast("导出状态读取失败", error.message, { error: true });
        }
      };
      setTimeout(poll, 300);
    } catch (error) {
      showToast("无法开始导出", error.message, { error: true });
    }
  }

  elements.chooseButton.addEventListener("click", async () => {
    const selected = await chooseFolder("root");
    if (selected) {
      elements.rootInput.value = selected;
      scanPath(selected);
    }
  });

  elements.refreshButton.addEventListener("click", () => {
    const root = state.library?.source?.root || elements.rootInput.value;
    if (root) scanPath(root);
  });

  elements.scanButton.addEventListener("click", () => scanPath(elements.rootInput.value));
  elements.rootInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") scanPath(elements.rootInput.value);
  });
  elements.rescanDrivesButton.addEventListener("click", loadDrives);

  elements.categoryTabs.addEventListener("click", (event) => {
    const button = event.target.closest(".category-tab");
    if (!button) return;
    state.activeCategory = button.dataset.category;
    elements.categoryTabs.querySelectorAll(".category-tab").forEach((tab) => {
      tab.classList.toggle("is-active", tab === button);
    });
    renderEventList();
  });

  let searchTimer = 0;
  elements.searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = elements.searchInput.value;
      renderEventList();
    }, 120);
  });

  elements.cameraLayout.addEventListener("click", (event) => {
    const button = event.target.closest(".layout-button");
    if (!button || button.dataset.layout === state.layout) return;
    state.layout = button.dataset.layout;
    elements.cameraLayout.querySelectorAll(".layout-button").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });
    const currentEvent = activeEvent();
    if (currentEvent) {
      renderVideoGrid(currentEvent);
      loadSegment(state.currentSegmentIndex, false);
    }
  });

  elements.playButton.addEventListener("click", togglePlay);
  elements.previousButton.addEventListener("click", previousSegment);
  elements.nextButton.addEventListener("click", () => nextSegment(true));
  elements.progressInput.addEventListener("input", () => {
    seekFraction(Number(elements.progressInput.value) / 1000);
  });
  elements.rateSelect.addEventListener("change", () => {
    state.playbackRate = Number(elements.rateSelect.value);
    state.videos.forEach((video) => {
      video.playbackRate = state.playbackRate;
    });
  });
  elements.fullscreenButton.addEventListener("click", togglePageFullscreen);
  elements.incidentJumpButton.addEventListener("click", () => {
    const event = activeEvent();
    if (!event?.incident) return;
    loadSegment(event.incident.segmentIndex, false, event.incident.offset);
  });
  elements.exportButton.addEventListener("click", exportActiveEvent);

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) return;
    if (!activeEvent()) return;
    if (event.code === "Space") {
      event.preventDefault();
      togglePlay();
    } else if (event.code === "ArrowLeft") {
      event.preventDefault();
      previousSegment();
    } else if (event.code === "ArrowRight") {
      event.preventDefault();
      nextSegment(true);
    }
  });

  loadDrives();
  api("/api/status")
    .then((payload) => {
      if (payload.sourceRoot && payload.eventCount) {
        scanPath(payload.sourceRoot);
      }
    })
    .catch(() => {});
})();
