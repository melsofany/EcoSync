@echo off
echo ===============================================
echo      استعادة نسخة احتياطية - قرطبة للتوريدات
echo ===============================================
echo.

REM التحقق من وجود مجلد النسخ الاحتياطية
set BACKUP_DIR=C:\qortoba-backups
if not exist "%BACKUP_DIR%" (
    echo ❌ مجلد النسخ الاحتياطية غير موجود: %BACKUP_DIR%
    echo يرجى تشغيل BACKUP_SYSTEM.bat أولاً لإنشاء نسخة احتياطية
    pause
    exit /b 1
)

echo المجلد: %BACKUP_DIR%
echo.
echo الملفات المتاحة:
echo ================
dir /b "%BACKUP_DIR%\*.sql" 2>nul
if %errorlevel% neq 0 (
    echo ❌ لا توجد ملفات نسخ احتياطية
    pause
    exit /b 1
)

echo.
set /p BACKUP_FILE="أدخل اسم ملف النسخة الاحتياطية (بدون مسار): "

REM التحقق من وجود الملف
if not exist "%BACKUP_DIR%\%BACKUP_FILE%" (
    echo ❌ الملف غير موجود: %BACKUP_DIR%\%BACKUP_FILE%
    pause
    exit /b 1
)

echo.
echo ⚠️  تحذير: ستتم استبدال البيانات الحالية بالكامل
echo هل أنت متأكد من المتابعة؟ (y/N)
set /p CONFIRM=
if /i not "%CONFIRM%"=="y" (
    echo تم إلغاء العملية
    pause
    exit /b 0
)

echo.
echo جاري إيقاف الاتصالات الحالية...
psql -h localhost -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'qortoba_supplies' AND pid <> pg_backend_pid();"

echo.
echo جاري حذف قاعدة البيانات الحالية...
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS qortoba_supplies;"

echo.
echo جاري إنشاء قاعدة بيانات جديدة...
psql -h localhost -U postgres -c "CREATE DATABASE qortoba_supplies;"
psql -h localhost -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE qortoba_supplies TO qortoba_user;"

echo.
echo جاري استعادة البيانات من النسخة الاحتياطية...
psql -h localhost -U qortoba_user -d qortoba_supplies < "%BACKUP_DIR%\%BACKUP_FILE%"

if %errorlevel% equ 0 (
    echo ✅ تم استعادة النسخة الاحتياطية بنجاح
    echo.
    echo تم استعادة البيانات من: %BACKUP_FILE%
    echo يمكنك الآن تشغيل النظام باستخدام START_SERVER.bat
) else (
    echo ❌ فشل في استعادة النسخة الاحتياطية
    echo يرجى التحقق من:
    echo 1. PostgreSQL يعمل
    echo 2. ملف النسخة الاحتياطية سليم
    echo 3. المستخدم qortoba_user لديه الصلاحيات
)

echo.
echo ===============================================
echo           انتهت عملية الاستعادة
echo ===============================================
pause