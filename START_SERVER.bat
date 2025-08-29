@echo off
title تشغيل سيرفر قرطبة - البورت 5000

echo.
echo ========================================
echo       سيرفر قرطبة للتوريدات
echo           البورت: 5000
echo ========================================
echo.

REM Check if project exists
if not exist "C:\QortobaProject\qortoba-supplies" (
    echo [✗] المشروع غير موجود!
    echo [!] شغل ULTRA_SIMPLE_DEPLOY.bat أولاً
    echo.
    pause
    exit /b 1
)

cd /d "C:\QortobaProject\qortoba-supplies"

REM Check if package.json exists
if not exist "package.json" (
    echo [✗] ملفات المشروع غير مكتملة!
    echo [!] شغل ULTRA_SIMPLE_DEPLOY.bat لإعادة الإعداد
    echo.
    pause
    exit /b 1
)

echo [!] بدء تشغيل السيرفر...
echo [!] العنوان: http://localhost:5000
echo [!] للخروج اضغط Ctrl+C
echo.

REM Open browser after 10 seconds
start /min cmd /c "timeout /t 10 /nobreak >nul && start http://localhost:5000"

REM Start the server
call npm start

echo.
echo [!] تم إيقاف السيرفر
pause