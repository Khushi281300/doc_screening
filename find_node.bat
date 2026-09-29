@echo off
rem Locates node.exe even when it is not on PATH (nvm-windows, Program Files, per-user install)
rem and prepends its folder to PATH for this window and every window started from it.

where node >nul 2>&1 && goto :found

set "NODE_DIR="
if defined NVM_SYMLINK if exist "%NVM_SYMLINK%\node.exe" set "NODE_DIR=%NVM_SYMLINK%"
if not defined NODE_DIR if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_DIR=%ProgramFiles%\nodejs"
if not defined NODE_DIR if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "NODE_DIR=%LOCALAPPDATA%\Programs\nodejs"
if not defined NODE_DIR if exist "C:\nvm4w\nodejs\node.exe" set "NODE_DIR=C:\nvm4w\nodejs"

if not defined NODE_DIR if exist "%LOCALAPPDATA%\nvm" (
    for /d %%d in ("%LOCALAPPDATA%\nvm\v*") do if exist "%%d\node.exe" set "NODE_DIR=%%d"
)
if not defined NODE_DIR if exist "%APPDATA%\nvm" (
    for /d %%d in ("%APPDATA%\nvm\v*") do if exist "%%d\node.exe" set "NODE_DIR=%%d"
)
if not defined NODE_DIR if defined NVM_HOME (
    for /d %%d in ("%NVM_HOME%\v*") do if exist "%%d\node.exe" set "NODE_DIR=%%d"
)

if not defined NODE_DIR (
    echo.
    echo [ERROR] Node.js was not found on this computer.
    echo         Install it from https://nodejs.org - LTS version, then run this again.
    echo.
    pause
    exit /b 1
)

set "PATH=%NODE_DIR%;%PATH%"
:found
for /f "delims=" %%v in ('node --version') do echo Using Node %%v
exit /b 0
