# متغيرات البيئة المطلوبة لـ Railway

## المتغيرات الأساسية المطلوبة

قم بإضافة هذه المتغيرات في Railway Settings > Variables:

### 1. Google Sheets Configuration
```
GOOGLE_SHEETS_ID=1TuNmhUQSLCIJjyPKRGEX5WwCIlwgePdN5kBLkPSNGqg
GOOGLE_SHEETS_USER_MANAGEMENT_ID=1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg
```

### 2. Session Secret (مطلوب للأمان)
```
SESSION_SECRET=your-secure-random-string-here-minimum-32-chars
```
**مهم:** استخدم سلسلة عشوائية قوية (32 حرف على الأقل)

### 3. قاعدة البيانات (اختياري)
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```
**ملاحظة:** المشروع يستخدم Google Sheets كقاعدة بيانات أساسية، لذا DATABASE_URL اختياري

### 4. DeepSeek API (للذكاء الاصطناعي)
```
DEEPSEEK_API_KEY=your-deepseek-api-key
```

### 5. Telegram Bot (اختياري)
```
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

### 6. Port (Railway يضبطه تلقائياً)
```
PORT=5000
```
**ملاحظة:** Railway سيضبط هذا تلقائياً، لا تحتاج لإضافته يدوياً

## كيفية إضافة المتغيرات في Railway:

1. اذهب إلى مشروعك في Railway Dashboard
2. اضغط على الخدمة (Service)
3. اذهب إلى **Settings** tab
4. ابحث عن قسم **Variables**
5. اضغط على **"Add Variable"**
6. أضف كل متغير بالاسم والقيمة
7. Railway سيعيد تشغيل التطبيق تلقائياً

## متغيرات اختيارية إضافية:

### للبريد الإلكتروني (SendGrid)
```
SENDGRID_API_KEY=your-sendgrid-api-key
```

### للنسخ الاحتياطية
```
BACKUP_ENABLED=false
```

## نصائح مهمة:

1. **SESSION_SECRET** يجب أن يكون عشوائياً وقوياً للأمان
2. **GOOGLE_SHEETS_ID** و **GOOGLE_SHEETS_USER_MANAGEMENT_ID** مطلوبان للعمل مع Google Sheets
3. **DATABASE_URL** غير مطلوب إذا كنت تستخدم Google Sheets فقط
4. احرص على عدم مشاركة هذه المتغيرات مع أي شخص

## للحصول على المفاتيح:

- **DeepSeek API**: من https://platform.deepseek.com/
- **SendGrid**: من https://sendgrid.com/
- **Telegram Bot**: من @BotFather في Telegram

بعد إضافة جميع المتغيرات المطلوبة، سيعمل التطبيق بنجاح على Railway! 🚀