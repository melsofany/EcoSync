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

echo DATABASE_URL=postgresql://qortoba_user:QortobaPass123!@localhost:5432/qortoba_supplies > .env
echo SESSION_SECRET=qortoba-super-secret-session-key-2025-make-this-very-long-and-random >> .env
echo NODE_ENV=production >> .env
echo PORT=5000 >> .env
echo. >> .env
echo # إذا كنت تستخدم DeepSeek AI للكشف عن المكررات >> .env
echo # DEEPSEEK_API_KEY=your_api_key_here >> .env

echo.
echo [معلومات] تم إنشاء ملف .env بنجاح!
echo [معلومات] يحتوي على الإعدادات الأساسية
echo [تحذير] يرجى تغيير كلمة المرور وSESSION_SECRET للأمان
echo.
echo محتويات الملف:
echo ===============================================
type .env
echo ===============================================
echo.
pause