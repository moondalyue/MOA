@echo off
setlocal
cd /d "%~dp0"
set "MOA_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "MOA_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "node_modules\next\dist\bin\next" (
  echo Install dependencies first: npm ci
  pause
  exit /b 1
)
echo Starting MOA. Keep this window open.
echo Open http://localhost:3000 in your browser.
"%MOA_NODE%" "node_modules\next\dist\bin\next" dev
pause
