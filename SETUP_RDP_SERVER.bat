@echo off
REM =================================================================
REM سكريبت إعداد خادم RDP لمشروع قرطبة للتوريدات
REM Setup script for Qortoba Supplies RDP Server
REM =================================================================

echo.
echo ================================
echo    قرطبة للتوريدات - إعداد الخادم
echo    Qortoba Supplies - Server Setup
echo ================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [✓] Running as Administrator
) else (
    echo [✗] Error: This script must be run as Administrator
    echo [!] Right-click and select "Run as Administrator"
    pause
    exit /b 1
)

echo.
echo [1/8] Creating project directories...
if not exist "C:\Projects" mkdir "C:\Projects"
if not exist "C:\Backups" mkdir "C:\Backups"
if not exist "C:\Logs" mkdir "C:\Logs"
echo [✓] Directories created

echo.
echo [2/8] Configuring Windows Firewall...
netsh advfirewall firewall add rule name="Qortoba Supplies HTTP" dir=in action=allow protocol=TCP localport=5000
netsh advfirewall firewall add rule name="PostgreSQL" dir=in action=allow protocol=TCP localport=5432
echo [✓] Firewall rules added

echo.
echo [3/8] Enabling IIS (if available)...
dism /online /enable-feature /featurename:IIS-WebServerRole /all /norestart
dism /online /enable-feature /featurename:IIS-WebServer /all /norestart
dism /online /enable-feature /featurename:IIS-CommonHttpFeatures /all /norestart
echo [✓] IIS features enabled

echo.
echo [4/8] Setting up Windows services optimization...
REM Optimize services for better performance
sc config "Themes" start= disabled
sc config "Fax" start= disabled
sc config "TabletInputService" start= disabled
echo [✓] Services optimized

echo.
echo [5/8] Installing Chocolatey package manager...
powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
echo [✓] Chocolatey installed

echo.
echo [6/8] Installing required software via Chocolatey...
choco install nodejs --version=18.19.0 -y
choco install postgresql13 --params "/Password:QortobaDB2024!" -y
choco install git -y
choco install notepadplusplus -y
echo [✓] Software packages installed

echo.
echo [7/8] Setting up environment variables...
setx NODE_ENV "production" /M
setx PATH "%PATH%;C:\Program Files\nodejs;C:\Program Files\PostgreSQL\13\bin" /M
echo [✓] Environment variables set

echo.
echo [8/8] Creating service management scripts...

REM Create start service script
echo @echo off > "C:\Projects\start-qortoba.bat"
echo echo Starting Qortoba Supplies... >> "C:\Projects\start-qortoba.bat"
echo cd /d "C:\Projects\qortoba-supplies" >> "C:\Projects\start-qortoba.bat"
echo pm2 start npm --name "qortoba-supplies" -- start >> "C:\Projects\start-qortoba.bat"
echo pm2 save >> "C:\Projects\start-qortoba.bat"
echo echo Qortoba Supplies started successfully! >> "C:\Projects\start-qortoba.bat"
echo pause >> "C:\Projects\start-qortoba.bat"

REM Create stop service script
echo @echo off > "C:\Projects\stop-qortoba.bat"
echo echo Stopping Qortoba Supplies... >> "C:\Projects\stop-qortoba.bat"
echo pm2 stop qortoba-supplies >> "C:\Projects\stop-qortoba.bat"
echo echo Qortoba Supplies stopped. >> "C:\Projects\stop-qortoba.bat"
echo pause >> "C:\Projects\stop-qortoba.bat"

REM Create restart service script
echo @echo off > "C:\Projects\restart-qortoba.bat"
echo echo Restarting Qortoba Supplies... >> "C:\Projects\restart-qortoba.bat"
echo cd /d "C:\Projects\qortoba-supplies" >> "C:\Projects\restart-qortoba.bat"
echo git pull origin main >> "C:\Projects\restart-qortoba.bat"
echo npm install >> "C:\Projects\restart-qortoba.bat"
echo npm run build >> "C:\Projects\restart-qortoba.bat"
echo pm2 restart qortoba-supplies >> "C:\Projects\restart-qortoba.bat"
echo echo Qortoba Supplies restarted successfully! >> "C:\Projects\restart-qortoba.bat"
echo pause >> "C:\Projects\restart-qortoba.bat"

REM Create backup script
echo @echo off > "C:\Projects\backup-qortoba.bat"
echo set PGPASSWORD=QortobaDB2024! >> "C:\Projects\backup-qortoba.bat"
echo for /f "tokens=2-4 delims=/ " %%%%a in ('date /t') do (set mydate=%%%%c-%%%%a-%%%%b) >> "C:\Projects\backup-qortoba.bat"
echo for /f "tokens=1-2 delims=/:" %%%%a in ('time /t') do (set mytime=%%%%a%%%%b) >> "C:\Projects\backup-qortoba.bat"
echo pg_dump -U qortoba_user -h localhost qortoba_supplies > "C:\Backups\qortoba_%%mydate%%_%%mytime%%.sql" >> "C:\Projects\backup-qortoba.bat"
echo echo Backup completed: qortoba_%%mydate%%_%%mytime%%.sql >> "C:\Projects\backup-qortoba.bat"

echo [✓] Management scripts created

echo.
echo ================================
echo    إعداد الخادم مكتمل!
echo    Server Setup Complete!
echo ================================
echo.
echo Next Steps:
echo 1. Restart the server to apply all changes
echo 2. Run: git clone https://github.com/ahmed-lifeendy/qortoba-supplies.git
echo 3. Follow the deployment guide in RDP_DEPLOYMENT_GUIDE.md
echo.
echo Management Scripts Created:
echo - C:\Projects\start-qortoba.bat
echo - C:\Projects\stop-qortoba.bat  
echo - C:\Projects\restart-qortoba.bat
echo - C:\Projects\backup-qortoba.bat
echo.
echo Default PostgreSQL Password: QortobaDB2024!
echo Remember to change this password after setup!
echo.
pause

REM Schedule automatic backup
schtasks /create /tn "Qortoba Daily Backup" /tr "C:\Projects\backup-qortoba.bat" /sc daily /st 02:00 /f

echo.
echo [✓] Automatic daily backup scheduled at 2:00 AM
echo.
echo ================================
echo Server ready for Qortoba Supplies deployment!
echo Please restart the server and continue with GitHub deployment.
echo ================================
pause