# إصلاح مشكلة Docker Build
## حل مشكلة `sh: vite: not found`

---

## 🚨 المشكلة

عند تشغيل `docker build`، تحدث الأخطاء التالية:
```
sh: vite: not found
✕ [ 8/10] RUN npm run build 
process "/bin/sh -c npm run build" did not complete successfully: exit code: 127
```

---

## 🔍 السبب

في `Dockerfile` الأصلي:
```dockerfile
RUN npm ci --only=production && npm cache clean --force
```

الـ `--only=production` بيثبت `dependencies` فقط ومش بيثبت `devDependencies` اللي فيها:
- `vite` (مطلوب للـ frontend build)
- `esbuild` (مطلوب للـ backend build)
- `typescript` (مطلوب للتحقق من النوع)
- `drizzle-kit` (مطلوب لـ database operations)

---

## ✅ الحل المُطبق

### التغيير في Dockerfile:

**قبل:**
```dockerfile
# تثبيت التبعيات
RUN npm ci --only=production && npm cache clean --force

# نسخ بقية ملفات المشروع
COPY . .

# بناء المشروع
RUN npm run build
```

**بعد:**
```dockerfile
# تثبيت جميع التبعيات (شاملة devDependencies للبناء)
RUN npm ci && npm cache clean --force

# نسخ بقية ملفات المشروع
COPY . .

# بناء المشروع
RUN npm run build

# إزالة devDependencies بعد البناء لتوفير المساحة
RUN npm prune --production
```

---

## 🎯 المنطق

1. **تثبيت كل شيء:** `npm ci` بدون `--only=production` يثبت كل التبعيات
2. **البناء:** `npm run build` يعمل لأن `vite` و `esbuild` موجودين الآن
3. **التنظيف:** `npm prune --production` يحذف `devDependencies` بعد البناء لتوفير المساحة

---

## 🧪 التحقق من الحل

### لاختبار الـ Docker build:
```bash
# بناء الصورة
docker build -t qortoba-app .

# تشغيل الحاوية
docker run -d \
  --name qortoba-container \
  -p 5000:5000 \
  --env-file .env \
  qortoba-app

# فحص الحالة
docker logs qortoba-container
```

### النتيجة المتوقعة:
```
✓ vite build successful
✓ esbuild server compilation successful
✓ Container running on port 5000
```

---

## 📦 حجم الصورة

- **قبل الإصلاح:** Build يفشل
- **بعد الإصلاح:** Build ينجح + حجم محسّن (devDependencies محذوفة بعد البناء)

---

## 🚀 النشر

الآن يمكن نشر Docker image على:
- **Railway:** `railway up`
- **DigitalOcean:** Docker Droplet deployment
- **AWS ECS:** Container deployment
- **Google Cloud Run:** Serverless containers

---

## 📝 ملاحظات للمطورين

### في بيئة التطوير:
- `npm ci` يثبت كل شيء (طبيعي)
- `devDependencies` مطلوبة للتطوير

### في بيئة الإنتاج:
- Docker يثبت كل شيء للبناء
- ثم يحذف `devDependencies` لتوفير المساحة
- الـ runtime يحتاج `dependencies` فقط

---

*تم حل المشكلة: أغسطس 2025*
*نوع المشكلة: Docker Build Configuration*