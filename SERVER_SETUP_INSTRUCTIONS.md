# تعليمات نشر مشروع قرطبة للتوريدات على Windows Server

## الخطوات المطلوبة:

### 1. تحضير الخادم

#### تثبيت Node.js
1. تحميل Node.js LTS من: https://nodejs.org/en/download/
2. تشغيل المثبت واتباع التعليمات
3. إعادة تشغيل الخادم بعد التثبيت

#### تثبيت PostgreSQL
1. تحميل PostgreSQL من: https://www.postgresql.org/download/windows/
2. اختيار كلمة مرور قوية للمستخدم postgres
3. تسجيل البورت المستخدم (افتراضي: 5432)

### 2. إعداد قاعدة البيانات

```sql
-- تسجيل الدخول كمستخدم postgres
psql -U postgres

-- إنشاء قاعدة البيانات
CREATE DATABASE qortoba_supplies;

-- إنشاء مستخدم للتطبيق
CREATE USER qortoba_user WITH PASSWORD 'strong_password_123';

-- منح الصلاحيات
GRANT ALL PRIVILEGES ON DATABASE qortoba_supplies TO qortoba_user;

-- الخروج
\q
```

### 3. رفع ملفات المشروع

#### خيار 1: رفع كملف ZIP
1. ضغط جميع ملفات المشروع في ملف ZIP
2. رفع الملف للخادم
3. استخراج الملفات في مجلد مناسب (مثل: C:\qortoba-supplies)

#### خيار 2: استخدام Git (إذا كان متاح)
```bash
git clone [repository-url]
cd qortoba-supplies
```

### 4. تكوين المشروع

#### تشغيل ملف الإعداد التلقائي
```bash
# تشغيل ملف الإعداد
deploy-to-server.bat
```

#### أو الإعداد اليدوي:
```bash
# تثبيت التبعيات
npm install

# نسخ وتحرير ملف البيئة
copy .env.example .env
notepad .env

# إعداد قاعدة البيانات
npm run db:push

# بناء المشروع
npm run build
```

### 5. تحديث ملف .env

```env
NODE_ENV=production
DATABASE_URL=postgresql://qortoba_user:strong_password_123@localhost:5432/qortoba_supplies
PORT=3000
HOST=0.0.0.0
SESSION_SECRET=your_32_character_secret_key_here
```

### 6. تشغيل المشروع

#### تشغيل مؤقت للاختبار:
```bash
npm start
```

#### تشغيل مستمر باستخدام PM2:
```bash
# تثبيت PM2
npm install -g pm2

# تشغيل التطبيق
pm2 start npm --name "qortoba-supplies" -- start

# حفظ الإعدادات
pm2 save

# تشغيل تلقائي عند إعادة التشغيل
pm2 startup
```

### 7. إعداد Firewall

```cmd
# فتح البورت 3000
netsh advfirewall firewall add rule name="Qortoba Supplies App" dir=in action=allow protocol=TCP localport=3000
```

### 8. اختبار النظام

1. فتح المتصفح على: http://server-ip:3000
2. تسجيل الدخول باستخدام البيانات الافتراضية
3. التأكد من عمل جميع الميزات

### 9. إعداد النسخ الاحتياطية

#### إنشاء ملف backup.bat:
```batch
@echo off
set BACKUP_DIR=C:\backup\qortoba\%date:~-4,4%-%date:~-10,2%-%date:~-7,2%
mkdir "%BACKUP_DIR%" 2>nul

pg_dump -h localhost -U qortoba_user -d qortoba_supplies > "%BACKUP_DIR%\database.sql"
echo Backup completed: %BACKUP_DIR%
```

#### جدولة النسخ الاحتياطية:
1. فتح Task Scheduler
2. إنشاء مهمة يومية لتشغيل backup.bat

### 10. مراقبة النظام

#### مراقبة PM2:
```bash
pm2 status
pm2 logs qortoba-supplies
pm2 monit
```

#### مراقبة استخدام الموارد:
- Resource Monitor في Windows
- Task Manager للذاكرة والمعالج

### 11. استكشاف الأخطاء

#### مشاكل شائعة:

**خطأ في الاتصال بقاعدة البيانات:**
```bash
# التحقق من حالة PostgreSQL
net start postgresql-x64-14

# اختبار الاتصال
psql -h localhost -U qortoba_user -d qortoba_supplies
```

**البورت مستخدم:**
```bash
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

**مشاكل الصلاحيات:**
- التأكد من تشغيل Command Prompt كمدير
- التحقق من صلاحيات المجلد

### 12. تحديثات المستقبل

```bash
# إيقاف التطبيق
pm2 stop qortoba-supplies

# تحديث الكود
git pull origin main
# أو رفع ملفات جديدة

# تثبيت التبعيات الجديدة
npm install

# بناء المشروع
npm run build

# تشغيل migrations إذا لزم الأمر
npm run db:push

# إعادة تشغيل التطبيق
pm2 restart qortoba-supplies
```

## معلومات مهمة:

- **المستخدم الافتراضي**: admin
- **كلمة المرور الافتراضية**: admin123
- **البورت الافتراضي**: 3000
- **قاعدة البيانات**: PostgreSQL

## دعم فني:

للحصول على المساعدة:
1. التحقق من سجلات PM2: `pm2 logs`
2. التحقق من سجلات PostgreSQL
3. مراجعة Windows Event Viewer للأخطاء النظامية