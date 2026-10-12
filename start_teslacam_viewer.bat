@echo off
setlocal
cd /d "%~dp0"

where pythonw >nul 2>nul
if %errorlevel%==0 (
  start "" pythonw "%~dp0TeslaCamViewer.py"
  exit /b 0
)

where python >nul 2>nul
if %errorlevel%==0 (
  python "%~dp0TeslaCamViewer.py"
  exit /b %errorlevel%
)

echo Python was not found. Install Python 3.10 or newer and try again.
pause
exit /b 1
