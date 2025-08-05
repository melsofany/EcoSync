# 🖥️ دليل تشغيل نظام قرطبة للتوريدات على خادم RDP

## 📋 معلومات الخادم
- **عنوان IP**: 216.250.252.104
- **نوع الخادم**: Windows RDP Server
- **المنفذ**: 5000
- **قاعدة البيانات**: PostgreSQL

## 🚀 التشغيل بنقرة واحدة

### الطريقة الأسهل (موصى بها)
1. حمل ملف `DEPLOY_TO_RDP_SERVER.bat`
2. انقر عليه نقرة مزدوجة
3. اختر "Yes" عند طلب صلاحيات المدير
4. انتظر 10-15 دقيقة حتى يكتمل النشر
5. النظام سيفتح تلقائياً على: http://216.250.252.104:5000

## 🔧 ما يحدث أثناء النشر

### المرحلة 1: إعداد الخادم
- إعداد جدار الحماية للوصول الخارجي
- تحسين إعدادات الشبكة للخادم
- إنشاء مجلدات النظام

### المرحلة 2: تثبيت البرامج
- تحميل وتثبيت Node.js 18
- تحميل وتثبيت Git
- التحقق من PostgreSQL أو تثبيته

### المرحلة 3: تحميل المشروع
- تحميل من GitHub: ahmed-lifeendy/qortoba-supplies
- إعداد بيئة الإنتاج للخادم

### المرحلة 4: إعداد قاعدة البيانات
- إنشاء قاعدة البيانات `qortoba_supplies`
- إنشاء مستخدم `qortoba_user`
- إعداد الجداول المطلوبة

### المرحلة 5: تشغيل النظام
- تشغيل مع PM2 للاستقرار
- إعداد التشغيل التلقائي
- اختبار الوصول المحلي والخارجي

## 🌐 الوصول للنظام

### من داخل الخادم
- **المحلي**: http://localhost:5000
- **IP المحلي**: http://127.0.0.1:5000

### من خارج الخادم
- **الرابط العام**: http://216.250.252.104:5000

## 🖱️ أدوات إدارة سطح المكتب

بعد النشر ستجد على سطح المكتب:

### أدوات المراقبة
- **Qortoba Server Status.bat**
  - فحص حالة الخادم
  - عرض المنافذ المستخدمة
  - حالة PM2

### أدوات الإدارة
- **Restart Qortoba Server.bat**
  - إعادة تشغيل النظام
  
- **Backup Qortoba Server.bat**
  - عمل نسخة احتياطية كاملة

### رابط مباشر
- **Qortoba Server - 216.250.252.104.url**
  - فتح النظام مباشرة في المتصفح

## 📊 مراقبة الأداء

### فحص حالة النظام
```cmd
# فحص المنفذ
netstat -an | findstr :5000

# حالة PM2
pm2 status

# استخدام الذاكرة
tasklist | findstr node
```

### السجلات
```cmd
# سجلات PM2
pm2 logs qortoba-supplies

# سجل النشر
notepad C:\qortoba_deployment_216-250-252-104.log
```

## 🔐 معلومات الأمان

### كلمات المرور الافتراضية
- **PostgreSQL Superuser**: QortobaDB2024!
- **Database User**: qortoba_user / QortobaDB2024!
- **Session Secret**: QortobaSecretKey2024!ServerRDP

### ⚠️ تحذيرات أمنية
- غير كلمات المرور في الإنتاج
- استخدم HTTPS في البيئة الحقيقية
- قم بتحديث النظام دورياً

## 🛠️ إدارة النظام

### تشغيل النظام
```cmd
# بدء النظام
pm2 start qortoba-supplies

# أو التشغيل المباشر
cd C:\QortobaProject\qortoba-supplies
npm start
```

### إيقاف النظام
```cmd
# إيقاف PM2
pm2 stop qortoba-supplies

# إيقاف جميع العمليات
pm2 kill
```

### إعادة التشغيل
```cmd
# إعادة تشغيل مع PM2
pm2 restart qortoba-supplies

# إعادة تحميل
pm2 reload qortoba-supplies
```

## 📁 مجلدات النظام

### المواقع المهمة
- **المشروع**: `C:\QortobaProject\qortoba-supplies`
- **النسخ الاحتياطية**: `C:\QortobaBackups`
- **السجلات**: `C:\QortobaLogs`
- **الإعدادات**: `C:\QortobaProject\qortoba-supplies\.env`

## 🔄 التحديثات

### تحديث تلقائي
```cmd
# شغل سكريپت النشر مرة أخرى
DEPLOY_TO_RDP_SERVER.bat
```

### تحديث يدوي
```cmd
cd C:\QortobaProject\qortoba-supplies
git pull origin main
npm install --production
npm run build
pm2 restart qortoba-supplies
```

## 🆘 حل المشاكل

### النظام لا يعمل
1. شغل "Qortoba Server Status.bat"
2. تحقق من السجلات: `pm2 logs qortoba-supplies`
3. أعد تشغيل الخادم إذا لزم الأمر

### لا يمكن الوصول من الخارج
1. تحقق من جدار الحماية
2. تأكد من المنفذ 5000 مفتوح
3. جرب الوصول المحلي أولاً

### مشاكل قاعدة البيانات
```cmd
# إعادة تشغيل PostgreSQL
net stop postgresql-x64-13
net start postgresql-x64-13

# فحص الاتصال
psql -U qortoba_user -d qortoba_supplies -c "SELECT 1;"
```

## 📈 تحسين الأداء

### للخوادم عالية الاستخدام
```cmd
# زيادة حد الذاكرة
pm2 start npm --name "qortoba-supplies" -- start --max-memory-restart 2G

# تشغيل عدة نسخ
pm2 start npm --name "qortoba-supplies" -- start -i 2
```

### مراقبة الموارد
```cmd
# مراقبة مباشرة
pm2 monit

# معلومات النظام
systeminfo | findstr /C:"Total Physical Memory"
```

## ✅ قائمة التحقق النهائية

بعد النشر تأكد من:
- [ ] النظام يفتح على http://216.250.252.104:5000
- [ ] صفحة تسجيل الدخول تظهر
- [ ] يمكن إنشاء مستخدم جديد
- [ ] استيراد ملف Excel يعمل
- [ ] أدوات سطح المكتب موجودة
- [ ] PM2 يظهر النظام "online"

## 🎉 مبروك!

نظام قرطبة للتوريدات يعمل الآن على خادم RDP العام!

**الآن يمكن للمستخدمين الوصول من أي مكان في العالم عبر:**
**http://216.250.252.104:5000**

النظام جاهز لـ:
- إدارة طلبات عروض الأسعار
- إدارة الموردين والعملاء
- استيراد البيانات من Excel
- إنشاء أوامر الشراء
- إدارة المستخدمين والصلاحيات

**نشر ناجح! النظام يعمل على الخادم العام 🚀**