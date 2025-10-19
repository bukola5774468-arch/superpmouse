@echo off
echo ========================================
echo   Crypto Trading Dashboard
echo   Opening in your default browser...
echo ========================================
echo.
echo NOTE: If prices don't load, you may need to:
echo 1. Install Node.js from https://nodejs.org/
echo 2. Then run START_DASHBOARD.bat instead
echo.
echo Opening dashboard now...
timeout /t 2 >nul

REM Open the HTML file directly in default browser
start "" "index.html"

echo.
echo Dashboard opened!
echo.
echo If you see blank prices:
echo - Press F12 in browser
echo - Check Console tab for errors
echo - You may need to run START_DASHBOARD.bat with Node.js installed
echo.
pause

