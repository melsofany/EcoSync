# دليل النشر على RDP Server مع الربط بـ Replit Agent

## نظرة عامة
هذا الدليل يوضح كيفية نشر مشروع قرطبة للتوريدات على RDP server مع إمكانية:
- الوصول من خارج الشبكة (External Network Access)
- الربط مع Replit Agent للتعديلات عن بعد
- التحديثات التلقائية من GitHub

---

## المرحلة الأولى: إعداد RDP Server

### 1. متطلبات السيرفر
```
نظام التشغيل: Windows Server 2019+ أو Windows 10/11 Pro
المعالج: 4 cores minimum
الذاكرة: 8GB RAM minimum
التخزين: 100GB+ free space
الشبكة: إنترنت سريع + IP ثابت
```

### 2. فتح البورتات المطلوبة
```bash
# البورتات الأساسية
Port 5000    # تطبيق قرطبة
Port 22      # SSH للـ Replit Agent
Port 443     # HTTPS
Port 80      # HTTP
Port 3389    # RDP
Port 5432    # PostgreSQL (اختياري للوصول الخارجي)

# إعداد Windows Firewall
netsh advfirewall firewall add rule name="Qortoba App" dir=in action=allow protocol=TCP localport=5000
netsh advfirewall firewall add rule name="SSH" dir=in action=allow protocol=TCP localport=22
netsh advfirewall firewall add rule name="HTTPS" dir=in action=allow protocol=TCP localport=443
netsh advfirewall firewall add rule name="HTTP" dir=in action=allow protocol=TCP localport=80
```

### 3. إعداد Dynamic DNS (للوصول الخارجي)
```
استخدم إحد هذه الخدمات:
- No-IP (مجاني)
- DynDNS
- Duck DNS
- Cloudflare Dynamic DNS

مثال: qortoba-server.ddns.net
```

---

## المرحلة الثانية: إعداد البرامج الأساسية

### 1. تثبيت Node.js و Git
```batch
# استخدم الملف المحسن
ULTRA_SIMPLE_DEPLOY.bat
```

### 2. إعداد SSH Server للـ Replit Agent
```powershell
# تثبيت OpenSSH Server
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
Start-Service sshd
Set-Service -Name sshd -StartupType 'Automatic'

# إنشاء SSH Key للـ Replit Agent
ssh-keygen -t rsa -b 4096 -C "replit-agent@qortoba"

# إضافة Public Key للـ authorized_keys
mkdir C:\Users\%USERNAME%\.ssh
# انسخ public key إلى authorized_keys
```

### 3. إعداد Web Server (Nginx أو IIS)
```nginx
# nginx.conf
server {
    listen 80;
    server_name qortoba-server.ddns.net;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# SSL Certificate (Let's Encrypt)
server {
    listen 443 ssl;
    server_name qortoba-server.ddns.net;
    
    ssl_certificate /path/to/certificate.pem;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## المرحلة الثالثة: ربط Replit Agent

### 1. إعداد GitHub Repository
```bash
# إنشاء Repository جديد
git init
git remote add origin https://github.com/yourusername/qortoba-supplies.git
git add .
git commit -m "Initial deployment"
git push -u origin main
```

### 2. إنشاء GitHub Actions للنشر التلقائي
```yaml
# .github/workflows/deploy-to-rdp.yml
name: Deploy to RDP Server

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to RDP Server
      uses: appleboy/ssh-action@v0.1.4
      with:
        host: ${{ secrets.RDP_HOST }}
        username: ${{ secrets.RDP_USERNAME }}
        key: ${{ secrets.RDP_SSH_KEY }}
        script: |
          cd /c/QortobaProject/qortoba-supplies
          git pull origin main
          npm install --production
          pm2 restart qortoba-app || pm2 start server.js --name qortoba-app
```

### 3. إعداد Webhook للتحديثات الفورية
```javascript
// webhook-handler.js
const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');

const app = express();
app.use(express.json());

app.post('/webhook/github', (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    const payload = JSON.stringify(req.body);
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    
    const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const expectedSignature = `sha256=${hash}`;
    
    if (signature === expectedSignature) {
        console.log('Valid webhook received, updating project...');
        
        exec('cd /c/QortobaProject/qortoba-supplies && git pull && npm install && pm2 restart qortoba-app', 
             (error, stdout, stderr) => {
            if (error) {
                console.error(`Update failed: ${error}`);
                return res.status(500).send('Update failed');
            }
            console.log('Project updated successfully');
            res.status(200).send('Updated successfully');
        });
    } else {
        res.status(401).send('Unauthorized');
    }
});

app.listen(9000, () => {
    console.log('Webhook handler listening on port 9000');
});
```

---

## المرحلة الرابعة: إعداد Replit Agent Integration

### 1. إنشاء Replit Agent Configuration
```json
{
  "name": "qortoba-rdp-server",
  "type": "remote-server",
  "connection": {
    "protocol": "ssh",
    "host": "qortoba-server.ddns.net",
    "port": 22,
    "username": "administrator",
    "keyFile": "~/.ssh/qortoba_rsa"
  },
  "workingDirectory": "/c/QortobaProject/qortoba-supplies",
  "commands": {
    "start": "pm2 start server.js --name qortoba-app",
    "stop": "pm2 stop qortoba-app",
    "restart": "pm2 restart qortoba-app",
    "logs": "pm2 logs qortoba-app",
    "status": "pm2 status"
  },
  "sync": {
    "enabled": true,
    "excludes": [
      "node_modules",
      "dist",
      ".git",
      "logs"
    ]
  }
}
```

### 2. إعداد Real-time Sync
```javascript
// replit-sync.js
const chokidar = require('chokidar');
const { Client } = require('ssh2');
const path = require('path');

class ReplitSync {
    constructor(config) {
        this.config = config;
        this.ssh = new Client();
    }
    
    connect() {
        return new Promise((resolve, reject) => {
            this.ssh.connect({
                host: this.config.host,
                port: this.config.port,
                username: this.config.username,
                privateKey: require('fs').readFileSync(this.config.keyFile)
            });
            
            this.ssh.on('ready', resolve);
            this.ssh.on('error', reject);
        });
    }
    
    syncFile(localPath, remotePath) {
        const sftp = this.ssh.sftp((err, sftp) => {
            if (err) throw err;
            
            sftp.fastPut(localPath, remotePath, (err) => {
                if (err) {
                    console.error(`Failed to sync ${localPath}:`, err);
                } else {
                    console.log(`Synced: ${localPath} -> ${remotePath}`);
                }
            });
        });
    }
    
    watch() {
        const watcher = chokidar.watch('.', {
            ignored: this.config.sync.excludes,
            persistent: true
        });
        
        watcher.on('change', (filePath) => {
            const remotePath = path.join(this.config.workingDirectory, filePath)
                                    .replace(/\\/g, '/');
            this.syncFile(filePath, remotePath);
        });
    }
}
```

---

## المرحلة الخامسة: إعداد الأمان والمراقبة

### 1. SSL Certificate (Let's Encrypt)
```bash
# تثبيت Certbot
choco install certbot

# إنشاء Certificate
certbot certonly --standalone -d qortoba-server.ddns.net

# تجديد تلقائي
schtasks /create /tn "Certbot Renewal" /tr "certbot renew" /sc daily
```

### 2. إعداد Monitoring
```javascript
// monitoring.js
const express = require('express');
const os = require('os');
const { execSync } = require('child_process');

const app = express();

app.get('/health', (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: os.loadavg(),
            disk: execSync('wmic logicaldisk get size,freespace,caption', {encoding: 'utf8'}),
            services: {
                app: checkAppStatus(),
                database: checkDatabaseStatus(),
                nginx: checkNginxStatus()
            }
        };
        
        res.json(health);
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

function checkAppStatus() {
    try {
        execSync('pm2 show qortoba-app');
        return 'running';
    } catch {
        return 'stopped';
    }
}

function checkDatabaseStatus() {
    try {
        execSync('sc query postgresql-x64-15');
        return 'running';
    } catch {
        return 'stopped';
    }
}

function checkNginxStatus() {
    try {
        execSync('sc query nginx');
        return 'running';
    } catch {
        return 'stopped';
    }
}

app.listen(8080, () => {
    console.log('Health monitor running on port 8080');
});
```

### 3. إعداد Backup التلقائي
```batch
@echo off
REM daily-backup.bat
set TIMESTAMP=%date:~-4,4%_%date:~-10,2%_%date:~-7,2%
set BACKUP_DIR=C:\QortobaBackups\daily

mkdir "%BACKUP_DIR%\%TIMESTAMP%"

REM Backup application files
xcopy "C:\QortobaProject\qortoba-supplies" "%BACKUP_DIR%\%TIMESTAMP%\app" /E /H /Y /Q

REM Backup database
"C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" -U postgres -h localhost -d qortoba_db > "%BACKUP_DIR%\%TIMESTAMP%\database.sql"

REM Upload to cloud storage (optional)
rclone copy "%BACKUP_DIR%\%TIMESTAMP%" remote:qortoba-backups/%TIMESTAMP%

echo Backup completed: %TIMESTAMP%
```

---

## المرحلة السادسة: الاختبار والتشغيل

### 1. اختبار الوصول المحلي
```
http://localhost:5000
```

### 2. اختبار الوصول الخارجي
```
http://qortoba-server.ddns.net
https://qortoba-server.ddns.net
```

### 3. اختبار Replit Agent Connection
```bash
# من Replit
ssh administrator@qortoba-server.ddns.net
cd /c/QortobaProject/qortoba-supplies
pm2 status
```

### 4. اختبار التحديثات
```bash
# تعديل ملف في Replit
# يجب أن يتم التحديث تلقائياً على السيرفر
```

---

## استكشاف الأخطاء

### مشاكل شائعة وحلولها:

1. **SSH Connection Failed**
   ```
   - تأكد من تشغيل OpenSSH Server
   - فحص البورت 22 في الجدار الناري
   - التأكد من صحة SSH Keys
   ```

2. **External Access Blocked**
   ```
   - فحص router port forwarding
   - التأكد من Dynamic DNS
   - فحص ISP restrictions
   ```

3. **Replit Agent Sync Issues**
   ```
   - فحص file permissions
   - التأكد من working directory
   - مراجعة sync configuration
   ```

4. **SSL Certificate Issues**
   ```
   - تجديد Certificate
   - فحص DNS resolution
   - مراجعة Nginx configuration
   ```

---

## الصيانة الدورية

### يومياً:
- فحص logs للأخطاء
- مراقبة استخدام الموارد
- التأكد من عمل النسخ الاحتياطية

### أسبوعياً:
- تحديث نظام التشغيل
- مراجعة security logs
- تنظيف ملفات مؤقتة

### شهرياً:
- تجديد SSL certificates
- مراجعة performance metrics
- تحديث التطبيق والتبعيات

---

## معلومات مهمة

### أرقام البورتات:
- **5000**: تطبيق قرطبة
- **22**: SSH للـ Replit Agent
- **443/80**: Web access
- **8080**: Health monitoring
- **9000**: GitHub webhook

### مجلدات مهمة:
- **C:\QortobaProject**: مجلد التطبيق
- **C:\QortobaBackups**: النسخ الاحتياطية
- **C:\nginx**: Web server
- **%USERPROFILE%\.ssh**: SSH keys

### خدمات Windows:
- **OpenSSH SSH Server**: للـ Replit Agent
- **PostgreSQL**: قاعدة البيانات
- **Nginx**: Web server (اختياري)

---

*آخر تحديث: يناير 2025*