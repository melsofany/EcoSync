@echo off
setlocal enabledelayedexpansion
title نسخ احتياطي - قرطبة للتوريدات

echo.
echo ========================================
echo      نسخ احتياطي - قرطبة للتوريدات
echo ========================================
echo.

REM Check admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] يتطلب صلاحيات المدير...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

set BACKUP_DIR=C:\QortobaBackups
set TIMESTAMP=%date:~-4,4%_%date:~-10,2%_%date:~-7,2%_%time:~0,2%_%time:~3,2%
set TIMESTAMP=!TIMESTAMP: =0!

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo [!] إنشاء نسخة احتياطية...
echo التاريخ: %date% %time%
echo.

REM Backup Project Files
echo [1] نسخ ملفات المشروع...
if exist "C:\QortobaProject\qortoba-supplies" (
    powershell -Command "Compress-Archive -Path 'C:\QortobaProject\qortoba-supplies\*' -DestinationPath '%BACKUP_DIR%\project_backup_%TIMESTAMP%.zip' -Force"
    if %errorLevel% equ 0 (
        echo    [✓] ملفات المشروع: project_backup_%TIMESTAMP%.zip
    ) else (
        echo    [✗] فشل نسخ ملفات المشروع
    )
) else (
    echo    [!] مجلد المشروع غير موجود
)

REM Backup Database
echo [2] نسخ قاعدة البيانات...
set DB_BACKUP_SUCCESS=0

for /L %%i in (16,-1,13) do (
    if exist "C:\Program Files\PostgreSQL\%%i\bin\pg_dump.exe" (
        "C:\Program Files\PostgreSQL\%%i\bin\pg_dump.exe" -U postgres -h localhost -p 5432 -d qortoba_db > "%BACKUP_DIR%\database_backup_%TIMESTAMP%.sql" 2>nul
        if %errorLevel% equ 0 (
            echo    [✓] قاعدة البيانات: database_backup_%TIMESTAMP%.sql
            set DB_BACKUP_SUCCESS=1
            goto db_backup_done
        )
    )
)

:db_backup_done
if %DB_BACKUP_SUCCESS% equ 0 (
    echo    [!] لم يتم نسخ قاعدة البيانات (قد تكون غير مثبتة)
)

REM Create restore script
echo [3] إنشاء سكريبت الاستعادة...
(
echo @echo off
echo echo ========================================
echo echo      استعادة نسخة احتياطية
echo echo        %date% %time%
echo echo ========================================
echo echo.
echo.
echo echo [!] استعادة ملفات المشروع...
echo if exist "project_backup_%TIMESTAMP%.zip" ^(
echo     if exist "C:\QortobaProject\qortoba-supplies" rmdir /s /q "C:\QortobaProject\qortoba-supplies"
echo     mkdir "C:\QortobaProject\qortoba-supplies"
echo     powershell -Command "Expand-Archive -Path 'project_backup_%TIMESTAMP%.zip' -DestinationPath 'C:\QortobaProject\qortoba-supplies' -Force"
echo     echo [✓] تم استعادة ملفات المشروع
echo ^) else ^(
echo     echo [✗] ملف النسخة الاحتياطية غير موجود
echo ^)
echo.
if %DB_BACKUP_SUCCESS% equ 1 (
echo echo [!] استعادة قاعدة البيانات...
echo if exist "database_backup_%TIMESTAMP%.sql" ^(
echo     for /L %%%%i in ^(16,-1,13^) do ^(
echo         if exist "C:\Program Files\PostgreSQL\%%%%i\bin\psql.exe" ^(
echo             "C:\Program Files\PostgreSQL\%%%%i\bin\psql.exe" -U postgres -h localhost -p 5432 -d qortoba_db -f "database_backup_%TIMESTAMP%.sql"
echo             if %%%%errorLevel%%%% equ 0 ^(
echo                 echo [✓] تم استعادة قاعدة البيانات
echo                 goto restore_done
echo             ^)
echo         ^)
echo     ^)
echo     :restore_done
echo ^) else ^(
echo     echo [✗] ملف قاعدة البيانات غير موجود
echo ^)
)
echo.
echo echo [✓] اكتملت عملية الاستعادة
echo pause
) > "%BACKUP_DIR%\restore_%TIMESTAMP%.bat"

echo    [✓] سكريبت الاستعادة: restore_%TIMESTAMP%.bat

echo.
echo ========================================
echo         اكتملت النسخة الاحتياطية
echo ========================================
echo.
echo الملفات المحفوظة في: %BACKUP_DIR%
echo.

dir "%BACKUP_DIR%" | findstr "%TIMESTAMP%"

echo.
echo [!] لاستعادة النسخة لاحقاً، شغل:
echo    %BACKUP_DIR%\restore_%TIMESTAMP%.bat
echo.

pause