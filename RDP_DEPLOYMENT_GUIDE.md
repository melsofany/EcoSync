# دليل نشر المشروع على خادم RDP

## متطلبات النشر

### 1. متطلبات النظام
- Windows Server أو Windows 10/11
- Node.js 18 أو أحدث
- PostgreSQL 12 أو أحدث
- Git (اختياري)

### 2. تحميل المشروع
```bash
# خيار 1: استنساخ من GitHub (إذا كان متاح)
git clone [رابط المستودع]

# خيار 2: تحميل كملف ZIP
# قم بتحميل جميع الملفات من Replit
```

### 3. إعداد قاعدة البيانات PostgreSQL

#### تثبيت PostgreSQL
1. تحميل PostgreSQL من: https://www.postgresql.org/download/windows/
2. تثبيت PostgreSQL مع إعدادات افتراضية
3. تسجيل كلمة مرور المستخدم postgres

#### إنشاء قاعدة البيانات
```sql
-- الاتصال بـ PostgreSQL كمستخدم postgres
CREATE DATABASE qortoba_supplies;
CREATE USER qortoba_user WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE qortoba_supplies TO qortoba_user;
```

### 4. إعداد المشروع

#### تثبيت التبعيات
```bash
cd project_directory
npm install
```

#### إعداد متغيرات البيئة
إنشاء ملف `.env` في جذر المشروع:
```env
NODE_ENV=production
DATABASE_URL=postgresql://qortoba_user:strong_password_here@localhost:5432/qortoba_supplies
PORT=3000
SESSION_SECRET=your_very_secure_session_secret_here_min_32_chars
```

#### تشغيل المايقريشن
```bash
# إنشاء الجداول
npm run db:push
```

### 5. بناء المشروع للإنتاج
```bash
# بناء الواجهة الأمامية
npm run build

# تشغيل المشروع
npm run start
```

### 6. إعداد الخدمة (Service) - اختياري

#### استخدام PM2 لإدارة العملية
```bash
# تثبيت PM2 عالمياً
npm install -g pm2

# تشغيل المشروع مع PM2
pm2 start npm --name "qortoba-supplies" -- start

# حفظ إعدادات PM2
pm2 save
pm2 startup
```

#### إنشاء ملف batch للتشغيل التلقائي
إنشاء ملف `start-qortoba.bat`:
```batch
@echo off
cd /d "C:\path\to\your\project"
npm start
pause
```

### 7. إعداد Nginx كخادم عكسي (اختياري)

#### تثبيت Nginx لـ Windows
1. تحميل من: http://nginx.org/en/download.html
2. استخراج إلى C:\nginx

#### إعداد Nginx
ملف `nginx.conf`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 8. الحماية والأمان

#### إعداد Firewall
```bash
# فتح البورت المطلوب فقط
netsh advfirewall firewall add rule name="Qortoba Supplies" dir=in action=allow protocol=TCP localport=3000
```

#### النسخ الاحتياطية التلقائية
إنشاء ملف `backup.bat`:
```batch
@echo off
set BACKUP_DIR=C:\backup\qortoba\%date:~-4,4%-%date:~-10,2%-%date:~-7,2%
mkdir "%BACKUP_DIR%" 2>nul

pg_dump -h localhost -U qortoba_user -d qortoba_supplies > "%BACKUP_DIR%\database.sql"

echo Backup completed: %BACKUP_DIR%
```

### 9. مراقبة النظام

#### ملفات السجلات
- سجلات التطبيق: `logs/app.log`
- سجلات قاعدة البيانات: PostgreSQL logs
- سجلات النظام: Windows Event Viewer

#### مراقبة الأداء
```bash
# مراقبة العمليات
pm2 monit

# عرض السجلات
pm2 logs qortoba-supplies
```

### 10. استكشاف الأخطاء

#### مشاكل شائعة وحلولها

**مشكلة**: فشل في الاتصال بقاعدة البيانات
```bash
# التحقق من حالة PostgreSQL
net start postgresql-x64-13

# اختبار الاتصال
psql -h localhost -U qortoba_user -d qortoba_supplies
```

**مشكلة**: البورت مستخدم
```bash
# العثور على العملية التي تستخدم البورت
netstat -ano | findstr :3000

# إنهاء العملية
taskkill /PID [PID_NUMBER] /F
```

### 11. الصيانة الدورية

#### تحديث التبعيات
```bash
npm update
npm audit fix
```

#### تنظيف السجلات
```bash
# تنظيف سجلات PM2
pm2 flush

# تنظيف ملفات السجلات القديمة
forfiles /p C:\path\to\logs /s /m *.log /d -30 /c "cmd /c del @path"
```

## ملاحظات مهمة

1. **الأمان**: تأكد من تغيير كلمات المرور الافتراضية
2. **النسخ الاحتياطية**: قم بإعداد نسخ احتياطية تلقائية يومية
3. **المراقبة**: راقب استخدام الموارد بانتظام
4. **التحديثات**: احتفظ بالنظام محدثاً

## دعم فني
للمساعدة في حل المشاكل، تحقق من:
- سجلات التطبيق
- سجلات قاعدة البيانات  
- سجلات النظام في Windows Event Viewer