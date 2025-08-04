@echo off
color 0B
title تثبيت متطلبات نظام قرطبة للتوريدات

echo ===============================================
echo      تثبيت متطلبات نظام قرطبة للتوريدات
echo ===============================================
echo.

echo هذا السكريبت سيساعدك في تثبيت المتطلبات الأساسية
echo.

REM فحص الصلاحيات
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ يجب تشغيل هذا الملف كمدير
    echo اضغط بالزر الأيمن واختر "تشغيل كمدير"
    pause
    exit /b 1
)

echo ✅ تم تشغيل السكريپت بصلاحيات المدير
echo.

REM فحص وتثبيت Chocolatey
echo [1/3] فحص Chocolatey...
choco --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Chocolatey غير مثبت. جاري التثبيت...
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
    
    if %errorlevel% equ 0 (
        echo ✅ تم تثبيت Chocolatey بنجاح
        REM إعادة تحميل متغيرات البيئة
        refreshenv
    ) else (
        echo ❌ فشل في تثبيت Chocolatey
        goto manual_install
    )
) else (
    echo ✅ Chocolatey مثبت مسبقاً
)

REM تثبيت Node.js
echo.
echo [2/3] فحص وتثبيت Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js غير مثبت. جاري التثبيت...
    choco install nodejs -y
    if %errorlevel% equ 0 (
        echo ✅ تم تثبيت Node.js بنجاح
    ) else (
        echo ❌ فشل في تثبيت Node.js
        goto manual_install
    )
) else (
    for /f "delims=" %%i in ('node --version') do echo ✅ Node.js مثبت: %%i
)

REM تثبيت PostgreSQL
echo.
echo [3/3] فحص وتثبيت PostgreSQL...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo PostgreSQL غير مثبت. جاري التثبيت...
    choco install postgresql -y
    if %errorlevel% equ 0 (
        echo ✅ تم تثبيت PostgreSQL بنجاح
        echo ⚠️  يرجى تسجيل كلمة مرور المستخدم postgres
    ) else (
        echo ❌ فشل في تثبيت PostgreSQL
        goto manual_install
    )
) else (
    for /f "tokens=3" %%i in ('psql --version') do echo ✅ PostgreSQL مثبت: %%i
)

echo.
echo ===============================================
echo        تم الانتهاء من تثبيت المتطلبات
echo ===============================================
echo.
echo الخطوات التالية:
echo 1. أعد تشغيل PowerShell
echo 2. قم بتشغيل CHECK_SYSTEM.bat للتحقق من التثبيت
echo 3. قم بتشغيل SETUP_RDP_SERVER.bat لإعداد المشروع
echo.
pause
exit /b 0

:manual_install
echo.
echo ===============================================
echo            التثبيت اليدوي مطلوب
echo ===============================================
echo.
echo يرجى تحميل وتثبيت البرامج التالية يدوياً:
echo.
echo 1. Node.js LTS من: https://nodejs.org
echo 2. PostgreSQL من: https://www.postgresql.org/download/windows/
echo.
echo بعد التثبيت، قم بتشغيل CHECK_SYSTEM.bat للتحقق
echo.
pause