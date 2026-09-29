@echo off
title CHRONICLE Backend - API server
cd /d "%~dp0"
echo =========================================================
echo    CHRONICLE - API server (FastAPI)
echo =========================================================
echo.
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo [WARNING] venv not found - using system Python. Run setup.bat to fix.
)
echo Starting on http://127.0.0.1:8000 ...
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
echo.
echo [SERVER STOPPED]
pause
