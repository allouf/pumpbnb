@echo off
echo ================================================
echo      BNB PUMPFUN - LOCAL DEVELOPMENT
echo ================================================
echo.
echo This will start both Frontend and Backend servers
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3001
echo.
echo For more options, use the PowerShell script:
echo   .\start-local-dev.ps1
echo   .\start-local-dev.ps1 -BackendOnly
echo   .\start-local-dev.ps1 -FrontendOnly
echo   .\start-local-dev.ps1 -Clean
echo.
echo Press any key to continue with both servers...
pause

echo.
echo Starting Backend Server...
start "Backend API" cmd /k "cd /d "%~dp0backend" && npm run dev"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Frontend Server...
start "Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ✅ Both servers are starting!
echo ✅ Frontend: http://localhost:3000
echo ✅ Backend:  http://localhost:3001
echo.
echo Close this window or press Ctrl+C to stop monitoring
echo Close the individual server windows to stop each service
echo.
pause
