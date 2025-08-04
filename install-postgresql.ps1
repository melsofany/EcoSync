# تثبيت PostgreSQL من PowerShell
# يجب تشغيل PowerShell كمدير (Administrator)

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "       تثبيت PostgreSQL لمشروع قرطبة" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# التحقق من صلاحيات المدير
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[خطأ] يجب تشغيل PowerShell كمدير!" -ForegroundColor Red
    Write-Host "انقر بزر الماوس الأيمن على PowerShell واختر 'Run as administrator'" -ForegroundColor Yellow
    Read-Host "اضغط Enter للخروج"
    exit 1
}

Write-Host "[معلومات] تم تشغيل PowerShell بصلاحيات المدير ✓" -ForegroundColor Green

# تثبيت Chocolatey إذا لم يكن موجوداً
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "[معلومات] تثبيت Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[خطأ] فشل في تثبيت Chocolatey!" -ForegroundColor Red
        Read-Host "اضغط Enter للخروج"
        exit 1
    }
    
    Write-Host "[معلومات] تم تثبيت Chocolatey ✓" -ForegroundColor Green
} else {
    Write-Host "[معلومات] Chocolatey موجود بالفعل ✓" -ForegroundColor Green
}

# تحديث Chocolatey
Write-Host "[معلومات] تحديث Chocolatey..." -ForegroundColor Yellow
choco upgrade chocolatey -y

# تثبيت PostgreSQL
Write-Host ""
Write-Host "[معلومات] تثبيت PostgreSQL..." -ForegroundColor Yellow
Write-Host "هذا قد يستغرق عدة دقائق..." -ForegroundColor Yellow

# كلمة مرور افتراضية لـ postgres
$postgresPassword = "PostgresPass123!"

choco install postgresql15 --params "/Password:$postgresPassword" -y

if ($LASTEXITCODE -ne 0) {
    Write-Host "[خطأ] فشل في تثبيت PostgreSQL!" -ForegroundColor Red
    Read-Host "اضغط Enter للخروج"
    exit 1
}

Write-Host "[معلومات] تم تثبيت PostgreSQL ✓" -ForegroundColor Green

# إضافة PostgreSQL إلى PATH
$postgresPath = "C:\Program Files\PostgreSQL\15\bin"
$currentPath = [Environment]::GetEnvironmentVariable("PATH", [EnvironmentVariableTarget]::Machine)

if ($currentPath -notlike "*$postgresPath*") {
    Write-Host "[معلومات] إضافة PostgreSQL إلى PATH..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$postgresPath", [EnvironmentVariableTarget]::Machine)
    $env:PATH += ";$postgresPath"
    Write-Host "[معلومات] تم إضافة PostgreSQL إلى PATH ✓" -ForegroundColor Green
}

# انتظار بدء خدمة PostgreSQL
Write-Host "[معلومات] انتظار بدء خدمة PostgreSQL..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# بدء خدمة PostgreSQL
Write-Host "[معلومات] بدء خدمة PostgreSQL..." -ForegroundColor Yellow
Start-Service postgresql-x64-15 -ErrorAction SilentlyContinue

# التحقق من تشغيل PostgreSQL
Write-Host "[معلومات] التحقق من تشغيل PostgreSQL..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

try {
    $result = & "$postgresPath\psql.exe" -U postgres -c "SELECT version();" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[معلومات] PostgreSQL يعمل بنجاح ✓" -ForegroundColor Green
    } else {
        throw "فشل في الاتصال"
    }
} catch {
    Write-Host "[تحذير] قد تحتاج لإعادة تشغيل الكمبيوتر لإكمال التثبيت" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "           تم تثبيت PostgreSQL بنجاح!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "معلومات التثبيت:" -ForegroundColor White
Write-Host "- المسار: $postgresPath" -ForegroundColor White
Write-Host "- المستخدم: postgres" -ForegroundColor White
Write-Host "- كلمة المرور: $postgresPassword" -ForegroundColor White
Write-Host "- المنفذ: 5432" -ForegroundColor White
Write-Host ""
Write-Host "الخطوات التالية:" -ForegroundColor Yellow
Write-Host "1. شغل setup-database.bat لإعداد قاعدة البيانات" -ForegroundColor White
Write-Host "2. شغل create-env.bat لإنشاء ملف الإعدادات" -ForegroundColor White
Write-Host "3. شغل start-project.bat لتشغيل المشروع" -ForegroundColor White
Write-Host ""

Read-Host "اضغط Enter للخروج"