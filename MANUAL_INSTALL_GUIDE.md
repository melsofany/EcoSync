# 📝 دليل التثبيت اليدوي - إذا فشل السكريپت التلقائي

## 🛠️ تثبيت البرامج يدوياً

إذا فشل `ONE_CLICK_DEPLOY.bat` في تثبيت أي برنامج، يمكنك تثبيتها يدوياً:

### 1. تثبيت Node.js
1. اذهب إلى: https://nodejs.org
2. حمل **LTS version** (18.x أو أحدث)
3. شغل الملف وتابع التثبيت
4. تأكد من تفعيل "Add to PATH"
5. أعد تشغيل Command Prompt
6. تحقق: `node --version`

### 2. تثبيت Git
1. اذهب إلى: https://git-scm.com
2. حمل **Git for Windows**  
3. شغل الملف وتابع التثبيت
4. اختر الإعدادات الافتراضية
5. تحقق: `git --version`

### 3. تثبيت PostgreSQL
1. اذهب إلى: https://postgresql.org/download/windows
2. حمل **PostgreSQL 13+**
3. شغل الملف وتابع التثبيت
4. اضبط كلمة مرور: `QortobaDB2024!`
5. تحقق: `psql --version`

## 🚀 تشغيل المشروع يدوياً

بعد تثبيت البرامج:

### 1. تحميل المشروع
```cmd
# إنشاء مجلد
mkdir C:\Projects
cd C:\Projects

# تحميل المشروع
git clone https://github.com/ahmed-lifeendy/qortoba-supplies.git
cd qortoba-supplies
```

### 2. إعداد قاعدة البيانات
```cmd
# فتح PostgreSQL
psql -U postgres

# إنشاء قاعدة البيانات
CREATE DATABASE qortoba_supplies;
CREATE USER qortoba_user WITH PASSWORD 'QortobaDB2024!';
GRANT ALL PRIVILEGES ON DATABASE qortoba_supplies TO qortoba_user;
\q
```

### 3. إعداد المشروع
```cmd
# تثبيت التبعيات
npm install

# إعداد البيئة
copy .env.production.example .env

# تعديل ملف .env
notepad .env
```

### 4. محتوى ملف .env
```env
NODE_ENV=production
DATABASE_URL=postgresql://qortoba_user:QortobaDB2024!@localhost:5432/qortoba_supplies
PORT=5000
SESSION_SECRET=YourSecureSessionSecret123!
```

### 5. بناء وتشغيل المشروع
```cmd
# بناء المشروع
npm run build

# إعداد جداول قاعدة البيانات
npm run db:push

# تشغيل النظام
npm start
```

## 🔍 فحص النجاح

### تحقق من البرامج
```cmd
node --version     # يجب أن يظهر v18.x.x أو أحدث
npm --version      # يجب أن يظهر رقم الإصدار
git --version      # يجب أن يظهر git version
psql --version     # يجب أن يظهر PostgreSQL version
```

### تحقق من المشروع
- افتح: http://localhost:5000
- يجب أن تظهر صفحة تسجيل الدخول
- جرب تسجيل الدخول بأي بيانات

## 🔧 حل المشاكل الشائعة

### مشكلة "command not found"
```cmd
# إعادة تعيين PATH
set PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files\Git\bin;C:\Program Files\PostgreSQL\13\bin

# أو أعد تشغيل Command Prompt
```

### مشكلة npm install
```cmd
# تنظيف cache
npm cache clean --force

# إعادة المحاولة
npm install
```

### مشكلة PostgreSQL
```cmd
# تحقق من تشغيل الخدمة
net start postgresql-x64-13

# إعادة تشغيل الخدمة
net stop postgresql-x64-13
net start postgresql-x64-13
```

### مشكلة المنفذ 5000 مشغول
```cmd
# العثور على العملية
netstat -ano | findstr :5000

# إنهاء العملية (استبدل PID بالرقم الظاهر)
taskkill /PID [PID] /F
```

## 📱 إدارة النظام

### تشغيل النظام
```cmd
cd C:\Projects\qortoba-supplies
npm start
```

### إيقاف النظام
- اضغط `Ctrl + C` في نافذة Command Prompt

### إعادة التشغيل
```cmd
# إيقاف (Ctrl+C) ثم
npm start
```

### عمل نسخة احتياطية
```cmd
set PGPASSWORD=QortobaDB2024!
pg_dump -U qortoba_user qortoba_supplies > backup.sql
```

## 🎯 تحسين الأداء

### لاستخدام PM2 (اختياري)
```cmd
# تثبيت PM2
npm install -g pm2

# تشغيل النظام مع PM2
pm2 start npm --name "qortoba-supplies" -- start

# حفظ الإعدادات
pm2 save

# تشغيل تلقائي مع النظام
pm2 startup
```

### أوامر PM2 مفيدة
```cmd
pm2 status                  # حالة التطبيقات
pm2 logs qortoba-supplies   # عرض السجلات
pm2 restart qortoba-supplies # إعادة تشغيل
pm2 stop qortoba-supplies   # إيقاف
pm2 monit                   # مراقبة مباشرة
```

## ✅ اختبار النهائي

1. افتح المتصفح
2. اذهب إلى: http://localhost:5000
3. تأكد من ظهور صفحة النظام
4. جرب تسجيل الدخول
5. جرب إنشاء طلب عرض سعر

## 🆘 إذا لم يعمل شيء

### تحقق من السجلات
```cmd
# سجلات Windows
eventvwr.msc

# سجلات التطبيق (إذا كان PM2 مُستخدم)
pm2 logs qortoba-supplies

# أو شغل التطبيق مباشرة لرؤية الأخطاء
npm start
```

### معلومات للدعم
```cmd
# معلومات النظام
systeminfo

# حالة الخدمات
sc query postgresql-x64-13

# العمليات قيد التشغيل
tasklist | findstr node
```

---

**إذا تبعت هذه الخطوات، النظام سيعمل بنجاح! 🎉**