@echo off
echo ===============================================
echo       نسخ احتياطي لنظام قرطبة للتوريدات
echo ===============================================
echo.

REM إنشاء مجلد النسخ الاحتياطية
set BACKUP_DIR=C:\qortoba-backups
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
    echo ✅ تم إنشاء مجلد النسخ الاحتياطية: %BACKUP_DIR%
)

REM الحصول على التاريخ والوقت
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /format:list') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%
set BACKUP_FILE=%BACKUP_DIR%\qortoba_backup_%TIMESTAMP%.sql

echo تاريخ النسخة الاحتياطية: %date% %time%
echo موقع الحفظ: %BACKUP_FILE%
echo.

REM إنشاء النسخة الاحتياطية
echo جاري إنشاء النسخة الاحتياطية...
pg_dump -h localhost -U qortoba_user -d qortoba_supplies > "%BACKUP_FILE%"

if %errorlevel% equ 0 (
    echo ✅ تم إنشاء النسخة الاحتياطية بنجاح
    echo الملف: %BACKUP_FILE%
    
    REM عرض حجم الملف
    for %%A in ("%BACKUP_FILE%") do echo حجم الملف: %%~zA بايت
    
) else (
    echo ❌ فشل في إنشاء النسخة الاحتياطية
    echo يرجى التحقق من:
    echo 1. PostgreSQL يعمل
    echo 2. قاعدة البيانات qortoba_supplies موجودة
    echo 3. المستخدم qortoba_user لديه الصلاحيات
    echo.
)

REM تنظيف النسخ القديمة (أكثر من 30 يوم)
echo.
echo تنظيف النسخ الاحتياطية القديمة...
forfiles /p "%BACKUP_DIR%" /s /m *.sql /d -30 /c "cmd /c del @path" 2>nul
if %errorlevel% equ 0 (
    echo ✅ تم حذف النسخ الاحتياطية الأقدم من 30 يوم
) else (
    echo ℹ️  لا توجد نسخ احتياطية قديمة للحذف
)

echo.
echo ===============================================
echo            انتهت عملية النسخ الاحتياطي
echo ===============================================
pause