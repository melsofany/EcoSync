# تثبيت Node.js من PowerShell
# يجب تشغيل PowerShell كمدير (Administrator)

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "       تثبيت Node.js لمشروع قرطبة" -ForegroundColor Cyan
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

# التحقق من وجود Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "[معلومات] Node.js موجود بالفعل - الإصدار: $nodeVersion" -ForegroundColor Green
    $continue = Read-Host "هل تريد إعادة التثبيت؟ (y/n)"
    if ($continue -ne 'y') {
        Write-Host "تم الإلغاء." -ForegroundColor Yellow
        Read-Host "اضغط Enter للخروج"
        exit 0
    }
}

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

# تثبيت Node.js LTS
Write-Host ""
Write-Host "[معلومات] تثبيت Node.js LTS..." -ForegroundColor Yellow
Write-Host "هذا قد يستغرق عدة دقائق..." -ForegroundColor Yellow

choco install nodejs-lts -y

if ($LASTEXITCODE -ne 0) {
    Write-Host "[خطأ] فشل في تثبيت Node.js!" -ForegroundColor Red
    Read-Host "اضغط Enter للخروج"
    exit 1
}

Write-Host "[معلومات] تم تثبيت Node.js ✓" -ForegroundColor Green

# تحديث PATH للجلسة الحالية
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")

# التحقق من التثبيت
Write-Host "[معلومات] التحقق من تثبيت Node.js..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $nodeVersion = node --version 2>$null
    $npmVersion = npm --version 2>$null
    
    if ($nodeVersion -and $npmVersion) {
        Write-Host "[معلومات] Node.js يعمل بنجاح ✓" -ForegroundColor Green
        Write-Host "- إصدار Node.js: $nodeVersion" -ForegroundColor White
        Write-Host "- إصدار NPM: $npmVersion" -ForegroundColor White
    } else {
        throw "فشل في التحقق من Node.js"
    }
} catch {
    Write-Host "[تحذير] قد تحتاج لإعادة فتح PowerShell أو إعادة تشغيل الكمبيوتر" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "           تم تثبيت Node.js بنجاح!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "الخطوات التالية:" -ForegroundColor Yellow
Write-Host "1. شغل install-postgresql.ps1 لتثبيت PostgreSQL" -ForegroundColor White
Write-Host "2. شغل setup-database.bat لإعداد قاعدة البيانات" -ForegroundColor White
Write-Host "3. شغل create-env.bat لإنشاء ملف الإعدادات" -ForegroundColor White
Write-Host "4. شغل start-project.bat لتشغيل المشروع" -ForegroundColor White
Write-Host ""

Read-Host "اضغط Enter للخروج"