@echo off
REM =================================================================
REM فحص حالة نظام قرطبة للتوريدات
REM System Health Check for Qortoba Supplies
REM =================================================================

echo.
echo ========================================
echo      فحص حالة نظام قرطبة للتوريدات
echo     Qortoba Supplies System Health Check
echo ========================================
echo.

set "all_good=1"

echo ========================================
echo المرحلة 1: فحص البرامج الأساسية
echo ========================================

REM Check Node.js
echo [!] فحص Node.js...
if exist "C:\Program Files\nodejs\node.exe" (
    "C:\Program Files\nodejs\node.exe" --version >nul 2>&1
    if %errorLevel% == 0 (
        for /f %%i in ('"C:\Program Files\nodejs\node.exe" --version') do echo [✓] Node.js: %%i
    ) else (
        echo [✗] Node.js مثبت لكن لا يعمل بشكل صحيح
        set "all_good=0"
    )
) else (
    echo [✗] Node.js غير مثبت
    set "all_good=0"
)

REM Check Git
echo [!] فحص Git...
if exist "C:\Program Files\Git\bin\git.exe" (
    "C:\Program Files\Git\bin\git.exe" --version >nul 2>&1
    if %errorLevel% == 0 (
        for /f "tokens=3" %%i in ('"C:\Program Files\Git\bin\git.exe" --version') do echo [✓] Git: %%i
    ) else (
        echo [✗] Git مثبت لكن لا يعمل بشكل صحيح
        set "all_good=0"
    )
) else (
    echo [✗] Git غير مثبت
    set "all_good=0"
)

REM Check PostgreSQL
echo [!] فحص PostgreSQL...
if exist "C:\Program Files\PostgreSQL\13\bin\psql.exe" (
    sc query postgresql-x64-13 | findstr "RUNNING" >nul
    if %errorLevel% == 0 (
        echo [✓] PostgreSQL: يعمل بشكل صحيح
    ) else (
        echo [!] PostgreSQL: مثبت لكن الخدمة متوقفة
        net start postgresql-x64-13 >nul 2>&1
        if %errorLevel% == 0 (
            echo [✓] تم تشغيل خدمة PostgreSQL
        ) else (
            echo [✗] فشل تشغيل خدمة PostgreSQL
            set "all_good=0"
        )
    )
) else (
    echo [✗] PostgreSQL غير مثبت
    set "all_good=0"
)

echo.
echo ========================================
echo المرحلة 2: فحص ملفات المشروع
echo ========================================

REM Check project directory
echo [!] فحص مجلد المشروع...
if exist "C:\QortobaProject\qortoba-supplies" (
    echo [✓] مجلد المشروع موجود
    
    REM Check important files
    if exist "C:\QortobaProject\qortoba-supplies\package.json" (
        echo [✓] ملف package.json موجود
    ) else (
        echo [✗] ملف package.json مفقود
        set "all_good=0"
    )
    
    if exist "C:\QortobaProject\qortoba-supplies\.env" (
        echo [✓] ملف الإعدادات موجود
    ) else (
        echo [!] ملف الإعدادات مفقود - سيتم إنشاؤه
        cd /d "C:\QortobaProject\qortoba-supplies"
        echo NODE_ENV=production > .env
        echo DATABASE_URL=postgresql://qortoba_user:QortobaDB2024!@localhost:5432/qortoba_supplies >> .env
        echo PORT=5000 >> .env
        echo SESSION_SECRET=QortobaSecretKey2024! >> .env
        echo [✓] ملف الإعدادات منشأ
    )
    
    if exist "C:\QortobaProject\qortoba-supplies\node_modules" (
        echo [✓] التبعيات مثبتة
    ) else (
        echo [!] التبعيات غير مثبتة
        set "all_good=0"
    )
    
) else (
    echo [✗] مجلد المشروع مفقود
    set "all_good=0"
)

echo.
echo ========================================
echo المرحلة 3: فحص قاعدة البيانات
echo ========================================

REM Check database
echo [!] فحص قاعدة البيانات...
set PGPASSWORD=QortobaDB2024!

if exist "C:\Program Files\PostgreSQL\13\bin\psql.exe" (
    "C:\Program Files\PostgreSQL\13\bin\psql.exe" -U qortoba_user -d qortoba_supplies -c "SELECT 1;" >nul 2>&1
    if %errorLevel% == 0 (
        echo [✓] الاتصال بقاعدة البيانات يعمل
        
        REM Check if tables exist
        "C:\Program Files\PostgreSQL\13\bin\psql.exe" -U qortoba_user -d qortoba_supplies -c "\dt" >nul 2>&1
        if %errorLevel% == 0 (
            echo [✓] جداول قاعدة البيانات موجودة
        ) else (
            echo [!] جداول قاعدة البيانات مفقودة
            echo [!] قم بتشغيل: npm run db:push
        )
    ) else (
        echo [✗] فشل الاتصال بقاعدة البيانات
        echo [!] قد تحتاج لإنشاء قاعدة البيانات والمستخدم
        set "all_good=0"
    )
) else (
    echo [✗] PostgreSQL غير متاح
    set "all_good=0"
)

echo.
echo ========================================
echo المرحلة 4: فحص التطبيق
echo ========================================

REM Check if application is running
echo [!] فحص حالة التطبيق...

REM Check PM2
if exist "%APPDATA%\npm\pm2.cmd" (
    "%APPDATA%\npm\pm2.cmd" list | findstr "qortoba-supplies" >nul 2>&1
    if %errorLevel% == 0 (
        echo [✓] PM2 مثبت والتطبيق مسجل
        "%APPDATA%\npm\pm2.cmd" list | findstr "online" >nul 2>&1
        if %errorLevel% == 0 (
            echo [✓] التطبيق يعمل مع PM2
        ) else (
            echo [!] التطبيق متوقف، جرب: pm2 start qortoba-supplies
        )
    ) else (
        echo [!] التطبيق غير مسجل في PM2
    )
) else (
    echo [!] PM2 غير مثبت
)

REM Check if port 5000 is in use
netstat -an | findstr :5000 | findstr LISTENING >nul 2>&1
if %errorLevel% == 0 (
    echo [✓] المنفذ 5000 مستخدم (التطبيق قد يكون يعمل)
) else (
    echo [!] المنفذ 5000 غير مستخدم (التطبيق متوقف)
)

REM Test HTTP response
echo [!] اختبار الاستجابة...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5000' -UseBasicParsing -TimeoutSec 5; if($response.StatusCode -eq 200) { 'SUCCESS' } else { 'FAILED' } } catch { 'FAILED' }" > temp_response.txt
set /p response=<temp_response.txt
del temp_response.txt

if "%response%"=="SUCCESS" (
    echo [✓] التطبيق يستجيب على http://localhost:5000
) else (
    echo [!] التطبيق لا يستجيب على http://localhost:5000
)

echo.
echo ========================================
echo المرحلة 5: فحص الموارد
echo ========================================

REM Check system resources
echo [!] فحص موارد النظام...

REM Check disk space
for /f "tokens=3" %%i in ('dir C:\ /-c ^| findstr "bytes free"') do set free_space=%%i
set /a free_gb=%free_space:~0,-9%
if %free_gb% GTR 5 (
    echo [✓] مساحة القرص الصلب كافية: %free_gb% GB
) else (
    echo [!] تحذير: مساحة القرص الصلب قليلة: %free_gb% GB
)

REM Check memory usage
for /f "skip=1 tokens=4" %%i in ('wmic computersystem get TotalPhysicalMemory') do set total_memory=%%i& goto :memory_done
:memory_done
set /a total_gb=%total_memory:~0,-9%
if %total_gb% GTR 3 (
    echo [✓] الذاكرة كافية: %total_gb% GB
) else (
    echo [!] تحذير: الذاكرة قليلة: %total_gb% GB
)

echo.
echo ========================================
echo             تقرير الحالة النهائي
echo            Final Health Report
echo ========================================
echo.

if "%all_good%"=="1" (
    echo [✓] النظام يعمل بشكل ممتاز!
    echo [✓] جميع المكونات تعمل بشكل صحيح
    echo [✓] يمكنك الوصول للنظام على: http://localhost:5000
    echo.
    echo [!] هل تريد فتح النظام في المتصفح؟ (Y/N)
    choice /c YN /n /m "اختر Y للفتح أو N للخروج: "
    if %errorLevel% == 1 (
        start http://localhost:5000
    )
) else (
    echo [!] تم العثور على مشاكل في النظام
    echo [!] راجع التقرير أعلاه لمعرفة المشاكل
    echo [!] قم بإصلاح المشاكل وأعد تشغيل الفحص
    echo.
    echo [!] للمساعدة في الإصلاح:
    echo     - راجع ملف TROUBLESHOOTING.md
    echo     - أو شغل ULTRA_SIMPLE_DEPLOY.bat لإعادة التثبيت
)

echo.
echo ========================================
echo          فحص النظام مكتمل
echo ========================================

REM Save report to file
echo %date% %time% - فحص النظام - الحالة: %all_good% >> "C:\QortobaBackups\system_check_log.txt"

pause