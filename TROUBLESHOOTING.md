# 🔧 دليل استكشاف الأخطاء وإصلاحها

## 🚨 المشاكل الشائعة وحلولها

### 1. مشكلة "command not recognized"

**الأعراض**: رسائل مثل `'choco' is not recognized` أو `'node' is not recognized`

**الحلول**:
```cmd
# إعادة تعيين PATH للجلسة الحالية
set PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files\Git\bin;C:\Program Files\PostgreSQL\13\bin;%ALLUSERSPROFILE%\chocolatey\bin

# أو أعد تشغيل Command Prompt كمدير

# أو أعد تشغيل الحاسوب
```

### 2. فشل تثبيت Chocolatey

**الأعراض**: رسائل خطأ أثناء تثبيت Chocolatey

**الحلول**:
```cmd
# حذف مجلد Chocolatey القديم
rmdir /s /q C:\ProgramData\chocolatey

# إعادة تشغيل PowerShell كمدير وتثبيت Chocolatey
powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"

# أو تثبيت البرامج يدوياً (راجع MANUAL_INSTALL_GUIDE.md)
```

### 3. فشل تحميل المشروع من GitHub

**الأعراض**: `git clone` فشل أو `The system cannot find the path specified`

**الحلول**:
```cmd
# تحقق من اتصال الإنترنت
ping github.com

# تحقق من تثبيت Git
git --version

# إنشاء المجلد يدوياً
mkdir C:\Projects
cd C:\Projects

# محاولة التحميل مرة أخرى
git clone https://github.com/ahmed-lifeendy/qortoba-supplies.git

# أو تحميل كملف ZIP
# اذهب إلى: https://github.com/ahmed-lifeendy/qortoba-supplies
# اضغط Code > Download ZIP
# استخرج في C:\Projects\qortoba-supplies
```

### 4. فشل npm install

**الأعراض**: أخطاء أثناء `npm install`

**الحلول**:
```cmd
# تنظيف cache
npm cache clean --force

# حذف node_modules وإعادة التثبيت
rmdir /s /q node_modules
del package-lock.json
npm install

# أو استخدام yarn بدلاً من npm
npm install -g yarn
yarn install
```

### 5. مشاكل PostgreSQL

**الأعراض**: فشل الاتصال بقاعدة البيانات

**الحلول**:
```cmd
# تحقق من تشغيل خدمة PostgreSQL
sc query postgresql-x64-13

# إعادة تشغيل الخدمة
net stop postgresql-x64-13
net start postgresql-x64-13

# إنشاء قاعدة البيانات يدوياً
psql -U postgres
CREATE DATABASE qortoba_supplies;
CREATE USER qortoba_user WITH PASSWORD 'QortobaDB2024!';
GRANT ALL PRIVILEGES ON DATABASE qortoba_supplies TO qortoba_user;
\q

# تحقق من ملف .env
notepad .env
# تأكد من: DATABASE_URL=postgresql://qortoba_user:QortobaDB2024!@localhost:5432/qortoba_supplies
```

### 6. المنفذ 5000 مشغول

**الأعراض**: `Error: listen EADDRINUSE :::5000`

**الحلول**:
```cmd
# العثور على العملية التي تستخدم المنفذ
netstat -ano | findstr :5000

# إنهاء العملية (استبدل PID بالرقم الظاهر)
taskkill /PID [PID] /F

# أو استخدام منفذ مختلف
# عدل ملف .env وغير PORT=5000 إلى PORT=3000
```

### 7. فشل npm run build

**الأعراض**: أخطاء أثناء بناء المشروع

**الحلول**:
```cmd
# تحقق من إصدار Node.js
node --version
# يجب أن يكون 18.0.0 أو أحدث

# تنظيف وإعادة التثبيت
npm cache clean --force
rmdir /s /q node_modules
npm install

# محاولة البناء مرة أخرى
npm run build

# إذا استمر الفشل، جرب:
npm run build --verbose
```

### 8. فشل npm run db:push

**الأعراض**: فشل إعداد جداول قاعدة البيانات

**الحلول**:
```cmd
# تحقق من اتصال قاعدة البيانات
psql -U qortoba_user -d qortoba_supplies -c "SELECT 1;"

# إذا فشل، تحقق من كلمة المرور
psql -U postgres -c "ALTER USER qortoba_user PASSWORD 'QortobaDB2024!';"

# أعد المحاولة
npm run db:push

# أو استخدم --force
npx drizzle-kit push --force
```

## 🔍 تشخيص متقدم

### فحص شامل للنظام
```cmd
# معلومات النظام
systeminfo | findstr /C:"OS Name" /C:"System Type" /C:"Total Physical Memory"

# إصدارات البرامج
node --version
npm --version
git --version
psql --version

# حالة الخدمات
sc query postgresql-x64-13
tasklist | findstr node

# فحص المنافذ
netstat -an | findstr :5000
netstat -an | findstr :5432

# فحص القرص
dir C:\Projects
dir C:\Projects\qortoba-supplies
```

### تجميع معلومات للدعم
```cmd
# إنشاء ملف تشخيص
echo === System Info === > diagnosis.txt
systeminfo >> diagnosis.txt
echo === Software Versions === >> diagnosis.txt
node --version >> diagnosis.txt 2>&1
npm --version >> diagnosis.txt 2>&1
git --version >> diagnosis.txt 2>&1
psql --version >> diagnosis.txt 2>&1
echo === Services Status === >> diagnosis.txt
sc query postgresql-x64-13 >> diagnosis.txt 2>&1
echo === Process List === >> diagnosis.txt
tasklist | findstr node >> diagnosis.txt 2>&1
echo === Network Ports === >> diagnosis.txt
netstat -an | findstr :5000 >> diagnosis.txt 2>&1
netstat -an | findstr :5432 >> diagnosis.txt 2>&1

# إرسال ملف diagnosis.txt للدعم
```

## 🚑 حلول الطوارئ

### إعادة تعيين كامل
```cmd
# إيقاف جميع العمليات
taskkill /f /im node.exe 2>nul
pm2 kill 2>nul

# حذف المشروع
rmdir /s /q C:\Projects\qortoba-supplies

# إعادة تشغيل خدمات PostgreSQL
net stop postgresql-x64-13
net start postgresql-x64-13

# إعادة تشغيل الحاسوب
shutdown /r /t 0
```

### تشغيل في الوضع الآمن
```cmd
# تشغيل بدون PM2
cd C:\Projects\qortoba-supplies
set NODE_ENV=development
npm start

# مراقبة الأخطاء في الوقت الفعلي
```

### استرداد من نسخة احتياطية
```cmd
# إذا كان لديك نسخة احتياطية من قاعدة البيانات
set PGPASSWORD=QortobaDB2024!
dropdb -U qortoba_user qortoba_supplies
createdb -U qortoba_user qortoba_supplies
psql -U qortoba_user qortoba_supplies < backup.sql
```

## 📞 طلب المساعدة

### قبل طلب الدعم
1. جرب الحلول أعلاه
2. اجمع معلومات التشخيص
3. لاحظ الرسائل الدقيقة للأخطاء
4. احتفظ بلقطات شاشة

### معلومات مطلوبة للدعم
- نسخة Windows
- رسائل الخطأ الدقيقة
- الخطوات التي أدت للمشكلة
- ملف diagnosis.txt
- لقطات شاشة

---

**معظم المشاكل لها حلول بسيطة. لا تيأس! 💪**