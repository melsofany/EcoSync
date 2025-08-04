@echo off
echo ===============================================
echo       إنشاء نسخة احتياطية من قاعدة البيانات
echo ===============================================
echo.

set /p POSTGRES_PATH="أدخل مسار PostgreSQL (أو اضغط Enter للمسار الافتراضي): "
if "%POSTGRES_PATH%"=="" set POSTGRES_PATH=C:\Program Files\PostgreSQL\15\bin

if not exist "%POSTGRES_PATH%\pg_dump.exe" (
    echo [خطأ] PostgreSQL غير موجود في المسار المحدد!
    pause
    exit /b 1
)

echo [معلومات] PostgreSQL موجود ✓

:: إنشاء اسم الملف بالتاريخ والوقت
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set datetime=%datetime:~0,8%_%datetime:~8,6%
set BACKUP_NAME=qortoba_backup_%datetime%.sql

echo [معلومات] سيتم إنشاء نسخة احتياطية باسم: %BACKUP_NAME%
echo [معلومات] في المجلد الحالي: %CD%
echo.

pause

echo [معلومات] جاري إنشاء النسخة الاحتياطية...

"%POSTGRES_PATH%\pg_dump.exe" -U qortoba_user -h localhost qortoba_supplies > "%BACKUP_NAME%"

if errorlevel 1 (
    echo [خطأ] فشل في إنشاء النسخة الاحتياطية!
    echo تحقق من:
    echo - إعدادات قاعدة البيانات
    echo - كلمة مرور المستخدم qortoba_user
    echo - أن PostgreSQL يعمل
) else (
    echo [معلومات] تم إنشاء النسخة الاحتياطية بنجاح! ✓
    echo الملف: %BACKUP_NAME%
    echo الحجم: 
    for %%A in ("%BACKUP_NAME%") do echo %%~zA bytes
)

echo.
pause