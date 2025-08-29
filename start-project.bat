@echo off
echo ===============================================
echo       تشغيل مشروع قرطبة للتوريدات
echo ===============================================
echo.

:: التحقق من Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [خطأ] Node.js غير مثبت!
    echo يرجى تثبيت Node.js من: https://nodejs.org/
    pause
    exit /b 1
)

echo [معلومات] Node.js مثبت ✓

:: التحقق من وجود ملف .env
if not exist ".env" (
    echo [تحذير] ملف .env غير موجود!
    echo يرجى إنشاء ملف .env مع الإعدادات المطلوبة
    echo راجع WINDOWS_SETUP.md للتفاصيل
    pause
    exit /b 1
)

echo [معلومات] ملف الإعدادات موجود ✓

:: التحقق من node_modules
if not exist "node_modules" (
    echo [معلومات] تثبيت الحزم المطلوبة...
    npm install
)

:: التحقق من مجلد dist
if not exist "dist" (
    echo [معلومات] بناء المشروع...
    npm run build
)

echo.
echo [معلومات] بدء تشغيل المشروع...
echo [معلومات] يمكنك الوصول للموقع على: http://localhost:5000
echo [معلومات] للإيقاف، اضغط Ctrl+C
echo.

:: تشغيل المشروع
npm start