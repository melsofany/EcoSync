@echo off
echo ===============================================
echo       إنشاء ملف إعدادات البيئة (.env)
echo ===============================================
echo.

if exist ".env" (
    echo [تحذير] ملف .env موجود بالفعل!
    set /p OVERWRITE="هل تريد الكتابة فوقه؟ (y/n): "
    if /i not "%OVERWRITE%"=="y" (
        echo تم الإلغاء.
        pause
        exit /b 0
    )
)

echo DATABASE_URL=postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:5432/qortoba_supplies > .env
echo SESSION_SECRET=YOUR_SECURE_SESSION_SECRET_HERE >> .env
echo NODE_ENV=production >> .env
echo PORT=5000 >> .env
echo. >> .env
echo # إذا كنت تستخدم DeepSeek AI للكشف عن المكررات >> .env
echo # DEEPSEEK_API_KEY=your_api_key_here >> .env

echo.
echo [معلومات] تم إنشاء ملف .env بنجاح!
echo [معلومات] يحتوي على الإعدادات الأساسية
echo [تحذير هام] يجب استبدال YOUR_DB_USER وYOUR_DB_PASSWORD ببيانات قاعدة البيانات الفعلية
echo [تحذير هام] يجب استبدال YOUR_SECURE_SESSION_SECRET_HERE بمفتاح آمن طويل وعشوائي
echo [أمان] لا تشارك هذه المعلومات أو تضعها في نظام التحكم بالإصدارات
echo.
echo محتويات الملف:
echo ===============================================
type .env
echo ===============================================
echo.
pause