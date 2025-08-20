# دليل نشر نظام قرطبة على دومين COR-TOBA.ONLINE

## 📋 المتطلبات الأساسية

### 1. على جهاز الكمبيوتر الشخصي:
- Windows 10/11 أو Linux أو macOS
- Node.js 20+ مثبت
- Git مثبت
- منفذ 80 و 443 مفتوح في جدار الحماية
- عنوان IP ثابت أو Dynamic DNS

### 2. على مستوى الدومين:
- الوصول إلى لوحة تحكم DNS للدومين COR-TOBA.ONLINE
- القدرة على إضافة A Record أو CNAME

## 🚀 خطوات النشر

### الخطوة 1: تحضير المشروع للإنتاج

```bash
# 1. انسخ المشروع إلى مجلد جديد
git clone [رابط المشروع] cor-toba-production
cd cor-toba-production

# 2. ثبت المكتبات
npm install

# 3. ابني المشروع للإنتاج
npm run build
```

### الخطوة 2: إعداد متغيرات البيئة

أنشئ ملف `.env.production` في المجلد الرئيسي:

```env
NODE_ENV=production
PORT=80
HOST=0.0.0.0
DOMAIN=cor-toba.online

# Google Sheets API
GOOGLE_SHEETS_API_KEY=your_actual_key_here
GOOGLE_SHEETS_ID=1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg

# DeepSeek API
DEEPSEEK_API_KEY=your_actual_key_here

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_actual_token_here

# Session Secret (قم بتوليد مفتاح عشوائي قوي)
SESSION_SECRET=generate_random_secret_here_min_32_chars

# Database (اختياري إذا كنت تريد استخدام PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/cortoba
```

### الخطوة 3: إعداد خادم الويب

#### الخيار أ: استخدام PM2 (موصى به)

```bash
# 1. ثبت PM2 عالمياً
npm install -g pm2

# 2. أنشئ ملف ecosystem.config.js
```

أنشئ `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'cortoba-system',
    script: 'npm',
    args: 'run start',
    env: {
      NODE_ENV: 'production',
      PORT: 80
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
```

```bash
# 3. ابدأ التطبيق
pm2 start ecosystem.config.js

# 4. احفظ إعدادات PM2 للتشغيل التلقائي
pm2 save
pm2 startup
```

#### الخيار ب: استخدام Docker

أنشئ `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 80 443

CMD ["npm", "start"]
```

أنشئ `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: always
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
```

```bash
# ابدأ بـ Docker
docker-compose up -d
```

### الخطوة 4: إعداد HTTPS مع Let's Encrypt

#### تثبيت Certbot:

**على Windows:**
```powershell
# استخدم Chocolatey
choco install certbot
```

**على Linux:**
```bash
sudo apt update
sudo apt install certbot
```

#### الحصول على شهادة SSL:

```bash
# أوقف الخادم مؤقتاً
pm2 stop cortoba-system

# احصل على الشهادة
certbot certonly --standalone -d cor-toba.online -d www.cor-toba.online

# أعد تشغيل الخادم
pm2 start cortoba-system
```

### الخطوة 5: إعداد Nginx كـ Reverse Proxy (اختياري لكن موصى به)

أنشئ ملف `/etc/nginx/sites-available/cor-toba.online`:

```nginx
server {
    listen 80;
    server_name cor-toba.online www.cor-toba.online;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cor-toba.online www.cor-toba.online;

    ssl_certificate /etc/letsencrypt/live/cor-toba.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cor-toba.online/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 100M;
}
```

```bash
# فعّل الموقع
sudo ln -s /etc/nginx/sites-available/cor-toba.online /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### الخطوة 6: إعداد DNS

في لوحة تحكم الدومين، أضف:

```
Type: A
Name: @
Value: [عنوان IP جهازك العام]
TTL: 3600

Type: A
Name: www
Value: [عنوان IP جهازك العام]
TTL: 3600
```

### الخطوة 7: فتح المنافذ على الراوتر (Port Forwarding)

1. ادخل إلى إعدادات الراوتر (عادة 192.168.1.1)
2. ابحث عن Port Forwarding أو Virtual Server
3. أضف:
   - External Port: 80 → Internal Port: 80 → IP: [IP جهازك المحلي]
   - External Port: 443 → Internal Port: 443 → IP: [IP جهازك المحلي]

### الخطوة 8: الأمان

1. **جدار الحماية:**
```bash
# على Linux
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. **تحديثات الأمان:**
```bash
# تحديث تلقائي للشهادات SSL
crontab -e
# أضف:
0 0 * * 0 certbot renew --quiet
```

3. **المراقبة:**
```bash
# مراقبة الأداء
pm2 monit

# عرض السجلات
pm2 logs cortoba-system
```

## 🔧 سكربت النشر الكامل

أنشئ `deploy.sh` (Linux/Mac) أو `deploy.bat` (Windows):

**deploy.sh:**
```bash
#!/bin/bash

echo "🚀 بدء نشر نظام قرطبة..."

# تحديث الكود
git pull origin main

# تثبيت المكتبات
npm ci --only=production

# بناء المشروع
npm run build

# إعادة تشغيل PM2
pm2 restart cortoba-system

echo "✅ تم النشر بنجاح!"
```

**deploy.bat:**
```batch
@echo off
echo 🚀 بدء نشر نظام قرطبة...

REM تحديث الكود
git pull origin main

REM تثبيت المكتبات
npm ci --only=production

REM بناء المشروع
npm run build

REM إعادة تشغيل PM2
pm2 restart cortoba-system

echo ✅ تم النشر بنجاح!
```

## 📱 الوصول للنظام

بعد إتمام الخطوات:
- الموقع: https://cor-toba.online
- لوحة التحكم: https://cor-toba.online/login
- المستخدم: admin
- كلمة المرور: admin123

## ⚠️ ملاحظات مهمة

1. **الأمان**: غيّر كلمة مرور admin فوراً بعد النشر
2. **النسخ الاحتياطي**: قم بعمل نسخ احتياطية دورية
3. **المراقبة**: راقب استخدام الموارد والأداء
4. **الصيانة**: حدّث النظام والمكتبات دورياً

## 🆘 حل المشاكل الشائعة

### المشكلة: الموقع لا يعمل
- تأكد من أن المنافذ مفتوحة في جدار الحماية والراوتر
- تحقق من عنوان IP العام الصحيح
- تأكد من تحديث DNS (قد يستغرق 24-48 ساعة)

### المشكلة: شهادة SSL لا تعمل
- تأكد من أن المنفذ 80 مفتوح لـ Certbot
- تحقق من صحة إعدادات DNS
- جرب تجديد الشهادة: `certbot renew`

### المشكلة: أداء بطيء
- زد موارد PM2: `pm2 scale cortoba-system 2`
- استخدم CDN مثل Cloudflare
- فعّل التخزين المؤقت في Nginx

## 📞 الدعم

عند مواجهة مشاكل:
1. راجع سجلات PM2: `pm2 logs`
2. تحقق من سجلات النظام: `/var/log/nginx/error.log`
3. تأكد من متغيرات البيئة: `pm2 env cortoba-system`