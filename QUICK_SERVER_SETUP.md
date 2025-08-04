# تشغيل مشروع قرطبة على خادم RDP - التعليمات السريعة

## الخطوات الأساسية

### 1. تحضير الخادم
```bash
# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# تثبيت PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# تثبيت PM2 لإدارة التطبيق
npm install -g pm2
```

### 2. إعداد قاعدة البيانات
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE qortoba_supplies;
CREATE USER qortoba_user WITH PASSWORD 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON DATABASE qortoba_supplies TO qortoba_user;
\q
```

### 3. نسخ المشروع
```bash
# إنشاء مجلد للمشروع
mkdir /home/qortoba-supplies
cd /home/qortoba-supplies

# نسخ جميع ملفات المشروع من Replit إلى هنا
# (يمكنك استخدام WinSCP أو FileZilla لنسخ الملفات)
```

### 4. إعداد متغيرات البيئة
```bash
# إنشاء ملف .env
nano .env
```

أضف هذا المحتوى:
```
DATABASE_URL=postgresql://qortoba_user:YourStrongPassword123!@localhost:5432/qortoba_supplies
SESSION_SECRET=your-very-long-random-secret-key-here-make-it-complex
NODE_ENV=production
PORT=5000
DEEPSEEK_API_KEY=your-deepseek-api-key-if-needed
```

### 5. تثبيت وتشغيل المشروع
```bash
# تثبيت الحزم
npm install

# بناء المشروع
npm run build

# تشغيل المشروع بـ PM2
pm2 start dist/index.js --name "qortoba-supplies"

# حفظ الإعداد للتشغيل التلقائي
pm2 save
pm2 startup
```

### 6. نسخ البيانات من Replit
1. في Replit، سجل دخول كمسؤول تقنية
2. اذهب إلى صفحة الإدارة
3. اضغط على "إنشاء نسخة احتياطية كاملة"
4. حمل الملف .sql
5. انسخه إلى الخادم واستورده:

```bash
# استيراد النسخة الاحتياطية
psql -U qortoba_user -d qortoba_supplies -f backup-file.sql
```

### 7. إعداد Nginx (اختياري للمنفذ 80)
```bash
sudo apt install nginx

# إنشاء إعداد الموقع
sudo nano /etc/nginx/sites-available/qortoba
```

أضف هذا المحتوى:
```nginx
server {
    listen 80;
    server_name your-server-ip;

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

```bash
# تفعيل الإعداد
sudo ln -s /etc/nginx/sites-available/qortoba /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. الوصول للمشروع
- مباشرة على المنفذ 5000: `http://your-server-ip:5000`
- عبر Nginx على المنفذ 80: `http://your-server-ip`

## أوامر مفيدة

```bash
# مراقبة التطبيق
pm2 status
pm2 logs qortoba-supplies

# إعادة تشغيل التطبيق
pm2 restart qortoba-supplies

# إيقاف التطبيق
pm2 stop qortoba-supplies

# فحص قاعدة البيانات
psql -U qortoba_user -d qortoba_supplies -c "SELECT COUNT(*) FROM users;"
```

## في حالة المشاكل

1. **التطبيق لا يعمل**: `pm2 logs qortoba-supplies`
2. **خطأ في قاعدة البيانات**: تحقق من DATABASE_URL في .env
3. **لا يمكن الوصول**: تحقق من الـ firewall والمنافذ

```bash
# فتح المنافذ المطلوبة
sudo ufw allow 5000
sudo ufw allow 80
sudo ufw enable
```

## ملاحظات مهمة

- احتفظ بنسخة احتياطية من .env
- قم بتغيير كلمات المرور الافتراضية
- راقب سجلات التطبيق بانتظام
- اعمل نسخة احتياطية يومية من قاعدة البيانات

```bash
# نسخة احتياطية سريعة
pg_dump -U qortoba_user -h localhost qortoba_supplies > backup_$(date +%Y%m%d).sql
```