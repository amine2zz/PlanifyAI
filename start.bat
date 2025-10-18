@echo off
echo Starting PlanifyAI...

echo Starting Backend...
cd backend
start cmd /k "python app.py"

echo Starting Frontend...
cd ../frontend
start cmd /k "ng serve"

echo PlanifyAI is starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:4200
pause