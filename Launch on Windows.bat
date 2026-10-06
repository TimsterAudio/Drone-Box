@echo off
setlocal

rem Launches Drone Box in a clean, stand-alone window (no toolbar, address bar,
rem tabs or bookmarks) using a Chromium-based browser's "app mode".
rem The window is 1920x930, which leaves a 1920x900 page area under the title bar.
rem
rem Browser choice: your default browser if it's Chromium-based (Chrome, Edge,
rem Brave, Vivaldi); otherwise the first of Edge, Chrome, Brave or Vivaldi that's
rem installed. Set DRONEBOX_DRYRUN=1 to print the choice instead of launching.

set "DIR=%~dp0"
set "INDEX=file:///%DIR:\=/%drone-box.html"
set "ARGS=--app="%INDEX%" --window-size=1920,930 --window-position=0,0 --no-first-run --no-default-browser-check"
set "LAUNCHED="

rem 1. Your default browser. Windows keeps it in the registry; PowerShell reads it
rem    and prints that browser's .exe path.
set "DEFAULT_EXE="
for /f "usebackq delims=" %%E in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$q=[char]34; $p=$null; foreach ($k in 'UserChoiceLatest','UserChoice') { if (-not $p) { $p=(Get-ItemProperty ('HKCU:\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\https\' + $k) -ErrorAction SilentlyContinue).ProgId } }; if ($p) { $c=(Get-ItemProperty ('Registry::HKEY_CLASSES_ROOT\' + $p + '\shell\open\command') -ErrorAction SilentlyContinue).'(default)'; if ($c -match ('^\s*' + $q + '([^' + $q + ']+)' + $q)) { $matches[1] } elseif ($c -match '^\s*(\S+)') { $matches[1] } }" 2^>nul`) do set "DEFAULT_EXE=%%E"
if defined DEFAULT_EXE call :tryDefault "%DEFAULT_EXE%"
if defined LAUNCHED goto :eof

rem 2. Otherwise the first Chromium-based browser installed in the usual places.
for %%B in (
  "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
  "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
  "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
  "%LocalAppData%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe"
  "%LocalAppData%\BraveSoftware\Brave-Browser\Application\brave.exe"
  "%LocalAppData%\Vivaldi\Application\vivaldi.exe"
) do if not defined LAUNCHED if exist %%B call :launch %%B
if defined LAUNCHED goto :eof

echo No Chrome, Edge, Brave or Vivaldi installation found in the usual locations.
echo Opening in your default browser instead. It will show normal browser controls.
if defined DRONEBOX_DRYRUN (echo Fallback: "%INDEX%") else (timeout /t 2 >nul & start "" "%INDEX%")
goto :eof

rem Launch the default browser only if it's one that supports app mode.
:tryDefault
for %%K in (chrome.exe msedge.exe brave.exe vivaldi.exe) do if /i "%~nx1"=="%%K" if exist "%~1" call :launch "%~1"
exit /b

:launch
set "LAUNCHED=1"
if defined DRONEBOX_DRYRUN (echo Launch: %1 %ARGS%) else (start "" %1 %ARGS%)
exit /b
