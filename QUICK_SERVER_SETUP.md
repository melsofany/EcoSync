# ⚡ إعداد خادم سريع لمشروع قرطبة للتوريدات

## 🚀 خطوات التشغيل السريع

### الطريقة الأولى: تشغيل تلقائي (موصى بها)
```cmd
# حمل وشغل الملف
ONE_CLICK_DEPLOY.bat
```

### الطريقة الثانية: تشغيل يدوي
```cmd
# 1. إنشاء المجلدات
mkdir C:\Projects
mkdir C:\Backups

# 2. تحميل المشروع
cd C:\Projects
git clone https://github.com/ahmed-lifeendy/qortoba-supplies.git
cd qortoba-supplies

# 3. تثبيت التبعيات
npm install

# 4. إعداد البيئة
copy .env.production.example .env

# 5. بناء المشروع
npm run build

# 6. تشغيل النظام
npm start
```

## 🔧 المتطلبات الأساسية

### برامج مطلوبة
- **Node.js 18+**: https://nodejs.org
- **PostgreSQL 13+**: https://postgresql.org
- **Git**: https://git-scm.com

### إعداد PostgreSQL
```sql
CREATE DATABASE qortoba_supplies;
CREATE USER qortoba_user WITH PASSWORD 'QortobaDB2024!';
GRANT ALL PRIVILEGES ON DATABASE qortoba_supplies TO qortoba_user;
```

## ⚙️ إعداد ملف البيئة (.env)

```env
NODE_ENV=production
DATABASE_URL=postgresql://qortoba_user:QortobaDB2024!@localhost:5432/qortoba_supplies
PORT=5000
SESSION_SECRET=YourSecureSessionSecret123!
DEEPSEEK_API_KEY=your_ai_key_optional
```

## 🌐 الوصول للنظام

بعد التشغيل:
- **محلياً**: http://localhost:5000
- **من الشبكة**: http://[IP-Address]:5000

## 🔥 حل المشاكل السريع

### لا يعمل Git
```cmd
# تحميل من المتصفح
https://github.com/ahmed-lifeendy/qortoba-supplies/archive/refs/heads/main.zip
# استخراج في C:\Projects\qortoba-supplies
```

### مشكلة PostgreSQL
```cmd
# إعادة تشغيل الخدمة
net stop postgresql-x64-13
net start postgresql-x64-13

# إنشاء قاعدة البيانات يدوياً
psql -U postgres
CREATE DATABASE qortoba_supplies;
```

### مشكلة Node.js
```cmd
# تحديث npm
npm install -g npm@latest

# تنظيف cache
npm cache clean --force
```

### المنفذ مشغول
```cmd
# العثور على العملية
netstat -ano | findstr :5000

# إنهاء العملية
taskkill /PID [PID_NUMBER] /F
```

## 📱 اختصارات مفيدة

### إدارة سريعة
```cmd
# بدء التشغيل
npm start

# إيقاف (Ctrl+C)

# إعادة التشغيل
npm restart

# فحص الحالة
netstat -an | findstr :5000
```

### نسخة احتياطية سريعة
```cmd
set PGPASSWORD=QortobaDB2024!
pg_dump -U qortoba_user qortoba_supplies > backup.sql
```

## ✅ تحقق من نجاح التثبيت

- [ ] Node.js يعمل: `node --version`
- [ ] PostgreSQL يعمل: `psql --version`
- [ ] Git يعمل: `git --version`
- [ ] المشروع محمل في `C:\Projects\qortoba-supplies`
- [ ] النظام يفتح على http://localhost:5000
- [ ] تسجيل الدخول يعمل

## 🎯 خطوات ما بعد التثبيت

1. **تغيير كلمات المرور الافتراضية**
2. **إنشاء مستخدمين جدد**
3. **استيراد البيانات من Excel**
4. **إعداد النسخ الاحتياطية**
5. **تخصيص الإعدادات**

## 🆘 دعم سريع

### معلومات النظام
```cmd
systeminfo | findstr /C:"OS Name" /C:"Total Physical Memory"
```

### حالة الخدمات
```cmd
sc query postgresql-x64-13
tasklist | findstr node
```

### السجلات
```cmd
# سجلات Windows
eventvwr.msc

# سجلات التطبيق (إذا كان PM2 مثبت)
pm2 logs qortoba-supplies
```

---

**النظام جاهز للاستخدام في دقائق! 🚀**