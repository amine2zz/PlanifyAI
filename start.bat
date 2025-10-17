@echo off
echo ========================================
echo      PlanifyAI - Smart Calendar
echo ========================================
echo.

echo Starting PlanifyAI application...
echo.

echo 1. Checking if XAMPP MySQL is running...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✓ MySQL is running
) else (
    echo ✗ MySQL is not running
    echo Please start XAMPP and ensure MySQL is running
    echo Then run this script again
    pause
    exit /b 1
)

echo.
echo 2. Starting Flask Backend...
cd backend
start "PlanifyAI Backend" cmd /k "python app.py"
cd ..

echo.
echo 3. Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo 4. Starting Angular Frontend...
cd frontend
start "PlanifyAI Frontend" cmd /k "ng serve"
cd ..

echo.
echo ========================================
echo PlanifyAI is starting up!
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:4200
echo.
echo Wait a moment for both servers to start,
echo then open http://localhost:4200 in your browser
echo ========================================
echo.
echo Press any key to exit this window...
pause > nul