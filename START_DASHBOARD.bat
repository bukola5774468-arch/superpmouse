@echo off
echo ========================================
echo   Crypto Trading Dashboard Launcher
echo   Real-Time Updates Every 0.5 Seconds
echo ========================================
echo.
echo Starting local web server...
echo.

REM Try Node.js first
where /q node
if %ERRORLEVEL% EQU 0 (
    echo Using Node.js...
    echo Dashboard will open at: http://localhost:8000
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    start http://localhost:8000
    npx -y http-server -p 8000 -o
    goto :end
)

REM Try Python 3
where /q python
if %ERRORLEVEL% EQU 0 (
    echo Using Python...
    echo Dashboard will open at: http://localhost:8000
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    start http://localhost:8000
    python -m http.server 8000
    goto :end
)

REM If neither works, show instructions
echo ERROR: Neither Node.js nor Python found!
echo.
echo Please install one of the following:
echo.
echo Option 1: Node.js
echo   Download from: https://nodejs.org/
echo.
echo Option 2: Python
echo   Download from: https://www.python.org/
echo.
echo After installation, run this file again.
echo.
pause

:end


