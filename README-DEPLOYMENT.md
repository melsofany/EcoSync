# 🚀 دليل نشر مشروع قرطبة للتوريدات على خادم خارجي

## 📋 نظرة عامة

مشروع قرطبة للتوريدات هو نظام إدارة شامل للتوريدات مبني بتقنيات حديثة:
- **الواجهة الأمامية**: React + TypeScript + Vite
- **الخادم الخلفي**: Node.js + Express + TypeScript  
- **قاعدة البيانات**: PostgreSQL
- **واجهة المستخدم**: Tailwind CSS + Shadcn/ui
- **الدعم**: العربية RTL + دعم كامل للأرقام العربية

## 🎯 خيارات النشر

### 1. النشر التقليدي (موصى به للمبتدئين)
```bash
# تحميل المشروع وتشغيل سكريبت النشر
./deploy.sh production
```

### 2. النشر باستخدام Docker (موصى به للخبراء)
```bash
# تشغيل المشروع بالكامل مع قاعدة البيانات
docker-compose -f docker-deployment.yml up -d
```

### 3. النشر اليدوي (مفصل)
راجع `SERVER_DEPLOYMENT_GUIDE.md` للخطوات المفصلة

## ⚡ النشر السريع (5 دقائق)

### المتطلبات الأساسية
- خادم Linux/Windows مع Node.js 18+
- PostgreSQL 13+
- 2GB RAM على الأقل
- 10GB مساحة تخزين

### الخطوات
1. **تحميل المشروع**
   ```bash
   # من GitHub أو رفع ملف ZIP
   git clone [repository-url]
   cd qortoba-supplies
   ```

2. **إعداد قاعدة البيانات**
   ```sql
   CREATE DATABASE qortoba_supplies;
   CREATE USER qortoba_user WITH PASSWORD 'StrongPassword123!';
   GRANT ALL PRIVILEGES ON DATABASE qortoba_supplies TO qortoba_user;
   ```

3. **إعداد المتغيرات**
   ```bash
   cp .env.production.example .env
   # عدل .env بإعداداتك
   ```

4. **تشغيل النشر**
   ```bash
   ./deploy.sh production
   ```

5. **فتح الموقع**
   ```
   http://your-server-ip:5000
   ```

## 🐳 النشر باستخدام Docker

### إعداد سريع
```bash
# إنشاء ملف البيئة
cp .env.production.example .env

# تشغيل جميع الخدمات
docker-compose -f docker-deployment.yml up -d

# مراقبة السجلات
docker-compose -f docker-deployment.yml logs -f
```

### الخدمات المتضمنة
- **qortoba-app**: التطبيق الرئيسي (منفذ 5000)
- **postgres**: قاعدة البيانات (منفذ 5432)
- **nginx**: خادم الويب (منفذ 80/443)

## 📊 نقل البيانات من Replit

### 1. تصدير البيانات
1. سجل دخول كمسؤول تقنية في Replit
2. اذهب إلى الإدارة → إدارة البيانات
3. "إنشاء نسخة احتياطية كاملة"
4. حمل ملف `.sql`

### 2. استيراد البيانات
```bash
# نسخ الملف إلى الخادم
scp backup-file.sql user@server:/path/to/project/

# استيراد البيانات
psql -U qortoba_user -d qortoba_supplies -f backup-file.sql
```

## 🔧 إعداد الإنتاج

### PM2 (إدارة العمليات)
```bash
npm install -g pm2
pm2 start npm --name "qortoba-supplies" -- start
pm2 save
pm2 startup
```

### Nginx (Reverse Proxy)
```bash
# تثبيت Nginx
sudo apt install nginx

# نسخ إعدادات Nginx
sudo cp nginx.conf /etc/nginx/sites-available/qortoba-supplies
sudo ln -s /etc/nginx/sites-available/qortoba-supplies /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

### SSL/HTTPS (اختياري)
```bash
# استخدام Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 🔒 الأمان

### Firewall
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### قاعدة البيانات
```bash
# تأمين PostgreSQL
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'new_password';"
```

## 📋 المراقبة والصيانة

### النسخ الاحتياطية التلقائية
```bash
# إعداد cron job
crontab -e

# إضافة: نسخة احتياطية يومية الساعة 2 صباحاً
0 2 * * * /path/to/backup-script.sh
```

### مراقبة الأداء
```bash
# مراقبة PM2
pm2 monit

# فحص الموارد
htop
df -h
free -h
```

### السجلات
```bash
# سجلات التطبيق
pm2 logs qortoba-supplies

# سجلات قاعدة البيانات
sudo tail -f /var/log/postgresql/postgresql-*.log

# سجلات النظام
journalctl -f
```

## 🧪 اختبار النشر

### قائمة الفحص الأساسية
- [ ] الموقع يفتح بنجاح
- [ ] تسجيل الدخول يعمل  
- [ ] إنشاء طلب عرض أسعار
- [ ] استيراد Excel
- [ ] تسعير الموردين والعملاء
- [ ] إنشاء أمر شراء

### اختبار الأداء
```bash
# اختبار قاعدة البيانات
node test-db.js

# اختبار الخادم
curl -f http://localhost:5000/api/health
```

## 🆘 استكشاف الأخطاء

### مشاكل شائعة

**خطأ اتصال قاعدة البيانات**
```bash
# فحص PostgreSQL
sudo systemctl status postgresql

# اختبار الاتصال
psql -U qortoba_user -d qortoba_supplies -c "SELECT 1;"
```

**المنفذ مشغول**
```bash
# العثور على العملية
sudo lsof -i :5000

# إنهاء العملية
sudo kill -9 [PID]
```

**خطأ في البناء**
```bash
# تنظيف node_modules
rm -rf node_modules package-lock.json
npm install

# إعادة البناء
npm run build
```

### سجلات مفيدة
```bash
# سجلات التطبيق المفصلة
pm2 logs qortoba-supplies --lines 100

# سجلات خطأ PostgreSQL
sudo tail -n 50 /var/log/postgresql/postgresql-*.log

# سجلات النظام الأخيرة
journalctl -u qortoba-supplies -n 50
```

## 📚 وثائق إضافية

- `production-deployment-package.md` - دليل النشر الشامل
- `SERVER_DEPLOYMENT_GUIDE.md` - دليل النشر على خادم Linux
- `RDP_DEPLOYMENT_GUIDE.md` - دليل النشر على Windows
- `DEPLOYMENT_CHECKLIST.md` - قائمة التحقق المفصلة
- `docker-deployment.yml` - إعداد Docker Compose
- `Dockerfile` - ملف Docker للتطبيق

## 🎉 إكمال النشر

عند إكمال جميع الخطوات:

1. ✅ التطبيق يعمل على الخادم الخارجي
2. ✅ قاعدة البيانات محلية وآمنة  
3. ✅ البيانات منقولة من Replit
4. ✅ النسخ الاحتياطية مُعدة
5. ✅ المراقبة والأمان مُفعلة

**مبروك! مشروع قرطبة للتوريدات جاهز للاستخدام في بيئة الإنتاج** 🎊

## 📞 الدعم الفني

للمساعدة في حل المشاكل، قم بجمع هذه المعلومات:
- إصدار Node.js: `node --version`
- إصدار PostgreSQL: `psql --version`  
- حالة الخدمات: `pm2 status`
- استخدام الموارد: `free -h` و `df -h`
- آخر 50 سطر من السجلات: `pm2 logs qortoba-supplies --lines 50`