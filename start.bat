@echo off
echo ====================================================
echo Starting SmartFulfill AI (Single-URL Mode)
echo ====================================================
echo.

echo [1/3] Building frontend...
cd frontend
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Frontend build failed!
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo [2/3] Seeding Database (Optional but ensures fresh state)...
cd backend
call python seed.py
cd ..

echo.
echo [3/3] Starting Backend Server...
cd backend
echo Application will be available at: http://localhost:8000
python -m uvicorn main:app --port 8000
