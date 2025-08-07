@echo off
setlocal enabledelayedexpansion
title فحص النظام - قرطبة للتوريدات

echo.
echo ========================================
echo      فحص النظام - قرطبة للتوريدات
echo        البورت: 5000
echo ========================================
echo.

echo التاريخ والوقت: %date% %time%
echo.

REM Check Node.js
echo [1] فحص Node.js...
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo    [✗] Node.js غير مثبت
    set NODE_STATUS=ERROR
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo    [✓] Node.js !NODE_VERSION!
    set NODE_STATUS=OK
)

REM Check PostgreSQL
echo [2] فحص PostgreSQL...
set PG_STATUS=ERROR
for /L %%i in (16,-1,13) do (
    sc query postgresql-x64-%%i | find "RUNNING" >nul 2>&1
    if %errorLevel% equ 0 (
        echo    [✓] PostgreSQL %%i يعمل
        set PG_STATUS=OK
        goto pg_done
    )
)
sc query postgresql | find "RUNNING" >nul 2>&1
if %errorLevel% equ 0 (
    echo    [✓] PostgreSQL يعمل
    set PG_STATUS=OK
) else (
    echo    [✗] PostgreSQL غير مشغل
)
:pg_done

REM Check Project Directory
echo [3] فحص المشروع...
if exist "C:\QortobaProject\qortoba-supplies\package.json" (
    echo    [✓] المشروع موجود
    set PROJECT_STATUS=OK
) else (
    echo    [✗] المشروع غير موجود
    set PROJECT_STATUS=ERROR
)

REM Check Port
echo [4] فحص البورت 5000...
netstat -an | find ":5000" | find "LISTENING" >nul 2>&1
if %errorLevel% equ 0 (
    echo    [!] البورت 5000 مشغول (السيرفر يعمل)
    set PORT_STATUS=BUSY
) else (
    echo    [✓] البورت 5000 متاح
    set PORT_STATUS=AVAILABLE
)

echo.
echo ========================================
echo         ملخص الفحص
echo ========================================
echo.

if "%NODE_STATUS%"=="OK" (
    echo [✓] Node.js: جاهز
) else (
    echo [✗] Node.js: يحتاج تثبيت
)

if "%PG_STATUS%"=="OK" (
    echo [✓] PostgreSQL: يعمل
) else (
    echo [!] PostgreSQL: متوقف أو غير مثبت
)

if "%PROJECT_STATUS%"=="OK" (
    echo [✓] المشروع: جاهز
) else (
    echo [✗] المشروع: غير موجود
)

if "%PORT_STATUS%"=="AVAILABLE" (
    echo [✓] البورت 5000: متاح
) else (
    echo [!] البورت 5000: مشغول
)

echo.
echo ========================================
echo         التوصيات
echo ========================================
echo.

if "%NODE_STATUS%"=="ERROR" (
    echo • شغل ULTRA_SIMPLE_DEPLOY.bat لتثبيت Node.js
)

if "%PG_STATUS%"=="ERROR" (
    echo • شغل ALTERNATIVE_POSTGRESQL_INSTALL.bat لتثبيت PostgreSQL
)

if "%PROJECT_STATUS%"=="ERROR" (
    echo • شغل ULTRA_SIMPLE_DEPLOY.bat لإعداد المشروع
)

if "%NODE_STATUS%"=="OK" if "%PROJECT_STATUS%"=="OK" (
    if "%PORT_STATUS%"=="AVAILABLE" (
        echo [✓] النظام جاهز للتشغيل!
        echo.
        set /p START_SERVER="هل تريد تشغيل السيرفر الآن؟ [Y/N]: "
        if /i "!START_SERVER!"=="Y" (
            echo.
            echo [!] تشغيل السيرفر...
            cd /d "C:\QortobaProject\qortoba-supplies"
            start /min cmd /c "timeout /t 10 /nobreak >nul && start http://localhost:5000"
            call npm start
        )
    ) else (
        echo [!] السيرفر يعمل بالفعل - افتح http://localhost:5000
    )
)

echo.
pause