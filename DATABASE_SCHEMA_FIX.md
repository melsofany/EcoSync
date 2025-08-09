# إصلاح schema قاعدة البيانات - مشكلة client_name

## تشخيص المشكلة:

### السبب الجذري:
- خطأ قاعدة البيانات: `column "client_name" of relation "quotation_requests" does not exist`
- schema في `shared/schema.ts` يستخدم `clientName` لكن قاعدة البيانات تحتاج `client_name`
- Drizzle ORM يحول `clientName` إلى `client_name` في SQL تلقائياً

## الحل المطبق:

### 1. تشغيل database migration:
```bash
npm run db:push
```

### 2. إضافة معالجة العملاء:
- إنشاء أو العثور على العميل قبل إنشاء طلب التسعير
- استخدام `clientId` بدلاً من `clientName` مباشرة
- إضافة اسم العميل في `notes` للمرجعية

### 3. إصلاح التعامل مع البيانات:
```js
// إنشاء العميل أو العثور عليه
let clientId = '';
if (record.clientName && record.clientName !== 'غير محدد') {
  let client = await storage.getClientByName(record.clientName);
  if (!client) {
    client = await storage.createClient({
      name: record.clientName,
      email: `${record.clientName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      phone: '',
      address: ''
    });
  }
  clientId = client.id;
}
```

## الحالة:
🔄 Migration في التقدم
⏳ اختبار الإصلاح...