@echo off
title ARGUS - AI Border Document Screening System Launcher
echo =====================================================================
echo    ARGUS - AI-Based Fake Identity & Document Screening System
echo    Smart India Hackathon 2026 - Problem Statement PS 26188
echo =====================================================================
echo.

echo [1/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "ARGUS Backend (FastAPI)" "%~dp0backend\run_backend.bat"

echo [2/3] Starting React Vite Frontend on http://localhost:5173 ...
start "ARGUS Frontend (React Vite)" "%~dp0frontend\run_frontend.bat"

echo [3/3] Waiting for servers to initialize...
timeout /t 5 /nobreak >nul

echo.
echo Opening ARGUS Border Control Dashboard in your default browser...
start http://localhost:5173

echo.
echo =====================================================================
echo    ARGUS is now LIVE!
echo    Backend API Docs: http://127.0.0.1:8000/docs
echo    Frontend Web UI:  http://localhost:5173
echo.
echo    Default Demo Credentials:
echo      - Passport Inspector:  BC-1001  / demo1234
echo      - Border Supervisor:   ADM-001  / demo1234
echo =====================================================================
echo You can minimize this window.
pause
