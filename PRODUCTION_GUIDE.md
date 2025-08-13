# 🏭 دليل تشغيل النظام في وضع الإنتاج

## التحويل إلى وضع الإنتاج

### 1. إعداد متغيرات البيئة
يجب تعيين المتغير `NODE_ENV=production` في ملف `.env`:

```bash
NODE_ENV=production
```

### 2. الاختلافات بين التطوير والإنتاج

| الخاصية | التطوير | الإنتاج |
|---------|---------|---------|
| Session Store | Memory | PostgreSQL |
| HTTPS | مُعطل | مُفعل |
| Cookie Security | مرن | صارم |
| مدة الجلسة | 24 ساعة | 8 ساعات |
| حد الرفع | 100MB | 50MB |
| Trust Proxy | مُعطل | مُفعل |
| التسجيل | مفصل | أخطاء فقط |

### 3. إعدادات الأمان المُفعلة في الإنتاج

✅ **PostgreSQL Session Store** - حفظ الجلسات في قاعدة البيانات  
✅ **HTTPS Cookie Settings** - أمان متقدم للكوكيز  
✅ **Trust Proxy** - دعم Load Balancers  
✅ **SameSite Strict** - حماية CSRF متقدمة  
✅ **Reduced Session Timeout** - انتهاء صلاحية أسرع  
✅ **Limited Upload Size** - تقليل المخاطر  

### 4. كيفية التشغيل

#### التشغيل المباشر
```bash
NODE_ENV=production tsx server/index.ts
```

#### استخدام السكريبت المخصص
```bash
node production-start.js
```

### 5. مراقبة النظام

عند التشغيل في وضع الإنتاج، ستظهر هذه الرسائل:

```
🏭 تشغيل في وضع الإنتاج
🔒 تفعيل إعدادات الأمان المتقدمة
📊 استخدام PostgreSQL session store للإنتاج
```

### 6. نقاط الفحص

- ✅ Health Check: `GET /api/health`
- ✅ Database Connection: PostgreSQL
- ✅ Google Sheets Integration: مُفعل
- ✅ Session Management: PostgreSQL Store
- ✅ Security Headers: مُفعلة

### 7. ملاحظات مهمة

⚠️ **قبل النشر في الإنتاج الحقيقي:**
1. تغيير `SESSION_SECRET` إلى مفتاح فريد
2. التأكد من إعدادات قاعدة البيانات
3. تفعيل HTTPS على الخادم
4. مراجعة جميع المفاتيح السرية

📊 **مراقبة الأداء:**
- مراجعة استخدام ذاكرة قاعدة البيانات
- مراقبة استجابة API
- فحص سجلات الأخطاء

🔧 **استكشاف الأخطاء:**
- فحص متغيرات البيئة
- التأكد من اتصال قاعدة البيانات
- مراجعة سجلات النظام