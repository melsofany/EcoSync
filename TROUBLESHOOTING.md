# 🛠️ دليل حل مشاكل نظام قرطبة للتوريدات

## ❌ المشكلة الحالية: ERR_CONNECTION_RESET

### الأسباب المحتملة:
1. **المنفذ 5000 مغلق في جدار الحماية**
2. **النظام لا يستمع على 0.0.0.0 (جميع واجهات الشبكة)**
3. **خدمة النظام متوقفة**
4. **مشاكل في إعدادات الشبكة**

## 🔧 حلول سريعة

### 1. فحص حالة النظام
```cmd
# فحص المنفذ 5000
netstat -an | findstr :5000

# فحص PM2
pm2 status

# فحص العمليات
tasklist | findstr node
```

### 2. إعادة تشغيل النظام
```cmd
# إيقاف جميع العمليات
pm2 kill
taskkill /f /im node.exe

# إعادة التشغيل
cd C:\QortobaProject\qortoba-supplies
npm start
```

### 3. فحص جدار الحماية
```cmd
# إضافة قاعدة جدار الحماية
netsh advfirewall firewall add rule name="Qortoba HTTP" dir=in action=allow protocol=TCP localport=5000

# فحص القواعد الموجودة
netsh advfirewall firewall show rule name="Qortoba HTTP"
```

### 4. تشغيل على جميع واجهات الشبكة
تأكد من أن النظام يستمع على `0.0.0.0:5000` وليس `localhost:5000`

## 🌐 مشاكل الوصول الخارجي

### المشكلة: لا يمكن الوصول من خارج الخادم

#### الحلول:
1. **فحص إعدادات الخادم**
   ```cmd
   # فحص IP الخادم
   ipconfig
   
   # فحص الاتصالات النشطة
   netstat -an | findstr :5000
   ```

2. **إعداد جدار الحماية المتقدم**
   ```cmd
   # حذف القواعد القديمة
   netsh advfirewall firewall delete rule name="Qortoba HTTP"
   
   # إضافة قاعدة جديدة للوصول الخارجي
   netsh advfirewall firewall add rule name="Qortoba HTTP External" dir=in action=allow protocol=TCP localport=5000 remoteip=any
   
   # السماح للتطبيق
   netsh advfirewall firewall add rule name="Node.js Qortoba" dir=in action=allow program="C:\Program Files\nodejs\node.exe"
   ```

3. **فحص إعدادات الشبكة**
   ```cmd
   # فحص routing table
   route print
   
   # فحص DNS
   nslookup 216.250.252.104
   ```

## 🔍 تشخيص متقدم

### فحص شامل للخادم
```cmd
# معلومات النظام
systeminfo | findstr /C:"Host Name" /C:"Domain"

# فحص الخدمات
sc query | findstr postgresql

# فحص استخدام المنافذ
netstat -aon | findstr :5000
```

### فحص قاعدة البيانات
```cmd
# فحص اتصال قاعدة البيانات
set PGPASSWORD=QortobaDB2024!
psql -U qortoba_user -d qortoba_supplies -c "SELECT version();"

# فحص خدمة PostgreSQL
sc query postgresql-x64-13
```

## 🚨 مشاكل شائعة وحلولها

### 1. ERR_CONNECTION_REFUSED
**السبب**: النظام متوقف
**الحل**:
```cmd
cd C:\QortobaProject\qortoba-supplies
npm start
```

### 2. ERR_CONNECTION_RESET
**السبب**: جدار الحماية يحجب الاتصال
**الحل**:
```cmd
netsh advfirewall firewall add rule name="Qortoba Allow All" dir=in action=allow protocol=TCP localport=5000 remoteip=any
```

### 3. Cannot GET /
**السبب**: النظام يعمل لكن الروابط خاطئة
**الحل**: تحقق من إعدادات routing في التطبيق

### 4. Database Connection Error
**السبب**: مشكلة في قاعدة البيانات
**الحل**:
```cmd
net start postgresql-x64-13
set PGPASSWORD=QortobaDB2024!
psql -U postgres -c "ALTER USER qortoba_user WITH PASSWORD 'QortobaDB2024!';"
```

## 🔄 إعادة النشر الكامل

إذا فشلت جميع الحلول:

### 1. تنظيف شامل
```cmd
# إيقاف جميع العمليات
pm2 kill
taskkill /f /im node.exe

# حذف المجلد
rmdir /s /q C:\QortobaProject\qortoba-supplies

# تنظيف جدار الحماية
netsh advfirewall firewall delete rule name=all
```

### 2. إعادة النشر
```cmd
# تشغيل سكريپت النشر مرة أخرى
DEPLOY_TO_RDP_SERVER.bat
```

## 📱 اختبار الاتصال

### من داخل الخادم
```cmd
# اختبار محلي
curl http://localhost:5000
# أو
powershell -Command "Invoke-WebRequest -Uri 'http://localhost:5000'"
```

### من خارج الخادم
```cmd
# من جهاز آخر
curl http://216.250.252.104:5000
# أو في المتصفح
http://216.250.252.104:5000
```

## 🔧 أدوات التشخيص السريع

### سكريپت فحص سريع
```cmd
@echo off
echo === Qortoba Server Diagnostic ===
echo.
echo Checking port 5000...
netstat -an | findstr :5000
echo.
echo Checking PM2 status...
if exist "%APPDATA%\npm\pm2.cmd" "%APPDATA%\npm\pm2.cmd" status
echo.
echo Checking firewall rules...
netsh advfirewall firewall show rule name="Qortoba HTTP"
echo.
echo Checking PostgreSQL...
sc query postgresql-x64-13
pause
```

## 📞 طلب المساعدة

عند طلب المساعدة، قدم هذه المعلومات:

1. **نتائج الفحوصات**:
   ```cmd
   netstat -an | findstr :5000
   pm2 status
   sc query postgresql-x64-13
   ```

2. **رسائل الخطأ الكاملة**

3. **سجلات النظام**:
   ```cmd
   pm2 logs qortoba-supplies --lines 50
   ```

4. **معلومات النظام**:
   ```cmd
   systeminfo | findstr /C:"OS Name" /C:"OS Version"
   ```

## ✅ قائمة التحقق النهائية

قبل طلب المساعدة، تأكد من:
- [ ] النظام يعمل محلياً على localhost:5000
- [ ] المنفذ 5000 مفتوح في netstat
- [ ] قواعد جدار الحماية مضافة
- [ ] PostgreSQL يعمل
- [ ] PM2 يظهر التطبيق online
- [ ] الاختبار من curl أو PowerShell
- [ ] فحص السجلات للأخطاء

**إذا فشل كل شيء، استخدم DEPLOY_TO_RDP_SERVER.bat لإعادة النشر الكامل**