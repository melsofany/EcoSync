# 🏢 قرطبة للتوريدات - نظام إدارة التوريدات

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Arabic](https://img.shields.io/badge/Language-Arabic-red.svg)](https://ar.wikipedia.org/wiki/العربية)

نظام شامل لإدارة التوريدات والمشتريات مُصمم خصيصاً للشركات العربية، مع دعم كامل للغة العربية واتجاه RTL.

## ✨ المميزات الرئيسية

### 📋 إدارة طلبات عروض الأسعار
- إنشاء وتتبع طلبات عروض الأسعار
- استيراد البيانات من ملفات Excel
- تسعير متوازي للموردين والعملاء
- workflow متقدم لمتابعة حالة الطلبات

### 🏪 إدارة الموردين والعملاء
- قاعدة بيانات شاملة للموردين والعملاء
- تتبع تاريخ التعاملات والأسعار
- إدارة معلومات الاتصال والملفات

### 📦 فهرسة البنود الذكية
- نظام ترقيم تلقائي للبنود (P-format)
- كشف المكررات بالذكاء الاصطناعي
- توحيد البنود المتشابهة

### 🛒 إدارة أوامر الشراء
- إنشاء أوامر شراء من طلبات الأسعار
- تتبع حالة الطلبات والتسليم
- ربط بالأسعار والموردين

### 👥 إدارة المستخدمين والصلاحيات
- نظام صلاحيات مرن ومتقدم
- أدوار متعددة: مدير، شراء، حسابات، إدخال بيانات
- تتبع نشاط المستخدمين

### 📊 التقارير والإحصائيات
- لوحة تحكم تفاعلية
- إحصائيات شاملة للعمليات
- تصدير البيانات للـ Excel

## 🚀 التقنيات المستخدمة

### Frontend
- **React** - مكتبة واجهة المستخدم
- **TypeScript** - لغة البرمجة
- **Vite** - أداة البناء والتطوير
- **Tailwind CSS** - إطار عمل التصميم
- **Shadcn/ui** - مكونات واجهة المستخدم
- **TanStack Query** - إدارة حالة الخادم

### Backend
- **Node.js** - بيئة تشغيل JavaScript
- **Express.js** - إطار عمل الخادم
- **TypeScript** - لغة البرمجة
- **Drizzle ORM** - أداة قاعدة البيانات
- **PostgreSQL** - قاعدة البيانات

### المميزات التقنية
- **RTL Support** - دعم كامل للعربية
- **Responsive Design** - تصميم متجاوب
- **Session Auth** - مصادقة آمنة
- **File Upload** - رفع الملفات
- **Excel Import/Export** - استيراد وتصدير Excel

## 🛠️ التثبيت والتشغيل

### المتطلبات الأساسية
- Node.js 18 أو أحدث
- PostgreSQL 13 أو أحدث
- 2GB RAM على الأقل

### التثبيت السريع
```bash
# استنساخ المشروع
git clone https://github.com/[username]/qortoba-supplies.git
cd qortoba-supplies

# تثبيت التبعيات
npm install

# إعداد البيئة
cp .env.production.example .env
# عدل ملف .env بالإعدادات المطلوبة

# إعداد قاعدة البيانات
npm run db:push

# تشغيل المشروع
npm run dev
```

### النشر على خادم خارجي
```bash
# استخدام سكريبت النشر التلقائي
./deploy.sh production

# أو باستخدام Docker
docker-compose -f docker-deployment.yml up -d
```

## 📚 الوثائق

- [📖 دليل النشر الشامل](./README-DEPLOYMENT.md)
- [🐳 النشر باستخدام Docker](./docker-deployment.yml)
- [🔧 دليل التثبيت على Windows](./RDP_DEPLOYMENT_GUIDE.md)
- [🖥️ دليل التثبيت على Linux](./SERVER_DEPLOYMENT_GUIDE.md)
- [✅ قائمة التحقق للنشر](./DEPLOYMENT_CHECKLIST.md)

## 🔧 الإعداد

### متغيرات البيئة
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/qortoba_supplies
PORT=5000
SESSION_SECRET=your_secure_session_secret
DEEPSEEK_API_KEY=your_ai_api_key_optional
```

### إعداد قاعدة البيانات
```sql
CREATE DATABASE qortoba_supplies;
CREATE USER qortoba_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE qortoba_supplies TO qortoba_user;
```

## 📱 واجهة المستخدم

النظام مُصمم بـ **Arabic-first approach** مع:
- واجهة باللغة العربية بالكامل
- دعم اتجاه RTL
- تصميم متجاوب للجوال والحاسوب
- ألوان وخطوط محسنة للقراءة العربية

## 🤖 الذكاء الاصطناعي

النظام يدعم:
- كشف البنود المكررة تلقائياً
- توحيد أرقام القطع المتشابهة
- تحليل أوصاف البنود
- اقتراحات ذكية للتصنيف

## 🔐 الأمان

- مصادقة قائمة على الجلسات
- تشفير كلمات المرور
- صلاحيات متدرجة حسب الدور
- حماية من CSRF و XSS
- تسجيل جميع الأنشطة

## 🚀 خيارات النشر

### 1. النشر التقليدي
- Ubuntu/CentOS/Windows Server
- PM2 لإدارة العمليات
- Nginx كـ reverse proxy

### 2. النشر باستخدام Docker
- Docker Compose كامل
- PostgreSQL containerized
- Nginx load balancer

### 3. النشر السحابي
- AWS/Azure/GCP compatible
- Auto-scaling support
- Load balancer ready

## 🤝 المساهمة

نرحب بالمساهمات! يرجى:
1. Fork المشروع
2. إنشاء branch للميزة الجديدة
3. Commit التغييرات
4. Push للـ branch
5. فتح Pull Request

## 📞 الدعم

للحصول على الدعم:
- فتح Issue في GitHub
- مراجعة [الوثائق](./README-DEPLOYMENT.md)
- فحص [الأسئلة الشائعة](./DEPLOYMENT_CHECKLIST.md)

## 📄 الترخيص

هذا المشروع مُرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

## 🎯 الإصدارات

- **v1.0** - الإصدار الأساسي مع جميع المميزات الأساسية
- **v1.1** - إضافة الذكاء الاصطناعي وتحسينات الأداء
- **v1.2** - دعم Docker وتحسينات النشر
- **v1.3** - نظام الصلاحيات المرن والنسخ الاحتياطية

---

**مصنوع بـ ❤️ للشركات العربية**
