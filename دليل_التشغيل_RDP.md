# 🖥️ دليل التشغيل السريع لخادم RDP

## 🚀 خطوات النشر السريع

### 1. إعداد الخادم الأساسي
```cmd
# شغل هذا الملف كمدير
SETUP_RDP_SERVER.bat
```
**هذا السكريبت سيقوم بـ:**
- إنشاء المجلدات المطلوبة
- إعداد جدار الحماية
- تثبيت Node.js و PostgreSQL و Git
- إعداد متغيرات البيئة
- إنشاء سكريپتات الإدارة

### 2. نشر المشروع من GitHub
```cmd
# شغل هذا الملف كمدير
DEPLOY_FROM_GITHUB.bat
```
**هذا السكريپت سيقوم بـ:**
- تحميل المشروع من GitHub
- تثبيت التبعيات
- بناء المشروع
- إعداد قاعدة البيانات
- تشغيل التطبيق

## 🎯 بعد النشر

### الوصول للنظام
- **محلياً**: http://localhost:5000
- **من الشبكة**: http://[عنوان-IP-الخادم]:5000

### إدارة النظام
```cmd
# بدء التشغيل
C:\Projects\start-qortoba.bat

# إيقاف التشغيل  
C:\Projects\stop-qortoba.bat

# إعادة التشغيل مع التحديثات
C:\Projects\restart-qortoba.bat

# عمل نسخة احتياطية
C:\Projects\backup-qortoba.bat
```

### مراقبة النظام
```cmd
# حالة PM2
pm2 status

# مراقبة مباشرة
pm2 monit

# عرض السجلات
pm2 logs qortoba-supplies
```

## 🔧 إعدادات مهمة

### كلمات المرور الافتراضية
- **PostgreSQL**: `QortobaDB2024!`
- **يجب تغييرها في الإنتاج!**

### الملفات المهمة
- **الإعدادات**: `C:\Projects\qortoba-supplies\.env`
- **النسخ الاحتياطية**: `C:\Backups\`
- **السجلات**: `C:\Logs\`

## 🆘 في حالة المشاكل

### إعادة تشغيل كامل
```cmd
# إيقاف التطبيق
pm2 stop qortoba-supplies

# إعادة تشغيل PostgreSQL
net stop postgresql-x64-13
net start postgresql-x64-13

# إعادة تشغيل التطبيق
pm2 start qortoba-supplies
```

### فحص السجلات
```cmd
# سجلات التطبيق
pm2 logs qortoba-supplies --lines 50

# سجلات Windows
eventvwr.msc
```

## 📋 قائمة التحقق السريعة

- [ ] تشغيل `SETUP_RDP_SERVER.bat` كمدير ✅
- [ ] إعادة تشغيل الخادم
- [ ] تشغيل `DEPLOY_FROM_GITHUB.bat` كمدير ✅
- [ ] فتح http://localhost:5000 في المتصفح
- [ ] اختبار تسجيل الدخول
- [ ] تغيير كلمات المرور الافتراضية

**النظام جاهز للاستخدام! 🎉**

---

*للمزيد من التفاصيل، راجع `RDP_DEPLOYMENT_GUIDE.md`*