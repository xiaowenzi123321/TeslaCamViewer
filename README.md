# TeslaCam 本地查看器

直接在 Windows 电脑上读取特斯拉行车记录 U 盘，不需要把视频上传到云端。

## 使用

1. 将 U 盘连接到电脑。
2. 双击 `start_teslacam_viewer.bat`。
3. 浏览器打开后选择 U 盘根目录，例如 `E:\`，或选择 `E:\TeslaCam`。
4. 左侧按“哨兵 / 已保存 / 最近”和事件时间节点浏览；右侧同时显示可用的摄像头，并保持同步播放。

程序只会读取视频。导出时会把原事件目录复制到指定位置，不会修改或删除 U 盘内容。

## 案件时间点

- 程序直接读取事件目录内 `event.json` 的 `timestamp`，它就是案件时间点。
- 打开事件时会自动定位到包含该时间的视频段和具体秒数。
- 文件夹名时间和案件时间点不同时，以 `event.json` 内的时间为准。

## 支持的内容

- `SentryClips`
- `SavedClips`
- `RecentClips`
- 常见 4 路、6 路和 8 路 TeslaCam 文件命名
- 事件的 `event.json` 和 `thumb.png`
- 浏览器支持 MP4/H.264。极少数旧款浏览器可能无法播放 H.265 视频。

## 手动启动

```powershell
python TeslaCamViewer.py
```

默认只在本机运行，地址为 `http://127.0.0.1:8765/`。如果端口被占用，程序会自动改用后面的端口。
