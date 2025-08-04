@echo off
echo ===============================================
echo       استيراد نسخة احتياطية من Replit
echo ===============================================
echo.

set /p POSTGRES_PATH="أدخل مسار PostgreSQL (أو اضغط Enter للمسار الافتراضي): "
if "%POSTGRES_PATH%"=="" set POSTGRES_PATH=C:\Program Files\PostgreSQL\15\bin

if not exist "%POSTGRES_PATH%\psql.exe" (
    echo [خطأ] PostgreSQL غير موجود في المسار المحدد!
    pause
    exit /b 1
)

echo [معلومات] PostgreSQL موجود ✓

set /p BACKUP_FILE="أدخل مسار ملف النسخة الاحتياطية (.sql): "

if "%BACKUP_FILE%"=="" (
    echo [خطأ] يجب تحديد ملف النسخة الاحتياطية!
    pause
    exit /b 1
)

if not exist "%BACKUP_FILE%" (
    echo [خطأ] الملف غير موجود: %BACKUP_FILE%
    pause
    exit /b 1
)

echo [معلومات] الملف موجود ✓

echo.
echo سيتم استيراد البيانات إلى قاعدة بيانات: qortoba_supplies
echo من الملف: %BACKUP_FILE%
echo.
echo تأكد من أن قاعدة البيانات منشأة بالفعل (استخدم setup-database.bat)
echo.

pause

echo [معلومات] جاري استيراد البيانات...

"%POSTGRES_PATH%\psql.exe" -U qortoba_user -d qortoba_supplies -f "%BACKUP_FILE%"

if errorlevel 1 (
    echo [خطأ] فشل في استيراد البيانات!
    echo تحقق من:
    echo - صحة ملف النسخة الاحتياطية
    echo - إعدادات قاعدة البيانات
    echo - كلمة مرور المستخدم qortoba_user
) else (
    echo [معلومات] تم استيراد البيانات بنجاح! ✓
    echo يمكنك الآن تشغيل المشروع باستخدام start-project.bat
)

echo.
pause