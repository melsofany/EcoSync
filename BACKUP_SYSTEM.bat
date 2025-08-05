@echo off
REM =================================================================
REM نظام النسخ الاحتياطي لمشروع قرطبة للتوريدات
REM Backup System for Qortoba Supplies Project
REM =================================================================

echo.
echo ========================================
echo    نظام النسخ الاحتياطي الشامل
echo   Comprehensive Backup System
echo ========================================
echo.

REM Check admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] يتطلب صلاحيات المدير للوصول لجميع الملفات
    pause
    exit /b 1
)

REM Set date and time for backup filename
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a-%%b)
set mytime=%mytime: =%
set backup_name=qortoba_backup_%mydate%_%mytime%

echo [!] إنشاء نسخة احتياطية: %backup_name%
echo.

REM Create backup directory
if not exist "C:\QortobaBackups" mkdir "C:\QortobaBackups"
set backup_dir=C:\QortobaBackups\%backup_name%
mkdir "%backup_dir%"

echo ========================================
echo المرحلة 1: نسخ احتياطي لقاعدة البيانات
echo ========================================

REM Database backup
set PGPASSWORD=QortobaDB2024!
echo [!] إنشاء نسخة احتياطية لقاعدة البيانات...

if exist "C:\Program Files\PostgreSQL\13\bin\pg_dump.exe" (
    "C:\Program Files\PostgreSQL\13\bin\pg_dump.exe" -U qortoba_user -h localhost qortoba_supplies > "%backup_dir%\database_backup.sql"
    if %errorLevel% == 0 (
        echo [✓] نسخة احتياطية لقاعدة البيانات مكتملة
    ) else (
        echo [✗] فشل في إنشاء نسخة احتياطية لقاعدة البيانات
    )
) else (
    echo [✗] PostgreSQL غير موجود، تخطي نسخة قاعدة البيانات
)

echo.
echo ========================================
echo المرحلة 2: نسخ ملفات المشروع
echo ========================================

REM Project files backup
echo [!] نسخ ملفات المشروع...

if exist "C:\QortobaProject\qortoba-supplies" (
    mkdir "%backup_dir%\project_files"
    xcopy "C:\QortobaProject\qortoba-supplies" "%backup_dir%\project_files" /E /I /H /Y >nul
    
    REM Exclude node_modules and .git from main backup
    if exist "%backup_dir%\project_files\node_modules" rmdir /s /q "%backup_dir%\project_files\node_modules"
    if exist "%backup_dir%\project_files\.git" rmdir /s /q "%backup_dir%\project_files\.git"
    
    echo [✓] ملفات المشروع منسوخة
) else (
    echo [✗] مجلد المشروع غير موجود
)

REM Copy .env file separately for security
if exist "C:\QortobaProject\qortoba-supplies\.env" (
    copy "C:\QortobaProject\qortoba-supplies\.env" "%backup_dir%\env_backup.txt" >nul
    echo [✓] ملف الإعدادات منسوخ
)

echo.
echo ========================================
echo المرحلة 3: نسخ إعدادات النظام
echo ========================================

REM System configuration backup
echo [!] حفظ إعدادات النظام...

REM PM2 configuration
if exist "%APPDATA%\npm\pm2" (
    mkdir "%backup_dir%\pm2_config"
    xcopy "%APPDATA%\npm" "%backup_dir%\pm2_config" /E /I /Y >nul 2>&1
    echo [✓] إعدادات PM2 محفوظة
)

REM Windows services info
echo [!] حفظ معلومات الخدمات...
sc query postgresql-x64-13 > "%backup_dir%\postgresql_service_info.txt" 2>&1

REM Installed programs list
echo [!] حفظ قائمة البرامج المثبتة...
wmic product get name,version /format:csv > "%backup_dir%\installed_programs.csv" 2>nul

REM System info
systeminfo > "%backup_dir%\system_info.txt" 2>&1

echo [✓] معلومات النظام محفوظة

echo.
echo ========================================
echo المرحلة 4: إنشاء سكريپت الاستعادة
echo ========================================

REM Create restore script
echo [!] إنشاء سكريپت الاستعادة...

echo @echo off > "%backup_dir%\RESTORE_BACKUP.bat"
echo REM =================================== >> "%backup_dir%\RESTORE_BACKUP.bat"
echo REM Restore Script for %backup_name% >> "%backup_dir%\RESTORE_BACKUP.bat"
echo REM =================================== >> "%backup_dir%\RESTORE_BACKUP.bat"
echo. >> "%backup_dir%\RESTORE_BACKUP.bat"
echo echo [!] استعادة النسخة الاحتياطية: %backup_name% >> "%backup_dir%\RESTORE_BACKUP.bat"
echo echo. >> "%backup_dir%\RESTORE_BACKUP.bat"
echo REM Restore database >> "%backup_dir%\RESTORE_BACKUP.bat"
echo set PGPASSWORD=QortobaDB2024! >> "%backup_dir%\RESTORE_BACKUP.bat"
echo dropdb -U qortoba_user qortoba_supplies 2^>nul >> "%backup_dir%\RESTORE_BACKUP.bat"
echo createdb -U qortoba_user qortoba_supplies >> "%backup_dir%\RESTORE_BACKUP.bat"
echo psql -U qortoba_user qortoba_supplies ^< database_backup.sql >> "%backup_dir%\RESTORE_BACKUP.bat"
echo echo [✓] قاعدة البيانات مستعادة >> "%backup_dir%\RESTORE_BACKUP.bat"
echo. >> "%backup_dir%\RESTORE_BACKUP.bat"
echo REM Restore project files >> "%backup_dir%\RESTORE_BACKUP.bat"
echo if exist "C:\QortobaProject\qortoba-supplies" rmdir /s /q "C:\QortobaProject\qortoba-supplies" >> "%backup_dir%\RESTORE_BACKUP.bat"
echo xcopy "project_files" "C:\QortobaProject\qortoba-supplies" /E /I /H /Y >> "%backup_dir%\RESTORE_BACKUP.bat"
echo copy "env_backup.txt" "C:\QortobaProject\qortoba-supplies\.env" >> "%backup_dir%\RESTORE_BACKUP.bat"
echo echo [✓] ملفات المشروع مستعادة >> "%backup_dir%\RESTORE_BACKUP.bat"
echo. >> "%backup_dir%\RESTORE_BACKUP.bat"
echo echo [✓] اكتملت عملية الاستعادة! >> "%backup_dir%\RESTORE_BACKUP.bat"
echo pause >> "%backup_dir%\RESTORE_BACKUP.bat"

echo [✓] سكريپت الاستعادة منشأ

echo.
echo ========================================
echo المرحلة 5: ضغط النسخة الاحتياطية
echo ========================================

REM Compress backup using PowerShell
echo [!] ضغط النسخة الاحتياطية...
powershell -Command "Compress-Archive -Path '%backup_dir%\*' -DestinationPath '%backup_dir%.zip' -Force"

if exist "%backup_dir%.zip" (
    echo [✓] النسخة الاحتياطية مضغوطة: %backup_dir%.zip
    
    REM Calculate file size
    for %%I in ("%backup_dir%.zip") do set size=%%~zI
    set /a size_mb=%size%/1024/1024
    echo [!] حجم الملف: %size_mb% MB
) else (
    echo [!] تحذير: فشل ضغط النسخة الاحتياطية
)

echo.
echo ========================================
echo المرحلة 6: تنظيف الملفات المؤقتة
echo ========================================

REM Clean up temporary files (optional)
echo [!] هل تريد حذف الملفات غير المضغوطة؟ (Y/N)
choice /c YN /n /m "اختر Y للحذف أو N للاحتفاظ: "
if %errorLevel% == 1 (
    rmdir /s /q "%backup_dir%"
    echo [✓] الملفات المؤقتة محذوفة
) else (
    echo [!] الملفات المؤقتة محفوظة في: %backup_dir%
)

echo.
echo ========================================
echo           اكتمل النسخ الاحتياطي!
echo         Backup Completed Successfully!
echo ========================================
echo.
echo [✓] ملف النسخة الاحتياطية: %backup_dir%.zip
echo [✓] يمكنك نقل هذا الملف لمكان آمن
echo [✓] لاستعادة النسخة: استخرج الملف وشغل RESTORE_BACKUP.bat
echo.
echo [!] معلومات النسخة الاحتياطية:
echo     ► التاريخ والوقت: %mydate% %mytime%
echo     ► الموقع: C:\QortobaBackups\
echo     ► يحتوي على: قاعدة البيانات + ملفات المشروع + الإعدادات
echo.

REM Create backup log
echo %date% %time% - تم إنشاء نسخة احتياطية: %backup_name% >> "C:\QortobaBackups\backup_log.txt"

echo [✓] سجل النسخ الاحتياطية محدث
echo.
echo ========================================
echo   النسخة الاحتياطية جاهزة للاستخدام!
echo ========================================
pause