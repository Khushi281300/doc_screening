@echo off
title CHRONICLE Frontend - React UI
cd /d "%~dp0"
echo =========================================================
echo    CHRONICLE - Web UI (React + Vite)
echo =========================================================
echo.
call "%~dp0..\find_node.bat" || (pause & exit /b 1)

if not exist "node_modules\vite" (
    echo Installing packages, first run ...
    call npm install
)

echo Starting on http://localhost:5173 ...
call npm run dev
echo.
echo [FRONTEND STOPPED]
pause
