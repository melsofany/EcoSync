@echo off
title قرطبة للتوريدات - خادم النظام
color 0A

echo ===============================================
echo       بدء تشغيل نظام قرطبة للتوريدات
echo ===============================================
echo.

REM التحقق من وجود ملف .env
if not exist ".env" (
    echo ❌ ملف .env غير موجود
    echo يرجى تشغيل SETUP_RDP_SERVER.bat أولاً
    pause
    exit /b 1
)

REM التحقق من وجود الملفات المطلوبة
if not exist "package.json" (
    echo ❌ ملف package.json غير موجود
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo ❌ مجلد node_modules غير موجود
    echo يرجى تشغيل: npm install
    pause
    exit /b 1
)

echo ✅ فحص الملفات المطلوبة...
echo ✅ بدء تشغيل الخادم...
echo.
echo 🌐 سيكون النظام متاحاً على: http://localhost:3000
echo 🔄 لإيقاف الخادم: اضغط Ctrl+C
echo.
echo ===============================================
echo          الخادم يعمل الآن...
echo ===============================================
echo.

REM تشغيل الخادم
npm start

REM في حالة إيقاف الخادم
echo.
echo تم إيقاف الخادم
pause