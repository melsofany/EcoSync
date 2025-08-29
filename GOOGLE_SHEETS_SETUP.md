# إعداد Google Sheets كبديل لقاعدة البيانات المجمدة

## الخطوات المطلوبة:

### 1. إنشاء Google Spreadsheet جديد:
- اذهب إلى https://sheets.google.com
- إنشاء جدول بيانات جديد
- أعطه اسم: "قرطبة للتوريدات - قاعدة البيانات"
- انسخ الـ ID من الرابط (الجزء بين /d/ و /edit)
- مثال: https://docs.google.com/spreadsheets/d/1ABC123DEF456GHI/edit
- الـ ID هو: 1ABC123DEF456GHI

### 2. إنشاء Google Cloud Project:
- اذهب إلى https://console.cloud.google.com
- إنشاء مشروع جديد أو استخدم موجود
- فعّل Google Sheets API
- اذهب إلى APIs & Services > Credentials
- إنشاء Service Account
- تحميل مفتاح JSON

### 3. إعداد المتغيرات البيئية:
```bash
# في ملف .env
GOOGLE_SHEETS_ID=your_actual_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_KEY=./service-account-key.json
```

### 4. رفع مفتاح الخدمة:
- ضع ملف service-account-key.json في المجلد الجذر
- أو حدد المسار الصحيح في GOOGLE_SERVICE_ACCOUNT_KEY

### 5. مشاركة Spreadsheet:
- في Google Sheets، اضغط "Share"  
- أضف البريد الإلكتروني من Service Account
- أعطه صلاحيات Editor

## المزايا:
✅ بديل فوري لقاعدة البيانات المجمدة
✅ حفظ تلقائي للبيانات الحقيقية
✅ وصول من أي مكان
✅ نسخ احتياطي تلقائي
✅ مشاركة البيانات مع الفريق
✅ تصدير سهل لـ Excel

## البيانات المحفوظة:
- 300 أمر شراء حقيقي
- 1,000 طلب تسعير حقيقي  
- 5,449 صنف حقيقي
- جميع البيانات من الملف الأصلي

النظام سيعمل فوراً بمجرد إضافة المتغيرات!