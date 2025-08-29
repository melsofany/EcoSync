# استخدام Node.js 20 Alpine كصورة أساسية (مطلوب لـ better-sqlite3)
FROM node:20-alpine

# تثبيت التبعيات الإضافية والمكتبات المطلوبة لـ better-sqlite3
RUN apk add --no-cache \
    postgresql-client \
    curl \
    bash \
    python3 \
    make \
    g++ \
    git

# إنشاء مجلد التطبيق
WORKDIR /app

# نسخ ملفات package.json أولاً للاستفادة من Docker layer caching
COPY package*.json ./

# تثبيت جميع التبعيات (شاملة devDependencies للبناء)
# استخدام npm install بدلاً من npm ci لتجنب مشاكل package-lock.json
# وإضافة --build-from-source لـ better-sqlite3 للتوافق مع Alpine Linux
RUN npm install --legacy-peer-deps --build-from-source=better-sqlite3 && npm cache clean --force

# نسخ بقية ملفات المشروع
COPY . .

# التأكد من وجود esbuild و vite في node_modules
RUN npm list esbuild vite || npm install esbuild vite --save-dev

# إنشاء مجلدات اللوجز والنسخ الاحتياطية
RUN mkdir -p logs backup

# التحقق من وجود client/package.json وتثبيت تبعياته أولاً
RUN if [ -f "client/package.json" ]; then cd client && npm install --legacy-peer-deps; fi

# بناء المشروع (تأكد من وجود esbuild و vite)
RUN npm run build

# التحقق من أن ملف dist/index.js تم إنشاؤه
RUN ls -la dist/ && test -f dist/index.js

# إزالة devDependencies بعد البناء لتوفير المساحة
# ملاحظة: تم تعطيل هذا الأمر لأنه قد يحذف تبعيات مطلوبة
# RUN npm prune --production || true

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