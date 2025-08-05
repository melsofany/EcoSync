# 🖥️ دليل نشر مشروع قرطبة للتوريدات على خادم RDP

## 📋 نظرة عامة

هذا الدليل يوضح كيفية نشر مشروع قرطبة للتوريدات من GitHub إلى خادم Windows RDP الخاص بك.

## 🎯 المتطلبات الأساسية

### خادم RDP
- Windows Server 2019/2022 أو Windows 10/11 Pro
- 4GB RAM على الأقل (8GB مُوصى به)
- 20GB مساحة تخزين متاحة
- اتصال إنترنت مستقر

### البرامج المطلوبة
- **Node.js 18+** - بيئة تشغيل JavaScript
- **PostgreSQL 13+** - قاعدة البيانات
- **Git** - لاستنساخ المشروع من GitHub
- **PM2** - إدارة العمليات (اختياري)

## 🔧 خطوات التثبيت

### 1. إعداد خادم RDP

#### الاتصال بالخادم
```cmd
# من حاسوبك المحلي
mstsc /v:your-server-ip:3389
```

#### تحديث Windows
```powershell
# في PowerShell كمدير
Install-Module PSWindowsUpdate
Get-WUInstall -AcceptAll -AutoReboot
```

### 2. تثبيت Node.js

#### تحميل وتثبيت Node.js
1. اذهب إلى [nodejs.org](https://nodejs.org)
2. حمل **LTS version** (18.x أو أحدث)
3. شغل الملف المُحمل وتابع التثبيت
4. تأكد من تفعيل "Add to PATH"

#### فحص التثبيت
```cmd
node --version
npm --version
```

### 3. تثبيت PostgreSQL

#### تحميل PostgreSQL
1. اذهب إلى [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. حمل **PostgreSQL 13+**
3. شغل المثبت

#### إعداد PostgreSQL
```sql
-- في pgAdmin أو psql
CREATE DATABASE qortoba_supplies;
CREATE USER qortoba_user WITH PASSWORD 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON DATABASE qortoba_supplies TO qortoba_user;
```

### 4. تثبيت Git

#### تحميل Git
1. اذهب إلى [git-scm.com](https://git-scm.com/download/win)
2. حمل Git for Windows
3. ثبت البرنامج مع الإعدادات الافتراضية

## 📥 تحميل المشروع من GitHub

### 1. استنساخ Repository

```cmd
# إنشاء مجلد للمشاريع
mkdir C:\Projects
cd C:\Projects

# استنساخ المشروع
git clone https://github.com/ahmed-lifeendy/qortoba-supplies.git
cd qortoba-supplies
```

### 2. تثبيت التبعيات

```cmd
# تثبيت packages
npm install

# أو للبيئة الإنتاجية فقط
npm ci --omit=dev
```

## ⚙️ إعداد المشروع

### 1. إعداد متغيرات البيئة

```cmd
# نسخ ملف البيئة
copy .env.production.example .env
```

#### تعديل ملف .env
```env
NODE_ENV=production
DATABASE_URL=postgresql://qortoba_user:YourStrongPassword123!@localhost:5432/qortoba_supplies
PORT=5000
SESSION_SECRET=YourSecureSessionSecret123!
DEEPSEEK_API_KEY=your_ai_key_if_available
```

### 2. بناء المشروع

```cmd
# بناء Frontend و Backend
npm run build
```

### 3. إعداد قاعدة البيانات

```cmd
# إنشاء الجداول
npm run db:push
```

### 4. اختبار الاتصال

```cmd
# اختبار قاعدة البيانات
node test-db.js
```

## 🚀 تشغيل المشروع

### الطريقة الأولى: تشغيل مباشر (للاختبار)

```cmd
# تشغيل المشروع
npm start

# أو للتطوير
npm run dev
```

### الطريقة الثانية: باستخدام PM2 (للإنتاج)

#### تثبيت PM2
```cmd
npm install -g pm2
pm2 install pm2-windows-service
pm2-service-install
```

#### تشغيل المشروع مع PM2
```cmd
# تشغيل التطبيق
pm2 start npm --name "qortoba-supplies" -- start

# حفظ الإعدادات
pm2 save

# تشغيل تلقائي عند إعادة تشغيل الخادم
pm2 startup
```

## 🌐 إعداد الوصول الخارجي

### 1. إعداد Windows Firewall

```powershell
# في PowerShell كمدير
New-NetFirewallRule -DisplayName "Qortoba Supplies" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
```

### 2. إعداد IIS كـ Reverse Proxy (اختياري)

#### تثبيت IIS و URL Rewrite
```powershell
# تفعيل IIS
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-HttpErrors, IIS-HttpLogging, IIS-RequestFiltering, IIS-StaticContent

# تحميل URL Rewrite من Microsoft
```

#### إعداد web.config
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReverseProxyInboundRule1" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:5000/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

## 📊 مراقبة النظام

### مراقبة PM2
```cmd
# حالة التطبيقات
pm2 status

# مراقبة مباشرة
pm2 monit

# عرض السجلات
pm2 logs qortoba-supplies

# إعادة تشغيل
pm2 restart qortoba-supplies
```

### مراقبة الموارد
```powershell
# استخدام الذاكرة والمعالج
Get-Process -Name node
Get-Counter "\Processor(_Total)\% Processor Time"
```

## 🔄 التحديثات المستقبلية

### تحديث من GitHub
```cmd
cd C:\Projects\qortoba-supplies

# سحب آخر التحديثات
git pull origin main

# تثبيت التبعيات الجديدة
npm install

# بناء المشروع
npm run build

# تحديث قاعدة البيانات
npm run db:push

# إعادة تشغيل التطبيق
pm2 restart qortoba-supplies
```

## 🔒 الأمان والحماية

### 1. حماية قاعدة البيانات
```sql
-- تغيير كلمة مرور PostgreSQL
ALTER USER postgres PASSWORD 'NewStrongPassword123!';
ALTER USER qortoba_user PASSWORD 'NewUserPassword123!';
```

### 2. حماية Windows
```powershell
# تفعيل Windows Defender
Set-MpPreference -DisableRealtimeMonitoring $false

# تحديث تعريفات الحماية
Update-MpSignature
```

### 3. النسخ الاحتياطية التلقائية
```batch
@echo off
REM backup-database.bat
set PGPASSWORD=YourStrongPassword123!
pg_dump -U qortoba_user -h localhost qortoba_supplies > "C:\Backups\qortoba_%date:~-4,4%%date:~-10,2%%date:~-7,2%.sql"
```

#### جدولة النسخ الاحتياطية
```powershell
# في Task Scheduler
schtasks /create /tn "Qortoba Backup" /tr "C:\Projects\qortoba-supplies\backup-database.bat" /sc daily /st 02:00
```

## 🆘 استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### المنفذ مشغول
```cmd
# العثور على العملية
netstat -ano | findstr :5000

# إنهاء العملية
taskkill /PID [PID_NUMBER] /F
```

#### خطأ اتصال قاعدة البيانات
```cmd
# فحص حالة PostgreSQL
sc query postgresql-x64-13

# إعادة تشغيل الخدمة
net stop postgresql-x64-13
net start postgresql-x64-13
```

#### مشاكل الذاكرة
```cmd
# فحص استخدام الذاكرة
tasklist /fi "imagename eq node.exe"

# إعادة تشغيل التطبيق
pm2 restart qortoba-supplies
```

## 📋 قائمة التحقق

### قبل النشر
- [ ] Windows Server محدث
- [ ] Node.js 18+ مثبت
- [ ] PostgreSQL 13+ مثبت ومُعد
- [ ] Git مثبت
- [ ] Firewall مُعد للمنفذ 5000

### أثناء النشر
- [ ] المشروع مُستنسخ من GitHub
- [ ] التبعيات مثبتة بنجاح
- [ ] ملف .env مُعد بالقيم الصحيحة
- [ ] المشروع مبني بنجاح
- [ ] قاعدة البيانات مُعدة

### بعد النشر
- [ ] التطبيق يعمل على المنفذ 5000
- [ ] قاعدة البيانات متصلة
- [ ] الموقع يفتح في المتصفح
- [ ] تسجيل الدخول يعمل
- [ ] PM2 مُعد للتشغيل التلقائي

## 🎉 الوصول للنظام

بعد إكمال النشر:
- **محلياً على الخادم**: http://localhost:5000
- **من أجهزة أخرى**: http://[server-ip]:5000
- **مع اسم النطاق**: http://yourdomain.com (إذا تم إعداد DNS)

## 📞 الدعم الفني

### السجلات المفيدة للتشخيص
```cmd
# سجلات PM2
pm2 logs qortoba-supplies --lines 50

# سجلات Windows
eventvwr.msc

# فحص الأداء
perfmon.msc
```

---

## ✅ تم النشر بنجاح!

مبروك! نظام قرطبة للتوريدات يعمل الآن على خادم RDP الخاص بك، جاهز لخدمة المستخدمين بكفاءة وأمان عاليين.

**النظام جاهز للاستخدام الفعلي! 🎊**