@echo off
echo Starting ASTER FUN Local Development Environment...
echo.

cd /d "%~dp0backend"

echo ==========================================
echo Starting Backend Server...
echo ==========================================
npm run dev

pause