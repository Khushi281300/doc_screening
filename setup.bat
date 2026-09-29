@echo off
title CHRONICLE - first-time setup
cd /d "%~dp0"
echo ============================================================
echo    CHRONICLE - installing everything (run this once)
echo ============================================================
echo.
call "%~dp0find_node.bat" || exit /b 1

echo [1/3] Python packages (backend) ...
cd backend
if not exist "venv\Scripts\python.exe" (
    echo    creating virtual environment ...
    python -m venv venv || (echo [ERROR] Python 3.11/3.12 not found on PATH. & pause & exit /b 1)
)
call venv\Scripts\activate.bat
python -m pip install --upgrade pip >nul
pip install -r requirements.txt || (echo [ERROR] Python package install failed. & pause & exit /b 1)
cd ..

echo.
echo [2/3] Node packages (frontend) ...
cd frontend
call npm install || (echo [ERROR] npm install failed. & pause & exit /b 1)
cd ..

echo.
echo [3/3] Resetting demo data ...
if exist "backend\chronicle.db" del /q "backend\chronicle.db"
if exist "backend\case_vault" rmdir /s /q "backend\case_vault"

echo.
echo ============================================================
echo    Setup complete. Starting CHRONICLE ...
echo ============================================================
call run_system.bat
