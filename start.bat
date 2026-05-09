@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo   Intelligent Assessment System Launcher
echo ==========================================
echo.

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Node.js version:
node --version
echo.

REM Install dependencies if needed
echo [2/4] Checking dependencies...
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

if not exist "api\node_modules" (
    echo Installing backend dependencies...
    cd api
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
    cd ..
)

echo [3/4] Dependencies OK
echo.


echo ==========================================
echo   Starting servers...
echo ==========================================
echo.
echo Frontend will run at: http://localhost:5173
echo Backend will run at: http://localhost:3001
echo.
echo Press Ctrl+C to stop all servers
echo.

REM Start backend
cd api
start "Backend Server" cmd /k "npx tsx server.ts"
cd ..

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Please wait a few seconds and open http://localhost:5173 in your browser
echo.

endlocal
