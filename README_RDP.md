# 🚀 نظام قرطبة للتوريدات - دليل التشغيل على خادم RDP

## 📋 نظرة عامة

نظام قرطبة للتوريدات هو حل شامل لإدارة المشتريات والتوريدات، مصمم خصيصاً للشركات العربية. يوفر النظام واجهة عربية متكاملة مع إمكانيات متقدمة لإدارة طلبات التسعير، الأصناف، أوامر الشراء، والعملاء والموردين.

## 🎯 الميزات الرئيسية

- ✅ **إدارة طلبات التسعير**: نظام شامل لإدارة طلبات الأسعار من البداية للنهاية
- ✅ **كتالوج الأصناف الذكي**: إدارة الأصناف مع اكتشاف التكرارات تلقائياً
- ✅ **أوامر الشراء**: متابعة أوامر الشراء والموافقات
- ✅ **إدارة العملاء والموردين**: قاعدة بيانات شاملة للعلاقات التجارية
- ✅ **نظام صلاحيات متقدم**: 5 مستويات صلاحيات مختلفة
- ✅ **تقارير وإحصائيات**: تقارير مالية ومتابعة الأداء
- ✅ **استيراد/تصدير Excel**: إمكانيات متقدمة للتعامل مع ملفات Excel
- ✅ **واجهة عربية كاملة**: تصميم RTL مع دعم اللغة العربية

## 🛠️ التثبيت السريع

### الطريقة الأولى: التثبيت التلقائي (موصى به)

1. **تثبيت المتطلبات:**
   ```powershell
   # تشغيل كمدير
   .\INSTALL_PREREQUISITES.bat
   ```

2. **فحص النظام:**
   ```powershell
   .\CHECK_SYSTEM.bat
   ```

3. **إعداد المشروع:**
   ```powershell
   .\SETUP_RDP_SERVER.bat
   ```

4. **تشغيل النظام:**
   ```powershell
   .\START_SERVER.bat
   ```

### الطريقة الثانية: التثبيت اليدوي

#### 1. تثبيت المتطلبات
- **Node.js 18+**: [تحميل من هنا](https://nodejs.org)
- **PostgreSQL 12+**: [تحميل من هنا](https://www.postgresql.org/download/windows/)

#### 2. إعداد قاعدة البيانات
```sql
-- في PostgreSQL
CREATE DATABASE qortoba_supplies;
CREATE USER qortoba_user WITH PASSWORD 'QortobaPass2025!';
GRANT ALL PRIVILEGES ON DATABASE qortoba_supplies TO qortoba_user;
```

#### 3. إعداد المشروع
```powershell
# تثبيت التبعيات
npm install

# إنشاء ملف البيئة
copy .env.example .env
notepad .env  # قم بتحديث كلمة المرور

# إعداد قاعدة البيانات
npm run db:push

# بناء المشروع
npm run build

# تشغيل النظام
npm start
```

## 🌐 الوصول إلى النظام

بعد تشغيل النظام، افتح المتصفح على: **http://localhost:3000**

### 👤 بيانات تسجيل الدخول الافتراضية:

| الدور | البريد الإلكتروني | كلمة المرور |
|--------|-------------------|-------------|
| المدير العام | admin@qortoba.com | admin123 |
| مدير تقني | it@qortoba.com | it123 |
| موظف إدخال البيانات | data@qortoba.com | data123 |
| موظف مشتريات | purchasing@qortoba.com | purchasing123 |
| موظف حسابات | accounting@qortoba.com | accounting123 |

> ⚠️ **هام**: غيّر كلمات المرور الافتراضية فوراً بعد أول تسجيل دخول

## 📁 هيكل الملفات المهمة

```
qortoba-supplies/
├── 📜 دليل_التشغيل_RDP.md          # دليل مفصل للتشغيل
├── ⚙️ SETUP_RDP_SERVER.bat         # إعداد المشروع تلقائياً
├── ▶️ START_SERVER.bat             # تشغيل الخادم
├── 🔍 CHECK_SYSTEM.bat             # فحص النظام والمتطلبات
├── 📦 INSTALL_PREREQUISITES.bat    # تثبيت المتطلبات
├── 💾 BACKUP_SYSTEM.bat            # نسخ احتياطي
├── 🔄 RESTORE_BACKUP.bat           # استعادة النسخة الاحتياطية
├── 🗄️ setup-database.sql           # إعداد قاعدة البيانات
├── ⚙️ .env.example                 # نموذج إعدادات البيئة
└── 📚 README_RDP.md                # هذا الملف
```

## 🔧 إدارة النظام

### نسخ احتياطية
```powershell
# إنشاء نسخة احتياطية
.\BACKUP_SYSTEM.bat

# استعادة نسخة احتياطية
.\RESTORE_BACKUP.bat
```

### مراقبة النظام
- **سجلات التطبيق**: متاحة في وحدة التحكم
- **استخدام الموارد**: مراقبة عبر مدير المهام
- **قاعدة البيانات**: مراقبة عبر pgAdmin أو psql

### إعدادات متقدمة

#### تغيير البورت:
```env
# في ملف .env
PORT=8080
```

#### تشغيل تلقائي مع Windows:
1. انسخ `START_SERVER.bat` إلى مجلد Startup
2. أو أنشئ خدمة Windows باستخدام NSSM

#### الوصول من الشبكة:
```powershell
# فتح البورت في Firewall
netsh advfirewall firewall add rule name="Qortoba System" dir=in action=allow protocol=TCP localport=3000
```

## 🚨 حل المشاكل الشائعة

### مشكلة: "خطأ في الاتصال بقاعدة البيانات"
```powershell
# تحقق من تشغيل PostgreSQL
net start postgresql-x64-15

# اختبار الاتصال
psql -h localhost -U qortoba_user -d qortoba_supplies
```

### مشكلة: "البورت مستخدم"
```powershell
# العثور على العملية
netstat -ano | findstr :3000

# إنهاء العملية
taskkill /PID [رقم_العملية] /F
```

### مشكلة: "npm غير موجود"
- أعد تثبيت Node.js
- أعد تشغيل PowerShell كمدير
- تحقق من متغيرات البيئة PATH

### مشكلة: فشل تثبيت التبعيات
```powershell
# تنظيف وإعادة التثبيت
rmdir /s node_modules
del package-lock.json
npm cache clean --force
npm install
```

## 📊 نظام الصلاحيات

### 🔑 الأدوار المتاحة:

1. **المدير العام**: صلاحية كاملة على جميع الوظائف
2. **مدير تقني**: إدارة النظام، المستخدمين، والبيانات
3. **موظف إدخال البيانات**: إدخال وتعديل البيانات الأساسية
4. **موظف مشتريات**: إدارة المشتريات والموردين والطلبات
5. **موظف حسابات**: عرض التقارير المالية والإحصائيات فقط

## 🔄 تحديث النظام

### تحديث التبعيات:
```powershell
npm update
npm audit fix
```

### تحديث قاعدة البيانات:
```powershell
npm run db:push
```

## 🏗️ البنية التقنية

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **UI Library**: Shadcn/ui + Tailwind CSS
- **Authentication**: Session-based with bcrypt
- **State Management**: TanStack Query

## 📱 الاستخدام عبر الشبكة

لتمكين الوصول من أجهزة أخرى في الشبكة:

1. **تحديث إعدادات CORS**:
   ```env
   CORS_ORIGIN=*
   # أو تحديد العناوين المسموحة
   CORS_ORIGIN=http://192.168.1.100:3000,http://192.168.1.101:3000
   ```

2. **فتح الفايروول**:
   ```powershell
   netsh advfirewall firewall add rule name="Qortoba System" dir=in action=allow protocol=TCP localport=3000
   ```

3. **الوصول عبر IP الخادم**:
   ```
   http://[IP_ADDRESS]:3000
   ```

## 📞 الدعم والمساعدة

### مصادر المساعدة:
1. **دليل_التشغيل_RDP.md** - دليل مفصل
2. **CHECK_SYSTEM.bat** - فحص حالة النظام
3. **سجلات النظام** - في وحدة التحكم
4. **سجلات قاعدة البيانات** - PostgreSQL logs

### في حالة المشاكل:
1. شغّل `CHECK_SYSTEM.bat` لفحص النظام
2. تحقق من سجلات الأخطاء
3. تأكد من تشغيل PostgreSQL
4. تحقق من إعدادات `.env`

## 🛡️ الأمان والصيانة

### نصائح الأمان:
- ✅ غيّر كلمات المرور الافتراضية
- ✅ استخدم كلمات مرور قوية
- ✅ قم بتحديث النظام بانتظام
- ✅ راقب سجلات الوصول
- ✅ قم بنسخ احتياطية دورية

### الصيانة الدورية:
- 📅 نسخ احتياطية يومية
- 📅 تحديث التبعيات شهرياً
- 📅 مراقبة استخدام المساحة
- 📅 تنظيف سجلات النظام

---

**🏢 نظام قرطبة للتوريدات - الحل الشامل لإدارة المشتريات والتوريدات**

*تطوير: فريق التطوير التقني | الإصدار: 1.0.0*