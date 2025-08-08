# استخدام Node.js 18 Alpine كصورة أساسية
FROM node:18-alpine

# تثبيت التبعيات الإضافية
RUN apk add --no-cache \
    postgresql-client \
    curl \
    bash

# إنشاء مجلد التطبيق
WORKDIR /app

# نسخ ملفات package.json أولاً للاستفادة من Docker layer caching
COPY package*.json ./

# تثبيت جميع التبعيات (شاملة devDependencies للبناء)
RUN npm ci && npm cache clean --force

# نسخ بقية ملفات المشروع
COPY . .

# إنشاء مجلدات اللوجز والنسخ الاحتياطية
RUN mkdir -p logs backup

# بناء المشروع
RUN npm run build

# إزالة devDependencies بعد البناء لتوفير المساحة
RUN npm prune --production

# إنشاء مستخدم غير root للأمان
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# تغيير ملكية الملفات
RUN chown -R nodejs:nodejs /app
USER nodejs

# كشف المنفذ
EXPOSE 5000

# فحص صحة التطبيق
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# تشغيل التطبيق
CMD ["npm", "start"]