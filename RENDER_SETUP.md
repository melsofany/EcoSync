# إعداد النظام على Render

## المشكلة
البيانات تعمل في Replit لكن لا تظهر في Render بسبب نقص متغيرات البيئة المطلوبة.

## متغيرات البيئة المطلوبة في Render

### 1. إعداد Google Sheets

#### أولاً: تحويل مفتاح Google Service Account إلى Base64
```bash
# في Terminal على Replit، قم بتنفيذ:
cat ./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json | base64 -w 0
```

#### ثانياً: إضافة المتغيرات في Render Dashboard

1. اذهب إلى Render Dashboard
2. اختر خدمتك (Web Service)
3. اذهب إلى **Environment**
4. أضف المتغيرات التالية:

```
GOOGLE_SERVICE_ACCOUNT_BASE64=<القيمة من الخطوة السابقة>
GOOGLE_SHEETS_ID=1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg
DATABASE_URL=<قيمة DATABASE_URL من Replit>
PORT=10000
NODE_ENV=production
SESSION_SECRET=your-secret-key-here
```

### 2. متغيرات إضافية (اختيارية)

إذا كنت تستخدم خدمات إضافية، أضف:

```
DEEPSEEK_API_KEY=<مفتاح DeepSeek API>
TELEGRAM_BOT_TOKEN=<توكن بوت Telegram>
SENDGRID_API_KEY=<مفتاح SendGrid للبريد>
```

## التحقق من العمل

بعد إضافة المتغيرات:

1. أعد نشر التطبيق (Redeploy)
2. تحقق من Logs للتأكد من عدم وجود أخطاء
3. جرب تسجيل الدخول بـ Ahmed/Ahmed9876
4. يجب أن تظهر البيانات الآن (5604 بند، 329 أمر شراء)

## ملاحظات مهمة

- تأكد من نسخ قيمة Base64 كاملة (قد تكون طويلة جداً)
- لا تضع مسافات أو أسطر جديدة في قيمة Base64
- إذا ظهرت رسالة خطأ في المصادقة، تحقق من أن مفتاح Google Service Account صحيح
- تأكد من أن Google Sheets مشترك مع البريد: cortoba-sys@cortoba-supp-sys.iam.gserviceaccount.com

## استكشاف الأخطاء

### إذا ظهرت صفحة فارغة:
1. تحقق من Render Logs
2. ابحث عن: "❌ لا يمكن العثور على مفتاح Google Service Account"
3. تأكد من إضافة GOOGLE_SERVICE_ACCOUNT_BASE64

### إذا فشل تسجيل الدخول:
1. تأكد من DATABASE_URL صحيح
2. تحقق من اتصال قاعدة البيانات في Render

### إذا لم تظهر البيانات بعد تسجيل الدخول:
1. تحقق من GOOGLE_SHEETS_ID
2. تأكد من صلاحيات Google Sheets للـ Service Account