# حزمة نشر مشروع قرطبة للتوريدات - النشر الخارجي

## 📋 قائمة التحقق قبل النشر

### ✅ المتطلبات الأساسية
- [ ] خادم مع Node.js 18+ و PostgreSQL 13+
- [ ] اتصال إنترنت مستقر
- [ ] صلاحيات المدير على الخادم
- [ ] مفاتيح API (إن وجدت): DEEPSEEK_API_KEY

## 🚀 خطوات النشر السريع

### 1. تحضير الملفات للنقل
```bash
# تحميل المشروع كـ ZIP من Replit أو نسخ الملفات
# الملفات المطلوبة:
- جميع ملفات client/
- جميع ملفات server/
- جميع ملفات shared/
- package.json
- package-lock.json
- drizzle.config.ts
- vite.config.ts
- tsconfig.json
- tailwind.config.ts
- postcss.config.js
- components.json
```

### 2. تثبيت التبعيات على الخادم
```bash
# في مجلد المشروع
npm install

# للإنتاج فقط (اختياري)
npm install --omit=dev
```

### 3. إعداد قاعدة البيانات
```sql
-- اتصال بـ PostgreSQL
sudo -u postgres psql

-- إنشاء قاعدة البيانات والمستخدم
CREATE DATABASE qortoba_supplies;
CREATE USER qortoba_user WITH PASSWORD 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON DATABASE qortoba_supplies TO qortoba_user;
\q
```

### 4. إعداد متغيرات البيئة
```bash
# إنشاء ملف .env
cat > .env << 'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://qortoba_user:YourStrongPassword123!@localhost:5432/qortoba_supplies
PORT=5000
SESSION_SECRET=your_very_secure_session_secret_minimum_32_characters_long
DEEPSEEK_API_KEY=your_deepseek_api_key_if_using_ai_features
EOF
```

### 5. بناء المشروع
```bash
# بناء الواجهة الأمامية
npm run build

# إنشاء جداول قاعدة البيانات
npm run db:push
```

### 6. تشغيل المشروع
```bash
# للاختبار
npm run dev

# للإنتاج
npm start
```

## 🔧 إعداد الخدمة للتشغيل المستمر

### خيار 1: استخدام PM2 (موصى به)
```bash
# تثبيت PM2
npm install -g pm2

# تشغيل المشروع
pm2 start npm --name "qortoba-supplies" -- start

# حفظ الإعداد
pm2 save
pm2 startup

# مراقبة
pm2 monit
```

### خيار 2: Systemd Service (Linux)
```bash
# إنشاء ملف الخدمة
sudo nano /etc/systemd/system/qortoba-supplies.service
```

```ini
[Unit]
Description=Qortoba Supplies Management System
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/path/to/qortoba-supplies
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# تفعيل الخدمة
sudo systemctl daemon-reload
sudo systemctl enable qortoba-supplies
sudo systemctl start qortoba-supplies
```

## 🌐 إعداد Nginx (Reverse Proxy)

### تثبيت وإعداد Nginx
```bash
# تثبيت Nginx
sudo apt install nginx

# إعداد الموقع
sudo nano /etc/nginx/sites-available/qortoba-supplies
```

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # إعادة توجيه HTTP إلى HTTPS (اختياري)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # إعدادات SSL (إذا كان لديك شهادة)
    # ssl_certificate /path/to/certificate.crt;
    # ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        
        # زيادة المهلة الزمنية للعمليات الطويلة
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # إعدادات الأمان
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
```

```bash
# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/qortoba-supplies /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 💾 نقل البيانات من Replit

### 1. تصدير البيانات من Replit
1. سجل دخول كمسؤول تقنية في التطبيق
2. اذهب إلى صفحة الإدارة → إدارة البيانات
3. اضغط على "إنشاء نسخة احتياطية كاملة"
4. حمل ملف `database-backup-[date].sql`

### 2. استيراد البيانات إلى الخادم الجديد
```bash
# نسخ ملف النسخة الاحتياطية إلى الخادم
scp database-backup-*.sql user@server:/path/to/project/

# استيراد البيانات
psql -U qortoba_user -d qortoba_supplies -f database-backup-*.sql
```

## 🔒 الأمان والحماية

### إعداد Firewall
```bash
# السماح بالمنافذ الضرورية فقط
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### تأمين PostgreSQL
```bash
# تحرير ملف إعدادات PostgreSQL
sudo nano /etc/postgresql/*/main/postgresql.conf

# تعديل:
listen_addresses = 'localhost'

# إعادة تشغيل
sudo systemctl restart postgresql
```

## 📊 مراقبة النظام

### مراقبة الأداء
```bash
# مراقبة PM2
pm2 monit

# فحص استخدام الموارد
htop
df -h
free -h

# مراقبة السجلات
pm2 logs qortoba-supplies --lines 100
```

### النسخ الاحتياطية التلقائية
```bash
# إنشاء سكريبت النسخ الاحتياطي
nano /home/user/backup-qortoba.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/user/backups"
mkdir -p $BACKUP_DIR

# نسخة احتياطية لقاعدة البيانات
pg_dump -U qortoba_user -h localhost qortoba_supplies > $BACKUP_DIR/qortoba_backup_$DATE.sql

# ضغط النسخة الاحتياطية
gzip $BACKUP_DIR/qortoba_backup_$DATE.sql

# حذف النسخ القديمة (أكثر من 30 يوم)
find $BACKUP_DIR -name "qortoba_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: qortoba_backup_$DATE.sql.gz"
```

```bash
# جعل السكريبت قابل للتنفيذ
chmod +x /home/user/backup-qortoba.sh

# جدولة النسخ الاحتياطية (يومياً الساعة 2 صباحاً)
crontab -e
# إضافة السطر التالي:
0 2 * * * /home/user/backup-qortoba.sh
```

## 🔧 استكشاف الأخطاء

### مشاكل شائعة وحلولها

**مشكلة**: خطأ في الاتصال بقاعدة البيانات
```bash
# التحقق من حالة PostgreSQL
sudo systemctl status postgresql

# اختبار الاتصال
psql -U qortoba_user -d qortoba_supplies -c "SELECT 1;"
```

**مشكلة**: المنفذ مشغول
```bash
# العثور على العملية
sudo lsof -i :5000

# إنهاء العملية
sudo kill -9 [PID]
```

**مشكلة**: مشاكل في الذاكرة
```bash
# فحص استخدام الذاكرة
free -h

# إعادة تشغيل التطبيق
pm2 restart qortoba-supplies
```

## 📱 اختبار النشر

### قائمة فحص ما بعد النشر
- [ ] الموقع يفتح بنجاح
- [ ] تسجيل الدخول يعمل
- [ ] إنشاء طلب عرض أسعار جديد
- [ ] استيراد البيانات من Excel
- [ ] تسعير الموردين والعملاء
- [ ] إنشاء أمر شراء
- [ ] النسخ الاحتياطية تعمل
- [ ] السجلات تُسجل بشكل صحيح

## 🆘 الدعم الفني

### معلومات مهمة للدعم
- إصدار Node.js: `node --version`
- إصدار PostgreSQL: `psql --version`
- حالة الخدمات: `pm2 status`
- مساحة القرص: `df -h`
- الذاكرة: `free -h`

### سجلات مهمة للفحص
```bash
# سجلات التطبيق
pm2 logs qortoba-supplies

# سجلات PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log

# سجلات النظام
journalctl -f
```

## ✅ مراحل النشر المكتملة

بعد إكمال جميع الخطوات أعلاه، يجب أن يكون لديك:

1. ✅ تطبيق قرطبة للتوريدات يعمل على الخادم الخارجي
2. ✅ قاعدة بيانات PostgreSQL محلية آمنة
3. ✅ نقل جميع البيانات من Replit
4. ✅ إعداد النسخ الاحتياطية التلقائية
5. ✅ مراقبة النظام والأداء
6. ✅ إعدادات الأمان والحماية

المشروع الآن جاهز للاستخدام في بيئة الإنتاج! 🎉