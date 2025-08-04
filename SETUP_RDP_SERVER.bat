@echo off
echo ===============================================
echo       تنصيب مشروع قرطبة للتوريدات على RDP
echo ===============================================
echo.

REM تحقق من وجود Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo خطأ: Node.js غير مثبت
    echo يرجى تحميل وتثبيت Node.js من: https://nodejs.org
    pause
    exit /b 1
)

REM تحقق من وجود npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo خطأ: npm غير متاح
    pause
    exit /b 1
)

echo ✓ Node.js و npm متوفران
echo.

REM إنشاء ملف .env إذا لم يكن موجوداً
if not exist ".env" (
    echo إنشاء ملف .env...
    copy nul .env
    echo DATABASE_URL=postgresql://qortoba_user:PASSWORD_HERE@localhost:5432/qortoba_supplies>> .env
    echo SESSION_SECRET=your-super-secret-session-key-make-it-very-long-and-random-32-chars-minimum>> .env
    echo NODE_ENV=production>> .env
    echo PORT=3000>> .env
    echo.
    echo ⚠️  يرجى تحديث ملف .env بكلمة مرور قاعدة البيانات الصحيحة
    notepad .env
)

echo تثبيت التبعيات...
npm install
if %errorlevel% neq 0 (
    echo خطأ في تثبيت التبعيات
    pause
    exit /b 1
)

echo ✓ تم تثبيت التبعيات بنجاح
echo.

echo إعداد قاعدة البيانات...
npm run db:push
if %errorlevel% neq 0 (
    echo تحذير: فشل في إعداد قاعدة البيانات
    echo يرجى التأكد من:
    echo 1. PostgreSQL يعمل
    echo 2. قاعدة البيانات qortoba_supplies موجودة
    echo 3. المستخدم qortoba_user لديه الصلاحيات المطلوبة
    echo 4. كلمة المرور في ملف .env صحيحة
    pause
)

echo بناء المشروع للإنتاج...
npm run build
if %errorlevel% neq 0 (
    echo خطأ في بناء المشروع
    pause
    exit /b 1
)

echo ✓ تم بناء المشروع بنجاح
echo.

echo ===============================================
echo          تم الانتهاء من الإعداد
echo ===============================================
echo.
echo لتشغيل المشروع:
echo 1. تشغيل للاختبار: npm run dev
echo 2. تشغيل للإنتاج: npm start
echo.
echo المشروع سيعمل على: http://localhost:3000
echo.
pause