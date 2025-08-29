# دليل تشغيل نظام قرطبة للتوريدات محلياً

## المتطلبات الأساسية

1. **Node.js** (الإصدار 18 أو أحدث)
   - تحميل من: https://nodejs.org/

2. **Git** (لاستنساخ المشروع)
   - تحميل من: https://git-scm.com/

## خطوات التثبيت

### 1. استنساخ المشروع
```bash
git clone [رابط المشروع]
cd [اسم مجلد المشروع]
```

### 2. تثبيت الحزم المطلوبة
```bash
npm install
```

### 3. إعداد متغيرات البيئة

أنشئ ملف `.env` في المجلد الرئيسي وأضف المتغيرات التالية:

```env
# إعدادات قاعدة البيانات PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/qortoba_db

# مفتاح الجلسة (استخدم نص عشوائي طويل)
SESSION_SECRET=your-secret-key-here-make-it-long-and-random

# إعدادات Google Sheets
GOOGLE_SHEETS_ID=1pLFZIa-nXdRJqP4Hvgcof_nhv6uqZxOCHKhc_qacSvs
GOOGLE_USERS_SHEETS_ID=1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg

# مفتاح DeepSeek AI
DEEPSEEK_API_KEY=sk-975df6f825c24e91bc60de32c35b59ce

# إعدادات Telegram Bot (اختياري)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# منفذ الخادم
PORT=5000
```

### 4. إعداد ملف مفتاح Google Service Account

ضع ملف `google-service-account-key.json` في المجلد الرئيسي للمشروع.
هذا الملف مطلوب للاتصال بـ Google Sheets.

**محتوى الملف الحالي:**
```json
{
  "type": "service_account",
  "project_id": "cortoba-supp-sys",
  "private_key_id": "61f31097e14667ab0c02e99c41c90c7e4dd16e0c",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDm2FqiQQJ7G4wW\n8w2iALKdQx8B0Nk7+h0+x1aNOD2BSVLPFwXHlI9B8K6PsqDW2h9qh2gO7+1wQ5/v\n+3JFSb7HQqCGh2eeEqLnMG7xLCddwBfm6QKCI9YfFKEtxsVP4Ju4QFzKKROT3Icd\ngbdBNvqUJoOLRXJOF77JF2HoXfkyDGazQiGptKE2IhI4xQ7vN6dtnxyPRWRqMLdH\n8swfXdT2VLz+hZgqRy9OQfXOSkPhJP6G0CYxRIJFP6lSLLhhlOOT0BCnNmuSZnTn\ngLxGw+TlO3xNbT2o5iE5GBRUyKBJN6Fc4f4fGZk7e1N7xXlOOMa7wlcAoFzHdGEm\nIzHkmRnJAgMBAAECggEAAbLXb6X3MWpQRnxhxbhETlD9NtUhQIXrm5nMGQGJZzA6\nE4JYx7G8AoF3q7IzFJQj5yQdTzRQzxK5B0xXA0F0y8G2dXEQEYafBGXleJHtquHs\njqB1eLQXLb/i8+3iiMDWxoNsxN7xU5Osg7K1mxw2u1u1VCbVBxGU1dPCN+7ld/Vp\nOiRzP/C+HJKJfP7gvN3oj5/MGMtZo7F6vawG/Jm2Kep2vJJN7KvCy5IiROFyXJjB\nCqUOJx1/A1nQqMCfGNK4D9f3MtTBJoNZ6dFN0Ii+YnU3pJyQH4AcQuPXQrUCVzJg\n2iRBekRNv2sxXIgqOD3ijYmD7seCyZPQQGkMCo7xdQKBgQD9FsBnHQQvl4FelrBw\n8I8wvcwyS6BdHFaXkBJRuLPt3m7sQHQCucsZGP6z9aJCQo1OktqCHVUX5LcBBqXu\nqKi7pGSCJjMOdF1qtyBHJIGBvFm5TRLYdFpNdXzjksC0BxXxQXO/QAhMnxCdUU0K\nOkybiEJORCJRwzJ7u4tUx5A3vwKBgQDpgA6HRvYxnJH+8VW3cMBQcJNvBNABojcU\n3YupP8lQVnJNY+bXo2rQJ9sAtbIrD5mJlGxYNNJGcfZNLrPzJN5Nf8YQdPy3hBn5\nJHKJlQNGPOUrGMPXuOvz3YmJpEQu4C/+fNa5WEGStqcFKKbqOx9OEg3CgQK3ovyU\nvmFvFR9hNwKBgBDBxJD8O2/lLCuL4dCcU7D7XCRcQfrv2GD+U3KhNy6VGyRRsZhJ\nQW5SDlg8X3/XEgdCkAcCBajDWBkRGI9wOZ5fJgJOhGb8WMNqE7vCEUGRqOy5xrGN\nm6OKjCe8XJudmrJlKmiwt1qZl1Uuv5tPm0zAYkBcWN6wkOaJ8xZEWv8xAoGBAJFK\nvzOzgHKkpUSuHKdP/hkrLvzUz6Pw5fJQQlSJejwx0+K8LGLa8VrlHO5e9lBMRJH8\nE/oEEoZMzKq2J9O7xCMW2vXHHXUMDJaJvejXF8cUy6TCCtHMSx5P+1lqm/HJBzHu\nMcL3o/YuxfRkN3eFPt6AUHfD5SAvGdEQqxCaUjhBAoGBAPa3k9+EJgcBc6vZOWr0\nQHHLOdOtqOzUnPh0BgP0SoMuwYy4G8FozZWz4MUyUvMzU7mO/n9PZlxz0fNtpZ7c\n6sUGkJkSKHJiS0oaBNQbSdFrktl6STPDxyqpv6fyzsRWP2kB3z6l1f4sXEqBZRbB\ngGhP0KtvKUo3hT+3DJlAoiJu\n-----END PRIVATE KEY-----\n",
  "client_email": "cortoba-sys@cortoba-supp-sys.iam.gserviceaccount.com",
  "client_id": "102623527251773092773",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/cortoba-sys%40cortoba-supp-sys.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

## تشغيل المشروع

### وضع التطوير (Development)
```bash
npm run dev
```
سيعمل المشروع على: http://localhost:5000

### وضع الإنتاج (Production)
```bash
npm run build
npm start
```

## بيانات الدخول الافتراضية

- **اسم المستخدم:** admin
- **كلمة المرور:** admin123

## هيكل المشروع

```
قرطبة-للتوريدات/
├── client/              # واجهة المستخدم (React + TypeScript)
│   ├── src/
│   │   ├── pages/      # صفحات التطبيق
│   │   ├── components/ # المكونات القابلة لإعادة الاستخدام
│   │   └── hooks/      # React Hooks المخصصة
├── server/              # الخادم الخلفي (Node.js + Express)
│   ├── routes.ts       # نقاط النهاية API
│   └── google-sheets/  # تكامل Google Sheets
├── shared/             # الكود المشترك بين الخادم والعميل
└── public/             # الملفات الثابتة
```

## المشاكل الشائعة وحلولها

### 1. خطأ في الاتصال بـ Google Sheets
**الحل:** تأكد من:
- وجود ملف `google-service-account-key.json`
- صحة معرفات Google Sheets في `.env`
- منح الصلاحيات للبريد الإلكتروني للخدمة في Google Sheets

### 2. خطأ في قاعدة البيانات
**الحل:** تأكد من:
- تشغيل PostgreSQL على جهازك
- صحة بيانات الاتصال في `DATABASE_URL`
- إنشاء قاعدة البيانات بالاسم المحدد

### 3. خطأ في تشغيل npm install
**الحل:**
```bash
# حذف مجلد node_modules وإعادة التثبيت
rm -rf node_modules package-lock.json
npm install
```

## الميزات الرئيسية

- ✅ إدارة طلبات التسعير وأوامر الشراء
- ✅ تكامل مع Google Sheets للبيانات الحية
- ✅ نظام صلاحيات متعدد المستويات
- ✅ تحليل ذكي للأصناف باستخدام DeepSeek AI
- ✅ واجهة مستخدم عربية بالكامل
- ✅ مزامنة تلقائية كل 10 ثوانٍ

## الدعم الفني

في حالة وجود أي مشاكل، تأكد من:
1. مراجعة سجلات الأخطاء في وحدة التحكم
2. التحقق من جميع متغيرات البيئة
3. التأكد من تثبيت جميع الحزم المطلوبة

## ملاحظات مهمة

- يعمل النظام بدون قاعدة بيانات PostgreSQL (يستخدم Google Sheets فقط)
- المزامنة التلقائية تحدث كل 10 ثوانٍ
- جميع البيانات مخزنة في Google Sheets المحددة