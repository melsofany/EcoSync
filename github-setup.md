# 🐙 دليل إعداد GitHub لمشروع قرطبة للتوريدات

## 📋 خطوات إنشاء Repository على GitHub

### 1. إنشاء Repository جديد
1. اذهب إلى [GitHub.com](https://github.com)
2. اضغط على "New repository" أو الرمز + في الأعلى
3. املأ بيانات Repository:
   - **Repository name**: `qortoba-supplies`
   - **Description**: `نظام إدارة التوريدات الشامل - Comprehensive Supply Management System`
   - **Visibility**: Public (أو Private حسب التفضيل)
   - **README**: لا تضع علامة (لأن لدينا README.md جاهز)
   - **gitignore**: Node (أو لا تختر لأن لدينا .gitignore جاهز)
   - **License**: MIT

### 2. إعداد Git محلياً
```bash
# إذا لم يكن Git مُعد مسبقاً في المشروع
git init

# إضافة ملفات المشروع
git add .

# أول commit
git commit -m "feat: initial commit - نظام إدارة التوريدات الكامل"

# ربط بـ GitHub (استبدل [username] باسم المستخدم)
git remote add origin https://github.com/[username]/qortoba-supplies.git

# رفع الملفات
git branch -M main
git push -u origin main
```

### 3. إعداد Repository Settings

#### تفعيل Issues
- اذهب إلى Settings → General
- في قسم Features، تأكد من تفعيل Issues

#### إعداد Branch Protection
- اذهب إلى Settings → Branches
- أضف Branch protection rule لـ `main`:
  - Require pull request reviews before merging
  - Require status checks to pass before merging

## 📝 إعداد Templates

### Issue Template للأخطاء
```markdown
**وصف المشكلة**
وصف واضح وموجز للمشكلة.

**خطوات إعادة الإنتاج**
1. اذهب إلى '...'
2. اضغط على '...'
3. ستظهر المشكلة

**السلوك المتوقع**
وصف واضح لما توقعت حدوثه.

**لقطات شاشة**
إن أمكن، أضف لقطات شاشة للمساعدة في شرح المشكلة.

**معلومات البيئة:**
- نظام التشغيل: [e.g. Windows 10, Ubuntu 20.04]
- المتصفح: [e.g. Chrome, Firefox]
- إصدار المشروع: [e.g. v1.0.0]
```

### Issue Template للميزات
```markdown
**وصف الميزة المقترحة**
وصف واضح للميزة الجديدة المطلوبة.

**حالة الاستخدام**
اشرح لماذا تحتاج هذه الميزة وكيف ستفيد المستخدمين.

**الحل المقترح**
وصف واضح للحل الذي تقترحه.

**بدائل أخرى**
أي بدائل أخرى فكرت بها.

**معلومات إضافية**
أي سياق أو لقطات شاشة إضافية حول طلب الميزة.
```

### Pull Request Template
```markdown
## وصف التغييرات
وصف مختصر للتغييرات المُجراة.

## نوع التغيير
- [ ] إصلاح خطأ (non-breaking change)
- [ ] ميزة جديدة (non-breaking change)
- [ ] تغيير مؤثر (breaking change)
- [ ] تحديث الوثائق

## الاختبارات
- [ ] تم اختبار التغييرات محلياً
- [ ] تم التأكد من عمل جميع الوظائف الحالية
- [ ] تم إضافة اختبارات للميزات الجديدة

## قائمة التحقق
- [ ] الكود يتبع معايير المشروع
- [ ] تم مراجعة الكود ذاتياً
- [ ] الكود مُعلق جيداً
- [ ] تم تحديث الوثائق إن لزم الأمر
```

## 🔧 إعداد GitHub Actions (CI/CD)

### ملف Workflow للاختبارات
```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: qortoba_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Check TypeScript
      run: npm run check
      
    - name: Build project
      run: npm run build
```

## 📊 إعداد Project Board

### 1. إنشاء Project
- اذهب إلى Projects tab في Repository
- اضغط "New project"
- اختر "Board" template
- اسم المشروع: "قرطبة للتوريدات - خريطة الطريق"

### 2. إعداد Columns
- **Backlog**: الأفكار والمقترحات
- **To Do**: المهام المخططة
- **In Progress**: قيد التطوير
- **Review**: مراجعة الكود
- **Done**: مكتمل

## 🏷️ إعداد Labels

إنشاء Labels لتصنيف Issues:

### حسب النوع
- `bug` (أحمر) - خطأ في النظام
- `enhancement` (أزرق فاتح) - ميزة جديدة
- `documentation` (أزرق) - تحسين الوثائق
- `question` (وردي) - سؤال أو استفسار

### حسب الأولوية
- `priority: high` (أحمر غامق) - أولوية عالية
- `priority: medium` (برتقالي) - أولوية متوسطة
- `priority: low` (أخضر) - أولوية منخفضة

### حسب المجال
- `frontend` (أزرق فاتح) - واجهة المستخدم
- `backend` (أخضر) - الخادم الخلفي
- `database` (بنفسجي) - قاعدة البيانات
- `deployment` (رمادي) - النشر والتثبيت

## 📈 إعداد Insights

### تفعيل إحصائيات Repository
- اذهب إلى Insights tab
- راقب:
  - Contributors
  - Code frequency
  - Commit activity
  - Traffic (للـ public repos)

## 🔐 إعداد Security

### تفعيل Security Features
1. **Dependency alerts**: Settings → Security & analysis
2. **Code scanning**: Settings → Security & analysis
3. **Secret scanning**: Settings → Security & analysis

### إنشاء SECURITY.md
```markdown
# Security Policy

## الإبلاغ عن الثغرات الأمنية

إذا اكتشفت ثغرة أمنية، يرجى عدم فتح issue عام.
بدلاً من ذلك، أرسل إيميل إلى: security@yourcompany.com

نحن نأخذ الأمان بجدية ونقدر جهودك في الحفاظ على أمان المشروع.

## الإصدارات المدعومة

| الإصدار | مدعوم |
| ------- | ------ |
| 1.x.x   | ✅     |
| < 1.0   | ❌     |
```

## 📱 إعداد Social Preview

### إنشاء صورة للمشروع
- الأبعاد المُوصاة: 1280x640 pixels
- يجب أن تحتوي على:
  - اسم المشروع بالعربية والإنجليزية
  - شعار أو أيقونة
  - وصف مختصر

### رفع الصورة
- اذهب إلى Settings → General
- في قسم Social preview، ارفع الصورة

## 🌟 إعداد README Badge

إضافة badges للـ README:
```markdown
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue.svg)](https://www.postgresql.org/)
[![GitHub stars](https://img.shields.io/github/stars/[username]/qortoba-supplies.svg)](https://github.com/[username]/qortoba-supplies/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/[username]/qortoba-supplies.svg)](https://github.com/[username]/qortoba-supplies/network)
```

## 📋 قائمة التحقق النهائية

- [ ] Repository مُنشأ بالاسم والوصف الصحيح
- [ ] جميع ملفات المشروع مرفوعة
- [ ] README.md شامل ومفيد
- [ ] .gitignore يستبعد الملفات المناسبة
- [ ] LICENSE مُضاف
- [ ] Issue templates مُعدة
- [ ] Pull request template مُعد
- [ ] Labels مُصنفة
- [ ] Project board مُعد
- [ ] Security settings مُفعلة
- [ ] Branch protection مُعد

---

**Repository جاهز للمشاركة! 🎉**

الآن يمكن للمطورين الآخرين المساهمة في المشروع بسهولة.