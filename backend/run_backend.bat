@echo off
title ARGUS Backend - FastAPI Server
cd /d "%~dp0"
echo =========================================================
echo    ARGUS Border Screening Backend (FastAPI)
echo =========================================================
echo.

if exist "venv\Scripts\activate.bat" (
    echo Activating Python Virtual Environment...
    call venv\Scripts\activate.bat
) else (
    echo [WARNING] venv not found at %~dp0venv. Using system Python.
)

echo Starting Uvicorn on http://127.0.0.1:8000 ...
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

echo.
echo [SERVER STOPPED]
pause
