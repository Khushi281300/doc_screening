@echo off
title CHRONICLE - Launcher (PS 26190)
cd /d "%~dp0"
echo =====================================================================
echo    CHRONICLE - Secure Digital Document Management System
echo    Ministry of Home Affairs / NCRB  -  Smart India Hackathon 2026
echo =====================================================================
echo.
call "%~dp0find_node.bat" || exit /b 1

if not exist "backend\venv\Scripts\python.exe" (
    echo [ERROR] Backend not set up yet. Run setup.bat first.
    pause
    exit /b 1
)
if not exist "frontend\node_modules\vite" (
    echo Frontend packages missing - installing ...
    pushd frontend
    call npm install
    popd
)

echo [1/3] Starting backend on http://127.0.0.1:8000 ...
start "CHRONICLE Backend" "%~dp0backend\run_backend.bat"
echo [2/3] Starting web UI on http://localhost:5173 ...
start "CHRONICLE Frontend" "%~dp0frontend\run_frontend.bat"
echo [3/3] Waiting for servers ...
timeout /t 8 /nobreak >nul
start http://localhost:5173
echo.
echo    Web UI   : http://localhost:5173
echo    API docs : http://127.0.0.1:8000/api/v1/docs
echo.
echo    Demo logins (password demo1234):
echo      IO-1001  Investigating Officer      SHO-001  Station House Officer
echo      FSL-008  Forensic Lab               PP-021   Public Prosecutor
echo      MAG-004  Magistrate / Court
echo.
echo    Keep the two server windows open. Close them to stop.
echo =====================================================================
pause
