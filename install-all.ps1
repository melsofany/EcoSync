# تثبيت جميع المتطلبات لمشروع قرطبة للتوريدات
# يجب تشغيل PowerShell كمدير (Administrator)

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "     تثبيت جميع متطلبات مشروع قرطبة" -ForegroundColor Cyan
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
Write-Host ""

Write-Host "سيتم تثبيت:" -ForegroundColor Yellow
Write-Host "- Chocolatey (مدير الحزم)" -ForegroundColor White
Write-Host "- Node.js LTS (بيئة التشغيل)" -ForegroundColor White
Write-Host "- PostgreSQL 15 (قاعدة البيانات)" -ForegroundColor White
Write-Host ""

$continue = Read-Host "هل تريد المتابعة؟ (y/n)"
if ($continue -ne 'y') {
    Write-Host "تم الإلغاء." -ForegroundColor Yellow
    Read-Host "اضغط Enter للخروج"
    exit 0
}

Write-Host ""

# ===== تثبيت Chocolatey =====
Write-Host "🍫 تثبيت Chocolatey..." -ForegroundColor Cyan
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
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
choco upgrade chocolatey -y

Write-Host ""

# ===== تثبيت Node.js =====
Write-Host "🟢 تثبيت Node.js..." -ForegroundColor Cyan
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    choco install nodejs-lts -y
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[خطأ] فشل في تثبيت Node.js!" -ForegroundColor Red
        Read-Host "اضغط Enter للخروج"
        exit 1
    }
    
    Write-Host "[معلومات] تم تثبيت Node.js ✓" -ForegroundColor Green
} else {
    $nodeVersion = node --version
    Write-Host "[معلومات] Node.js موجود بالفعل - الإصدار: $nodeVersion ✓" -ForegroundColor Green
}

Write-Host ""

# ===== تثبيت PostgreSQL =====
Write-Host "🐘 تثبيت PostgreSQL..." -ForegroundColor Cyan
$postgresPath = "C:\Program Files\PostgreSQL\15\bin"

if (-not (Test-Path "$postgresPath\psql.exe")) {
    $postgresPassword = "PostgresPass123!"
    choco install postgresql15 --params "/Password:$postgresPassword" -y
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[خطأ] فشل في تثبيت PostgreSQL!" -ForegroundColor Red
        Read-Host "اضغط Enter للخروج"
        exit 1
    }
    
    # إضافة PostgreSQL إلى PATH
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", [EnvironmentVariableTarget]::Machine)
    if ($currentPath -notlike "*$postgresPath*") {
        [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$postgresPath", [EnvironmentVariableTarget]::Machine)
        $env:PATH += ";$postgresPath"
    }
    
    Write-Host "[معلومات] تم تثبيت PostgreSQL ✓" -ForegroundColor Green
    
    # انتظار بدء الخدمة
    Write-Host "[معلومات] انتظار بدء خدمة PostgreSQL..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    Start-Service postgresql-x64-15 -ErrorAction SilentlyContinue
    
} else {
    Write-Host "[معلومات] PostgreSQL موجود بالفعل ✓" -ForegroundColor Green
    $postgresPassword = "PostgresPass123!"
}

Write-Host ""

# ===== التحقق من التثبيتات =====
Write-Host "🔍 التحقق من التثبيتات..." -ForegroundColor Cyan

# تحديث PATH للجلسة الحالية
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")

# فحص Node.js
try {
    $nodeVersion = node --version 2>$null
    $npmVersion = npm --version 2>$null
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "✓ NPM: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠ Node.js: قد تحتاج لإعادة فتح PowerShell" -ForegroundColor Yellow
}

# فحص PostgreSQL
try {
    Start-Sleep -Seconds 5
    $result = & "$postgresPath\psql.exe" -U postgres -c "SELECT version();" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ PostgreSQL: يعمل بنجاح" -ForegroundColor Green
    } else {
        Write-Host "⚠ PostgreSQL: قد تحتاج لإعادة تشغيل الكمبيوتر" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ PostgreSQL: قد تحتاج لإعادة تشغيل الكمبيوتر" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "         تم تثبيت جميع المتطلبات!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "معلومات مهمة:" -ForegroundColor Yellow
Write-Host "- كلمة مرور PostgreSQL: $postgresPassword" -ForegroundColor White
Write-Host "- مستخدم PostgreSQL: postgres" -ForegroundColor White
Write-Host "- منفذ PostgreSQL: 5432" -ForegroundColor White
Write-Host ""

Write-Host "الخطوات التالية:" -ForegroundColor Yellow
Write-Host "1. انسخ ملفات المشروع إلى مجلد (مثل C:\qortoba-supplies)" -ForegroundColor White
Write-Host "2. شغل setup-database.bat لإعداد قاعدة البيانات" -ForegroundColor White
Write-Host "3. شغل create-env.bat لإنشاء ملف الإعدادات" -ForegroundColor White
Write-Host "4. شغل start-project.bat لتشغيل المشروع" -ForegroundColor White
Write-Host ""

Write-Host "💡 نصيحة: إذا لم تعمل الأوامر، أعد تشغيل PowerShell أو الكمبيوتر" -ForegroundColor Cyan
Write-Host ""

Read-Host "اضغط Enter للخروج"