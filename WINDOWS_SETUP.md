# تشغيل مشروع قرطبة على Windows RDP - بدون Git

## الخطوة 1: تحميل البرامج المطلوبة

### 1. تحميل Node.js
- اذهب إلى: https://nodejs.org/
- حمل النسخة LTS (الموصى بها)
- قم بتثبيتها بالإعدادات الافتراضية

### 2. تحميل PostgreSQL
- اذهب إلى: https://www.postgresql.org/download/windows/
- حمل PostgreSQL 15 أو أحدث
- أثناء التثبيت:
  - احفظ كلمة مرور المستخدم `postgres`
  - اختر المنفذ الافتراضي 5432

## الخطوة 2: تحضير المشروع

### 1. تنزيل ملفات المشروع
- من Replit، اضغط على الثلاث نقاط → "Download as ZIP"
- أو انسخ جميع الملفات يدوياً إلى مجلد جديد
- ضع المشروع في: `C:\qortoba-supplies`

### 2. فتح PowerShell كمدير
- اضغط `Windows + X`
- اختر "Windows PowerShell (Admin)"

## الخطوة 3: إعداد قاعدة البيانات

### 1. تشغيل PostgreSQL
```powershell
# الذهاب إلى مجلد PostgreSQL
cd "C:\Program Files\PostgreSQL\15\bin"

# تسجيل الدخول إلى PostgreSQL
.\psql.exe -U postgres
```

### 2. إنشاء قاعدة البيانات
```sql
-- إنشاء قاعدة البيانات
CREATE DATABASE qortoba_supplies;

-- إنشاء مستخدم جديد
CREATE USER qortoba_user WITH PASSWORD 'QortobaPass123!';

-- منح الصلاحيات
GRANT ALL PRIVILEGES ON DATABASE qortoba_supplies TO qortoba_user;

-- الخروج
\q
```

## الخطوة 4: إعداد المشروع

### 1. الذهاب إلى مجلد المشروع
```powershell
cd C:\qortoba-supplies
```

### 2. إنشاء ملف البيئة
```powershell
# إنشاء ملف .env
New-Item -Path ".env" -ItemType File

# تحرير الملف
notepad .env
```

### 3. إضافة إعدادات البيئة
أضف هذا المحتوى في ملف .env:
```
DATABASE_URL=postgresql://qortoba_user:QortobaPass123!@localhost:5432/qortoba_supplies
SESSION_SECRET=your-super-secret-session-key-make-it-very-long-and-random
NODE_ENV=production
PORT=5000
```

## الخطوة 5: تثبيت وتشغيل المشروع

### 1. تثبيت الحزم
```powershell
npm install
```

### 2. بناء المشروع
```powershell
npm run build
```

### 3. تشغيل المشروع
```powershell
npm start
```

## الخطوة 6: نسخ البيانات من Replit

### 1. تصدير البيانات
- في Replit، سجل دخول كمسؤول تقنية
- اذهب إلى صفحة الإدارة
- اضغط "إنشاء نسخة احتياطية كاملة"
- حمل الملف .sql

### 2. استيراد البيانات
```powershell
# الذهاب إلى مجلد PostgreSQL
cd "C:\Program Files\PostgreSQL\15\bin"

# استيراد النسخة الاحتياطية
.\psql.exe -U qortoba_user -d qortoba_supplies -f "C:\path\to\your\backup.sql"
```

## الخطوة 7: الوصول للنظام

### فتح المتصفح واذهب إلى:
```
http://localhost:5000
```

## أوامر PowerShell المفيدة

### إيقاف وتشغيل المشروع
```powershell
# إيقاف المشروع (Ctrl + C في نافذة التشغيل)

# تشغيل المشروع مرة أخرى
cd C:\qortoba-supplies
npm start
```

### فحص حالة قاعدة البيانات
```powershell
cd "C:\Program Files\PostgreSQL\15\bin"
.\psql.exe -U qortoba_user -d qortoba_supplies -c "SELECT COUNT(*) FROM users;"
```

### عمل نسخة احتياطية
```powershell
cd "C:\Program Files\PostgreSQL\15\bin"
.\pg_dump.exe -U qortoba_user -h localhost qortoba_supplies > "C:\backup_$(Get-Date -Format 'yyyyMMdd').sql"
```

## تشغيل المشروع كخدمة Windows (اختياري)

### 1. تثبيت PM2 للـ Windows
```powershell
npm install -g pm2
npm install -g pm2-windows-startup

# تشغيل المشروع بـ PM2
pm2 start dist/index.js --name "qortoba-supplies"

# حفظ الإعداد
pm2 save

# إعداد البدء التلقائي
pm2-startup install
```

### 2. أوامر PM2 المفيدة
```powershell
# مراقبة التطبيق
pm2 status
pm2 logs qortoba-supplies

# إعادة تشغيل
pm2 restart qortoba-supplies

# إيقاف
pm2 stop qortoba-supplies
```

## في حالة المشاكل

### 1. المشروع لا يعمل
- تحقق من أن Node.js مثبت: `node --version`
- تحقق من أن PostgreSQL يعمل
- راجع ملف .env

### 2. خطأ في قاعدة البيانات
- تحقق من كلمة المرور في DATABASE_URL
- تأكد من أن PostgreSQL يعمل على المنفذ 5432

### 3. لا يمكن الوصول للموقع
- تحقق من أن المنفذ 5000 غير محجوب
- جرب الوصول من: `http://127.0.0.1:5000`

## فتح المنافذ في Windows Firewall

```powershell
# فتح المنفذ 5000
New-NetFirewallRule -DisplayName "Qortoba Supplies" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
```

## ملاحظات مهمة

1. **احتفظ بنسخة من ملف .env** - يحتوي على إعدادات مهمة
2. **غير كلمة المرور الافتراضية** للأمان
3. **اعمل نسخة احتياطية يومية** من قاعدة البيانات
4. **راقب سجلات التطبيق** للتأكد من عدم وجود أخطاء

## ملفات التشغيل السريع

### تشغيل المشروع (start.bat)
```batch
@echo off
cd C:\qortoba-supplies
npm start
pause
```

### إيقاف المشروع (stop.bat)
```batch
@echo off
taskkill /f /im node.exe
echo Project stopped
pause
```

### نسخة احتياطية (backup.bat)
```batch
@echo off
cd "C:\Program Files\PostgreSQL\15\bin"
pg_dump.exe -U qortoba_user -h localhost qortoba_supplies > "C:\backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%.sql"
echo Backup completed
pause
```

---

**مع هذه التعليمات، يمكنك تشغيل المشروع على أي خادم Windows RDP بدون الحاجة لـ Git!**