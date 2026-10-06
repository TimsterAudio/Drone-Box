@echo off
setlocal

rem Launches Drone Box in a clean, stand-alone window (no toolbar, address bar,
rem tabs or bookmarks) using a Chromium-based browser's "app mode".
rem The window is 1920x930, which leaves a 1920x900 page area under the title bar.

set "DIR=%~dp0"
set "INDEX=file:///%DIR:\=/%drone-box.html"
set "ARGS=--app="%INDEX%" --window-size=1920,930 --window-position=0,0"

for %%B in (
  "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
  "%LocalAppData%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
  "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
  "%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe"
  "%LocalAppData%\BraveSoftware\Brave-Browser\Application\brave.exe"
) do (
  if exist %%B (
    start "" %%B %ARGS%
    goto :eof
  )
)

echo No Chrome, Edge or Brave installation found in the usual locations.
echo Opening in your default browser instead. It will show normal browser controls.
timeout /t 2 >nul
start "" "%INDEX%"
