@echo off
title AEGIS - AI Border Document Screening System Launcher
echo =====================================================================
echo    AEGIS - AI-Based Fake Identity & Document Screening System
echo    Smart India Hackathon 2026 - Problem Statement PS 26188
echo =====================================================================
echo.
echo [1/4] Ensuring Ollama Local LLM service is running...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting Ollama background engine...
    start "" /b "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" serve
    timeout /t 2 /nobreak >nul
)

echo [2/4] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "AEGIS Backend (FastAPI)" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [3/4] Starting React Vite Frontend on http://localhost:5173 ...
start "AEGIS Frontend (React Vite)" cmd /k "cd frontend && npm run dev"

echo [4/4] Waiting for services to initialize...
timeout /t 3 /nobreak >nul

echo.
echo Opening AEGIS Border Control Dashboard in your browser...
start http://localhost:5173

echo.
echo =====================================================================
echo    AEGIS is now LIVE!
echo    Backend API Docs: http://127.0.0.1:8000/docs
echo    Frontend Web UI:  http://localhost:5173
echo =====================================================================
echo Leave this window or close it at any time. The servers run in their own windows.
pause
