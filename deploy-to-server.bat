@echo off
echo ====================================
echo    نشر مشروع قرطبة للتوريدات
echo ====================================

REM التحقق من وجود Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo خطأ: Node.js غير مثبت!
    echo يرجى تثبيت Node.js من https://nodejs.org
    pause
    exit /b 1
)

REM التحقق من وجود PostgreSQL
psql --version >nul 2>&1
if errorlevel 1 (
    echo تحذير: PostgreSQL غير مثبت أو غير متاح في PATH
    echo تأكد من تثبيت PostgreSQL وإضافته لمتغير PATH
)

echo.
echo خطوة 1: تثبيت التبعيات...
npm install
if errorlevel 1 (
    echo خطأ في تثبيت التبعيات!
    pause
    exit /b 1
)

echo.
echo خطوة 2: التحقق من ملف البيئة...
if not exist .env (
    echo إنشاء ملف .env...
    copy .env.example .env
    echo يرجى تحديث ملف .env بالإعدادات الصحيحة
    notepad .env
    pause
)

echo.
echo خطوة 3: إعداد قاعدة البيانات...
npm run db:push
if errorlevel 1 (
    echo خطأ في إعداد قاعدة البيانات!
    echo تأكد من:
    echo 1. تشغيل PostgreSQL
    echo 2. صحة إعدادات DATABASE_URL في ملف .env
    pause
    exit /b 1
)

echo.
echo خطوة 4: بناء المشروع...
npm run build
if errorlevel 1 (
    echo خطأ في بناء المشروع!
    pause
    exit /b 1
)

echo.
echo ====================================
echo تم تجهيز المشروع للنشر بنجاح!
echo ====================================
echo.
echo لتشغيل المشروع:
echo npm start
echo.
echo أو استخدام PM2 للتشغيل المستمر:
echo npm install -g pm2
echo pm2 start npm --name "qortoba-supplies" -- start
echo.
pause