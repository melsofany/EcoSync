# دليل تشغيل نظام قرطبة للتوريدات على خادم RDP

## 📋 متطلبات النظام

### البرامج المطلوبة:
- **Windows Server** أو Windows 10/11
- **Node.js 18+** من: https://nodejs.org
- **PostgreSQL 12+** من: https://www.postgresql.org/download/windows/

---

## 🚀 خطوات التشغيل السريع

### الخطوة 1: إعداد قاعدة البيانات
1. افتح **PowerShell كمدير**
2. اذهب إلى مجلد PostgreSQL:
   ```powershell
   cd "C:\Program Files\PostgreSQL\15\bin"
   ```
3. تسجيل الدخول إلى PostgreSQL:
   ```powershell
   .\psql.exe -U postgres
   ```
4. تشغيل الأوامر التالية:
   ```sql
   CREATE DATABASE qortoba_supplies;
   CREATE USER qortoba_user WITH PASSWORD 'QortobaPass2025!';
   GRANT ALL PRIVILEGES ON DATABASE qortoba_supplies TO qortoba_user;
   \q
   ```

### الخطوة 2: تحضير المشروع
1. انسخ جميع ملفات المشروع إلى مجلد: `C:\qortoba-supplies`
2. افتح **PowerShell كمدير** واذهب إلى مجلد المشروع:
   ```powershell
   cd C:\qortoba-supplies
   ```

### الخطوة 3: تشغيل الإعداد التلقائي
```powershell
.\SETUP_RDP_SERVER.bat
```

### الخطوة 4: تشغيل النظام
```powershell
.\START_SERVER.bat
```

---

## 🌐 الوصول إلى النظام

بعد تشغيل الخادم، افتح المتصفح واذهب إلى:
**http://localhost:3000**

### معلومات تسجيل الدخول الافتراضية:
- **المدير العام**: admin@qortoba.com / admin123
- **موظف إدخال البيانات**: data@qortoba.com / data123

---

## ⚙️ إعدادات متقدمة

### تشغيل النظام على بورت مختلف:
```powershell
# في ملف .env غيّر:
PORT=8080
```

### تشغيل النظام تلقائياً عند بدء Windows:
1. اضغط `Windows + R`
2. اكتب: `shell:startup`
3. انسخ ملف `START_SERVER.bat` إلى المجلد المفتوح

### إعداد Firewall للوصول من أجهزة أخرى:
```powershell
netsh advfirewall firewall add rule name="Qortoba System" dir=in action=allow protocol=TCP localport=3000
```

---

## 🔧 حل المشاكل الشائعة

### مشكلة: "خطأ في الاتصال بقاعدة البيانات"
**الحل:**
1. تأكد من تشغيل PostgreSQL:
   ```powershell
   net start postgresql-x64-15
   ```
2. تحقق من كلمة المرور في ملف `.env`

### مشكلة: "البورت مستخدم"
**الحل:**
```powershell
# العثور على العملية:
netstat -ano | findstr :3000
# إنهاء العملية:
taskkill /PID [رقم_العملية] /F
```

### مشكلة: "npm غير موجود"
**الحل:**
1. أعد تثبيت Node.js
2. أعد تشغيل PowerShell

---

## 📊 مميزات النظام

### إدارة شاملة للتوريدات:
- ✅ إدارة طلبات التسعير
- ✅ كتالوج الأصناف الذكي
- ✅ أوامر الشراء
- ✅ إدارة العملاء والموردين
- ✅ تقارير مالية وإحصائيات
- ✅ نظام صلاحيات متقدم
- ✅ واجهة عربية بالكامل
- ✅ استيراد/تصدير Excel

### الأدوار المتاحة:
- **المدير العام**: صلاحية كاملة
- **مدير تقني**: إدارة النظام والبيانات
- **موظف إدخال بيانات**: إدخال وتعديل البيانات
- **موظف مشتريات**: إدارة المشتريات والموردين
- **موظف حسابات**: عرض التقارير المالية

---

## 💾 النسخ الاحتياطية

### نسخة احتياطية يدوية:
```powershell
pg_dump -h localhost -U qortoba_user -d qortoba_supplies > backup.sql
```

### استعادة النسخة الاحتياطية:
```powershell
psql -h localhost -U qortoba_user -d qortoba_supplies < backup.sql
```

---

## 📞 الدعم الفني

### في حالة وجود مشاكل:
1. تحقق من ملف السجلات في مجلد `logs`
2. تأكد من تشغيل PostgreSQL
3. تحقق من إعدادات ملف `.env`
4. أعد تشغيل النظام

### ملاحظات هامة:
- 🔒 غيّر كلمات المرور الافتراضية فوراً
- 💾 قم بعمل نسخ احتياطية دورية
- 🔄 راقب استخدام الموارد بانتظام
- 🛡️ احتفظ بالنظام محدثاً

---

**نظام قرطبة للتوريدات - حل شامل لإدارة المشتريات والتوريدات**