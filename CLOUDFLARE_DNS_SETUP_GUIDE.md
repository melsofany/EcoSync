# دليل إعداد DNS في Cloudflare
## إضافة قرطبة للتوريدات إلى cor-toba.online

---

## 🎯 الخطوات البسيطة لإضافة DNS Records

### **الخطوة 1: الدخول إلى Cloudflare**
1. اذهب إلى: https://dash.cloudflare.com
2. سجل الدخول بحسابك
3. اختر domain: **cor-toba.online**

### **الخطوة 2: الذهاب إلى DNS Settings**
1. من القائمة الجانبية، اختر **DNS**
2. ستظهر لك الصفحة مع DNS Records الحالية
3. ستجد record موجود للـ RDP: `rdp.cor-toba.online`

### **الخطوة 3: إضافة Records الجديدة**
اضغط على **Add record** وأضف كل record من القائمة التالية:

---

## 📝 Records المطلوب إضافتها (نسخ ولصق)

### **Record 1: التطبيق الرئيسي**
```
Type: CNAME
Name: app
Target: 0c7982bb-a61f-43f0-8b7c-b9fdddd96a69.cfargotunnel.com
Proxy status: Proxied (سحابة برتقالية)
TTL: Auto
```

### **Record 2: الموقع (www)**
```
Type: CNAME
Name: www
Target: 0c7982bb-a61f-43f0-8b7c-b9fdddd96a69.cfargotunnel.com
Proxy status: Proxied (سحابة برتقالية)
TTL: Auto
```

### **Record 3: SSH للتطوير**
```
Type: CNAME
Name: ssh
Target: 0c7982bb-a61f-43f0-8b7c-b9fdddd96a69.cfargotunnel.com
Proxy status: DNS only (سحابة رمادية)
TTL: Auto
```

### **Record 4: Webhook لـ GitHub**
```
Type: CNAME
Name: webhook
Target: 0c7982bb-a61f-43f0-8b7c-b9fdddd96a69.cfargotunnel.com
Proxy status: Proxied (سحابة برتقالية)
TTL: Auto
```

### **Record 5: مراقبة النظام**
```
Type: CNAME
Name: monitor
Target: 0c7982bb-a61f-43f0-8b7c-b9fdddd96a69.cfargotunnel.com
Proxy status: Proxied (سحابة برتقالية)
TTL: Auto
```

### **Record 6: API**
```
Type: CNAME
Name: api
Target: 0c7982bb-a61f-43f0-8b7c-b9fdddd96a69.cfargotunnel.com
Proxy status: Proxied (سحابة برتقالية)
TTL: Auto
```

---

## 🖼️ شرح بالصور للخطوات

### في صفحة DNS Records:
1. **Add record** (زر أزرق في الأعلى)
2. **Type**: اختر `CNAME` من القائمة المنسدلة
3. **Name**: اكتب الاسم مثل `app` أو `www`
4. **Target**: الصق هذا النص بالضبط:
   ```
   0c7982bb-a61f-43f0-8b7c-b9fdddd96a69.cfargotunnel.com
   ```
5. **Proxy status**: 
   - للـ SSH: اختر **DNS only** (سحابة رمادية)
   - لباقي Records: اختر **Proxied** (سحابة برتقالية)
6. **TTL**: اتركه على **Auto**
7. اضغط **Save**

### كرر العملية لكل record من الـ 6 records

---

## ✅ النتيجة النهائية

بعد إضافة جميع Records، ستحصل على:

| الخدمة | الرابط | الوظيفة |
|--------|--------|---------|
| التطبيق الرئيسي | https://app.cor-toba.online | نظام قرطبة للتوريدات |
| الموقع | https://www.cor-toba.online | نفس التطبيق مع www |
| RDP | rdp.cor-toba.online | الوصول للـ RDP (موجود) |
| SSH | ssh.cor-toba.online | للتطوير عن بُعد |
| Webhook | https://webhook.cor-toba.online | تحديثات GitHub |
| مراقبة | https://monitor.cor-toba.online | مراقبة النظام |
| API | https://api.cor-toba.online | API endpoints |

---

## 🕒 المدة الزمنية

- **إضافة Records**: 5 دقائق
- **انتشار DNS**: 5-10 دقائق إضافية
- **المجموع**: 10-15 دقيقة تقريباً

---

## 🔍 كيفية التحقق

بعد 10 دقائق من الإضافة، جرب:
1. https://app.cor-toba.online
2. https://www.cor-toba.online

إذا ظهر التطبيق، معناها كل شيء يعمل! 🎉

---

## ❗ تنبيهات مهمة

### ⚠️ انتبه لهذه النقاط:
1. **Target** يجب أن يكون بالضبط:
   ```
   0c7982bb-a61f-43f0-8b7c-b9fdddd96a69.cfargotunnel.com
   ```
2. **SSH record** يجب أن يكون **DNS only** (سحابة رمادية)
3. **باقي Records** يجب أن تكون **Proxied** (سحابة برتقالية)
4. لا تحذف RDP record الموجود

### ✅ علامات النجاح:
- Records تظهر في قائمة DNS
- Status تظهر "Active"
- لا توجد أخطاء حمراء

---

## 📞 إذا واجهت مشاكل

### المشكلة: Record لا يُحفظ
- تأكد من صحة Target
- تأكد من اختيار Type = CNAME
- تأكد من وجود نت جيد

### المشكلة: SSL لا يعمل
- انتظر 10-15 دقيقة إضافية
- تأكد من تفعيل Proxy (سحابة برتقالية)

### المشكلة: الموقع لا يفتح
- تأكد من تشغيل التطبيق على السيرفر
- تأكد من تشغيل Tunnel المحدّث

---

## 🎯 الخطوة التالية

بعد إضافة DNS Records، ارجع إلى السيرفر وشغل:
```
UPDATE_CLOUDFLARE_CONFIG.bat
```

واختر "تشغيل Tunnel المحدّث" عندما يُطلب منك.

---

*هذا دليل مبسط للمستخدمين غير التقنيين*
*تاريخ الإنشاء: أغسطس 2025*