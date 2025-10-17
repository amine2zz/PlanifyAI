@echo off
echo ========================================
echo    PlanifyAI Setup & Installation
echo ========================================
echo.

echo This script will set up PlanifyAI for you.
echo Make sure you have the following installed:
echo - Node.js (v16 or higher)
echo - Python (v3.8 or higher)
echo - XAMPP with MySQL
echo.
pause

echo.
echo 1. Setting up Python Backend...
cd backend

echo Creating virtual environment...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing Python dependencies...
pip install -r requirements.txt

echo ✓ Backend setup complete!
cd ..

echo.
echo 2. Setting up Angular Frontend...
cd frontend

echo Installing Node.js dependencies...
npm install

echo Installing Angular CLI globally (if not already installed)...
npm install -g @angular/cli

echo ✓ Frontend setup complete!
cd ..

echo.
echo 3. Database Setup Instructions:
echo ========================================
echo Please follow these steps to set up the database:
echo.
echo 1. Start XAMPP Control Panel
echo 2. Start Apache and MySQL services
echo 3. Open phpMyAdmin (http://localhost/phpmyadmin)
echo 4. Create a new database called 'planifyai'
echo 5. Import the SQL file: database/setup.sql
echo.
echo Alternatively, you can run the SQL commands manually:
echo - Open database/setup.sql in a text editor
echo - Copy and paste the SQL commands into phpMyAdmin
echo.

echo.
echo ========================================
echo Setup Complete! 🎉
echo ========================================
echo.
echo To start PlanifyAI:
echo 1. Make sure XAMPP MySQL is running
echo 2. Run: start.bat
echo.
echo Or start manually:
echo Backend: cd backend && python app.py
echo Frontend: cd frontend && ng serve
echo.
echo Then open: http://localhost:4200
echo ========================================
echo.
pause