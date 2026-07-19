@echo off
setlocal
cd /d "%~dp0"

where node.exe >nul 2>&1
if errorlevel 1 (
  echo Node.js is required to run this website.
  echo Install it from https://nodejs.org/ and try again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing website dependencies...
  call npm.cmd install
  if errorlevel 1 (
    echo Installation failed.
    pause
    exit /b 1
  )
)

set "WRANGLER_LOG_PATH=.wrangler/wrangler.log"
set "SITE_URL=http://localhost:4318"
echo Starting Coat Ready at %SITE_URL%
start "" powershell.exe -NoProfile -WindowStyle Hidden -Command "$url='%SITE_URL%'; for ($i=0; $i -lt 60; $i++) { try { $response=Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 1; if ($response.StatusCode -eq 200) { Start-Process $url; exit } } catch {}; Start-Sleep -Milliseconds 500 }"
call npx.cmd vinext dev --port 4318

endlocal
