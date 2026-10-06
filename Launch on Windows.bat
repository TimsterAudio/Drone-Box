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
set "DRONEBOX_PAGE=%DIR%drone-box.html"
if not exist "%DRONEBOX_PAGE%" goto :missing

rem The page's address. PowerShell builds it as a fully encoded file URL (spaces,
rem quotes, brackets and & all %-encoded), and it's passed to the browser WITHOUT
rem quotes: a quoted address in a folder with spaces can reach the browser with the
rem quotes still attached, and the browser then opens its home page instead.
rem ARGS is only ever read as !ARGS! (delayed expansion), so the % codes in it are
rem never re-read as batch variables.
set "FLAGS=--window-size=1920,930 --window-position=0,0 --no-first-run --no-default-browser-check"
set "ARGS="
for /f "usebackq delims=" %%U in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$u=([System.Uri]$env:DRONEBOX_PAGE).AbsoluteUri; [regex]::Replace($u, '[&()^!,;=''\s]', [System.Text.RegularExpressions.MatchEvaluator]{ param($m) '%%{0:X2}' -f [int][char]$m.Value })" 2^>nul`) do set "ARGS=--app=%%U %FLAGS%"
rem No PowerShell (very old Windows): fall back to the quoted address.
if not defined ARGS set ARGS=--app="file:///%DIR:\=/%drone-box.html" %FLAGS%
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
if defined DRONEBOX_DRYRUN goto :dryFallback
timeout /t 2 >nul
start "" "%DRONEBOX_PAGE%"
goto :eof
:dryFallback
echo Fallback: "%DRONEBOX_PAGE%"
goto :eof

:missing
echo Can't find drone-box.html next to this launcher:
echo   %DIR%
echo If you opened the zip without extracting it, choose "Extract All" first,
echo then run the launcher from the extracted folder.
pause
goto :eof

rem Launch the default browser only if it's one that supports app mode.
:tryDefault
for %%K in (chrome.exe msedge.exe brave.exe vivaldi.exe) do if /i "%~nx1"=="%%K" if exist "%~1" call :launch "%~1"
exit /b

:launch
set "LAUNCHED=1"
setlocal EnableDelayedExpansion
if defined DRONEBOX_DRYRUN (echo Launch: %1 !ARGS!) else (start "" %1 !ARGS!)
endlocal
exit /b
