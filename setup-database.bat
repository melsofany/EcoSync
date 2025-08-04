@echo off
echo ===============================================
echo       إعداد قاعدة بيانات قرطبة للتوريدات
echo ===============================================
echo.

set /p POSTGRES_PATH="أدخل مسار PostgreSQL (أو اضغط Enter للمسار الافتراضي): "
if "%POSTGRES_PATH%"=="" set POSTGRES_PATH=C:\Program Files\PostgreSQL\15\bin

if not exist "%POSTGRES_PATH%\psql.exe" (
    echo [خطأ] PostgreSQL غير موجود في المسار المحدد!
    echo يرجى تثبيت PostgreSQL من: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo [معلومات] PostgreSQL موجود ✓

echo.
echo سيتم إنشاء:
echo - قاعدة بيانات: qortoba_supplies
echo - مستخدم: qortoba_user
echo - كلمة المرور: QortobaPass123!
echo.
echo ستحتاج إلى كلمة مرور المستخدم postgres
echo.

pause

echo CREATE DATABASE qortoba_supplies; > temp_setup.sql
echo CREATE USER qortoba_user WITH PASSWORD 'QortobaPass123!'; >> temp_setup.sql
echo GRANT ALL PRIVILEGES ON DATABASE qortoba_supplies TO qortoba_user; >> temp_setup.sql

"%POSTGRES_PATH%\psql.exe" -U postgres -f temp_setup.sql

del temp_setup.sql

echo.
echo [معلومات] تم إعداد قاعدة البيانات بنجاح!
echo [معلومات] يمكنك الآن تشغيل start-project.bat
echo.
pause