# دليل تشغيل مشروع قرطبة للتوريدات على الخادم

## متطلبات الخادم

### البرامج المطلوبة:
1. **Node.js** (الإصدار 18 أو أحدث)
2. **PostgreSQL** (الإصدار 13 أو أحدث)
3. **Git** (لنسخ المشروع)

## خطوات التثبيت

### 1. تثبيت Node.js
```bash
# تحميل Node.js من الموقع الرسمي
https://nodejs.org/
# أو استخدام مدير الحزم
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. تثبيت PostgreSQL
```bash
# على Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# على Windows - تحميل من الموقع الرسمي
https://www.postgresql.org/download/windows/
```

### 3. إعداد قاعدة البيانات
```sql
-- تسجيل الدخول إلى PostgreSQL
sudo -u postgres psql

-- إنشاء قاعدة بيانات جديدة
CREATE DATABASE qortoba_supplies;

-- إنشاء مستخدم جديد
CREATE USER qortoba_user WITH PASSWORD 'your_strong_password';

-- منح الصلاحيات
GRANT ALL PRIVILEGES ON DATABASE qortoba_supplies TO qortoba_user;

-- الخروج
\q
```

### 4. نسخ المشروع
```bash
# نسخ المشروع من Replit أو رفع الملفات يدوياً
# إذا كان لديك Git repository:
git clone [repository-url]
cd qortoba-supplies

# أو رفع الملفات مباشرة من Replit
```

### 5. تثبيت الحزم
```bash
# تثبيت جميع الحزم المطلوبة
npm install
```

### 6. إعداد متغيرات البيئة
```bash
# إنشاء ملف .env
touch .env

# إضافة المتغيرات التالية:
DATABASE_URL=postgresql://qortoba_user:your_strong_password@localhost:5432/qortoba_supplies
SESSION_SECRET=your_session_secret_key_here
NODE_ENV=production
PORT=5000

# إذا كنت تستخدم DeepSeek AI للكشف عن المكررات
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

### 7. إعداد قاعدة البيانات
```bash
# تشغيل المشروع لأول مرة لإنشاء الجداول
npm run dev

# أو تشغيل الإنتاج
npm start
```

## إعداد تشغيل المشروع كخدمة (Service)

### 1. إنشاء ملف Systemd Service (على Linux)
```bash
sudo nano /etc/systemd/system/qortoba-supplies.service
```

```ini
[Unit]
Description=Qortoba Supplies Management System
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/path/to/your/project
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 2. تفعيل الخدمة
```bash
sudo systemctl daemon-reload
sudo systemctl enable qortoba-supplies
sudo systemctl start qortoba-supplies

# للتحقق من حالة الخدمة
sudo systemctl status qortoba-supplies
```

## إعداد Nginx كـ Reverse Proxy

### 1. تثبيت Nginx
```bash
sudo apt install nginx
```

### 2. إعداد Nginx
```bash
sudo nano /etc/nginx/sites-available/qortoba-supplies
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

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
    }
}
```

### 3. تفعيل الإعداد
```bash
sudo ln -s /etc/nginx/sites-available/qortoba-supplies /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## نسخ البيانات من Replit

### 1. تصدير البيانات من Replit
- سجل دخول كمسؤول تقنية
- اذهب إلى صفحة الإدارة → إدارة البيانات
- اضغط على "إنشاء نسخة احتياطية كاملة"
- حمل الملف .sql

### 2. استيراد البيانات إلى الخادم
```bash
# نسخ الملف إلى الخادم
scp backup-file.sql user@server:/path/to/project/

# استيراد البيانات
psql -U qortoba_user -d qortoba_supplies -f backup-file.sql
```

## مراقبة المشروع

### 1. تثبيت PM2 (مدير العمليات)
```bash
npm install -g pm2

# تشغيل المشروع
pm2 start server/index.js --name "qortoba-supplies"

# حفظ الإعداد للبدء التلقائي
pm2 save
pm2 startup
```

### 2. مراقبة الأداء
```bash
# عرض حالة التطبيق
pm2 status

# عرض السجلات
pm2 logs qortoba-supplies

# إعادة تشغيل
pm2 restart qortoba-supplies
```

## الأمان

### 1. إعداد Firewall
```bash
# السماح بالمنافذ المطلوبة فقط
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 2. تحديث كلمات المرور
- قم بتغيير كلمة مرور قاعدة البيانات
- قم بتغيير SESSION_SECRET
- تأكد من استخدام HTTPS في الإنتاج

## النسخ الاحتياطي التلقائي

### إنشاء سكريبت للنسخ الاحتياطي
```bash
#!/bin/bash
# /home/user/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/user/backups"
DB_NAME="qortoba_supplies"
DB_USER="qortoba_user"

mkdir -p $BACKUP_DIR

# نسخة احتياطية لقاعدة البيانات
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# حذف النسخ القديمة (أكثر من 30 يوم)
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql"
```

### جدولة النسخ الاحتياطي
```bash
# تحرير crontab
crontab -e

# إضافة مهمة يومية في الساعة 2 صباحاً
0 2 * * * /home/user/backup.sh
```

## استكشاف الأخطاء

### مشاكل شائعة:
1. **خطأ في الاتصال بقاعدة البيانات**: تحقق من DATABASE_URL
2. **المنفذ مشغول**: تغيير PORT في .env
3. **خطأ في الصلاحيات**: تحقق من صلاحيات المستخدم لقاعدة البيانات

### فحص السجلات:
```bash
# سجلات PM2
pm2 logs qortoba-supplies

# سجلات النظام
journalctl -u qortoba-supplies -f
```

## ملاحظات هامة

1. **النسخ الاحتياطية**: اعمل نسخة احتياطية يومية لقاعدة البيانات
2. **التحديثات**: راقب تحديثات Node.js و PostgreSQL
3. **الأمان**: استخدم HTTPS في الإنتاج
4. **المراقبة**: راقب استخدام الموارد والأداء

## الدعم الفني

في حالة وجود مشاكل:
1. تحقق من سجلات التطبيق
2. تحقق من حالة قاعدة البيانات
3. تحقق من إعدادات الشبكة
4. راجع متغيرات البيئة