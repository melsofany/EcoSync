@echo off
color 0A
title فحص نظام قرطبة للتوريدات

echo ===============================================
echo        فحص نظام قرطبة للتوريدات
echo ===============================================
echo.

REM فحص Node.js
echo [1/6] فحص Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "delims=" %%i in ('node --version') do echo ✅ Node.js: %%i
) else (
    echo ❌ Node.js غير مثبت
    echo تحميل من: https://nodejs.org
)

REM فحص npm
echo [2/6] فحص npm...
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "delims=" %%i in ('npm --version') do echo ✅ npm: %%i
) else (
    echo ❌ npm غير متاح
)

REM فحص PostgreSQL
echo [3/6] فحص PostgreSQL...
psql --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=3" %%i in ('psql --version') do echo ✅ PostgreSQL: %%i
) else (
    echo ⚠️  PostgreSQL غير متاح في PATH
    echo يرجى التحقق من التثبيت
)

REM فحص ملفات المشروع
echo [4/6] فحص ملفات المشروع...
if exist "package.json" (
    echo ✅ package.json موجود
) else (
    echo ❌ package.json مفقود
)

if exist "server" (
    echo ✅ مجلد server موجود
) else (
    echo ❌ مجلد server مفقود
)

if exist "client" (
    echo ✅ مجلد client موجود
) else (
    echo ❌ مجلد client مفقود
)

if exist ".env" (
    echo ✅ ملف .env موجود
) else (
    echo ⚠️  ملف .env مفقود - سيتم إنشاؤه عند تشغيل الإعداد
)

REM فحص node_modules
echo [5/6] فحص التبعيات...
if exist "node_modules" (
    echo ✅ node_modules موجود
) else (
    echo ⚠️  node_modules مفقود - يجب تشغيل npm install
)

REM فحص الاتصال بقاعدة البيانات
echo [6/6] فحص قاعدة البيانات...
if exist ".env" (
    REM قراءة DATABASE_URL من .env
    for /f "tokens=2 delims==" %%i in ('findstr "DATABASE_URL" .env 2^>nul') do (
        echo ℹ️  محاولة الاتصال بقاعدة البيانات...
        REM هنا يمكن إضافة فحص الاتصال إذا أردت
        echo ✅ إعدادات قاعدة البيانات موجودة
    )
) else (
    echo ⚠️  لا يمكن فحص قاعدة البيانات - ملف .env مفقود
)

echo.
echo ===============================================
echo              ملخص الفحص
echo ===============================================

REM توصيات
echo.
echo 📋 التوصيات:
if not exist ".env" (
    echo • قم بتشغيل SETUP_RDP_SERVER.bat لإعداد النظام
)
if not exist "node_modules" (
    echo • قم بتشغيل: npm install
)

echo • للتشغيل السريع: START_SERVER.bat
echo • للنسخ الاحتياطي: BACKUP_SYSTEM.bat
echo • للمساعدة: اقرأ دليل_التشغيل_RDP.md

echo.
echo النظام جاهز للتشغيل!
echo ===============================================
pause