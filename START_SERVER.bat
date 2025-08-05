@echo off
REM =================================================================
REM تشغيل سريع لمشروع قرطبة للتوريدات
REM Quick Start for Qortoba Supplies Project
REM =================================================================

echo.
echo ========================================
echo     تشغيل سريع - قرطبة للتوريدات
echo     Quick Start - Qortoba Supplies
echo ========================================
echo.

REM Check if project exists
if not exist "C:\QortobaProject\qortoba-supplies" (
    echo [✗] المشروع غير موجود!
    echo [!] شغل ULTRA_SIMPLE_DEPLOY.bat أولاً لتثبيت المشروع
    pause
    exit /b 1
)

REM Navigate to project
cd /d "C:\QortobaProject\qortoba-supplies"

REM Set PATH for tools
set "PATH=C:\Program Files\nodejs;C:\Program Files\PostgreSQL\13\bin;%PATH%"

echo [!] فحص البرامج المطلوبة...

REM Check Node.js
"C:\Program Files\nodejs\node.exe" --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [✗] Node.js غير متاح
    echo [!] شغل ULTRA_SIMPLE_DEPLOY.bat لإعادة التثبيت
    pause
    exit /b 1
)
echo [✓] Node.js متاح

REM Check PostgreSQL service
sc query postgresql-x64-13 | findstr "RUNNING" >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] تشغيل خدمة PostgreSQL...
    net start postgresql-x64-13 >nul 2>&1
    timeout /t 5 /nobreak >nul
)
echo [✓] PostgreSQL يعمل

REM Check if dependencies are installed
if not exist "node_modules" (
    echo [!] تثبيت التبعيات...
    "C:\Program Files\nodejs\npm.cmd" install
    if %errorLevel% neq 0 (
        echo [✗] فشل تثبيت التبعيات
        pause
        exit /b 1
    )
)
echo [✓] التبعيات مثبتة

REM Check environment file
if not exist ".env" (
    echo [!] إنشاء ملف الإعدادات...
    echo NODE_ENV=production > .env
    echo DATABASE_URL=postgresql://qortoba_user:QortobaDB2024!@localhost:5432/qortoba_supplies >> .env
    echo PORT=5000 >> .env
    echo SESSION_SECRET=QortobaSecretKey2024! >> .env
)
echo [✓] ملف الإعدادات جاهز

REM Build project if needed
if not exist "dist" (
    echo [!] بناء المشروع...
    "C:\Program Files\nodejs\npm.cmd" run build
    if %errorLevel% neq 0 (
        echo [✗] فشل بناء المشروع
        pause
        exit /b 1
    )
)
echo [✓] المشروع مبني

echo.
echo ========================================
echo تشغيل النظام
echo ========================================

REM Check if PM2 is available and application is running
if exist "%APPDATA%\npm\pm2.cmd" (
    "%APPDATA%\npm\pm2.cmd" list | findstr "qortoba-supplies" | findstr "online" >nul 2>&1
    if %errorLevel% == 0 (
        echo [✓] النظام يعمل مسبقاً مع PM2
        echo [!] هل تريد إعادة التشغيل؟ (Y/N)
        choice /c YN /n /m "اختر Y لإعادة التشغيل أو N للخروج: "
        if %errorLevel% == 1 (
            "%APPDATA%\npm\pm2.cmd" restart qortoba-supplies
            echo [✓] تم إعادة تشغيل النظام
        )
        goto :show_info
    ) else (
        echo [!] تشغيل النظام مع PM2...
        "%APPDATA%\npm\pm2.cmd" start "C:\Program Files\nodejs\npm.cmd" --name "qortoba-supplies" -- start
        if %errorLevel% == 0 (
            "%APPDATA%\npm\pm2.cmd" save >nul 2>&1
            echo [✓] النظام يعمل مع PM2
            goto :show_info
        ) else (
            echo [!] فشل التشغيل مع PM2، جرب التشغيل المباشر
        )
    )
)

REM Direct start if PM2 not available or failed
echo [!] تشغيل النظام مباشرة...
echo [!] اضغط Ctrl+C لإيقاف النظام
echo.
start /min cmd /c "title Qortoba Supplies Server && "C:\Program Files\nodejs\npm.cmd" start"
timeout /t 10 /nobreak >nul

:show_info
echo.
echo ========================================
echo النظام يعمل بنجاح!
echo ========================================
echo.
echo [✓] يمكنك الوصول للنظام على:
echo     ► http://localhost:5000
echo.
echo [!] معلومات مفيدة:
echo     ► لإيقاف النظام: Ctrl+C (إذا كان يعمل مباشرة)
echo     ► لإيقاف PM2: pm2 stop qortoba-supplies
echo     ► لفحص الحالة: شغل CHECK_SYSTEM.bat
echo     ► للنسخ الاحتياطي: شغل BACKUP_SYSTEM.bat
echo.

REM Test if server is responding
echo [!] اختبار الاستجابة...
timeout /t 5 /nobreak >nul
powershell -Command "try { (Invoke-WebRequest -Uri 'http://localhost:5000' -UseBasicParsing -TimeoutSec 10).StatusCode } catch { 'Failed' }" | findstr "200" >nul
if %errorLevel% == 0 (
    echo [✓] النظام يستجيب بنجاح!
    echo [!] فتح النظام في المتصفح...
    start http://localhost:5000
) else (
    echo [!] النظام قد يحتاج وقت إضافي للبدء
    echo [!] جرب فتح http://localhost:5000 في المتصفح بعد دقيقة
)

echo.
echo ========================================
echo     النظام جاهز للاستخدام!
echo ========================================
pause