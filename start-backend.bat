@echo off
echo Starting Tennis WeChat Mini-Program Backend...
echo.

:: Check if MongoDB is running
echo Checking if MongoDB is running...
tasklist /FI "IMAGENAME eq mongod.exe" /FO CSV | find /I "mongod.exe" >nul
if %ERRORLEVEL% equ 0 (
    echo MongoDB is already running.
) else (
    echo Starting MongoDB...
    start "" "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db"
    timeout /t 3 >nul
)

echo.
echo Starting Backend Server...
cd backend
npm start

pause