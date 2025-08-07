# دليل الوصول الخارجي - قرطبة للتوريدات
## حل مشكلة ERR_CONNECTION_RESET والوصول العالمي

---

## 🎯 المشكلة
بعد النشر الناجح على RDP Server `216.250.252.104`، التطبيق يعمل محلياً لكن الوصول الخارجي محجوب بسبب:
- Router Port Blocking
- ISP (مزود الخدمة) يحجب البورتات غير المعيارية
- إعدادات جدار الحماية
- مشاكل الشبكة

---

## 🛠️ الحلول المتاحة

### **1. إصلاح سريع (الأولوية)**
```bash
# شغل على السيرفر
QUICK_FIX_CONNECTION.bat
```
**ما يفعله:**
- إعادة تكوين جدار الحماية
- تحسين إعدادات الشبكة
- إنشاء server محسّن مع CORS متقدم
- Port forwarding محلي

### **2. تشخيص شامل**
```bash
# للمشاكل المعقدة
NETWORK_DIAGNOSTIC.bat
```
**ما يفعله:**
- فحص شامل للبورتات والخدمات
- تحليل مشاكل Router/ISP
- إنشاء Reverse Proxy على البورت 8000
- إرشادات تفصيلية للحل

### **3. Cloudflare Tunnel (موصى به)**
```bash
# حل نهائي مجاني
CLOUDFLARE_QORTOBA_TUNNEL.bat
```
**المميزات:**
- ✅ مجاني تماماً
- ✅ بدون حدود زمنية
- ✅ HTTPS تلقائي
- ✅ URLs عشوائية أو domains مخصصة
- ✅ يتجاوز جميع حواجز الشبكة

### **4. Ngrok Tunnel (للاستخدام المتقدم)**
```bash
# يتطلب تسجيل اختياري
SETUP_NGROK_SERVER.bat
```
**المميزات:**
- URLs ثابتة مع الحساب المدفوع
- Dashboard متقدم
- محدود 8 ساعات بدون تسجيل

---

## 🚀 التشغيل السريع

### **الطريقة الأسرع:**
1. شغل `START_RDP_SERVER_216.250.252.104.bat`
2. إذا ظهر ERR_CONNECTION_RESET:
3. شغل `CLOUDFLARE_QORTOBA_TUNNEL.bat`
4. اختر "سريع مؤقت"
5. احصل على URL مثل: `https://abc123.trycloudflare.com`

### **للاستخدام المستمر:**
1. أنشئ حساب مجاني في [Cloudflare](https://cloudflare.com)
2. أضف domain (مجاني من Freenom أو استخدم subdomain)
3. شغل `CLOUDFLARE_QORTOBA_TUNNEL.bat`
4. اختر "مُعدّ مسبقاً"
5. احصل على URLs ثابتة

---

## 🔗 عناوين الخدمات

### **الوصول المحلي (RDP Server)**
- **التطبيق:** `http://localhost:5000`
- **المراقبة:** `http://localhost:8080`
- **Webhook:** `http://localhost:9000`
- **SSH:** `localhost:22`

### **الوصول الداخلي (الشبكة المحلية)**
- **التطبيق:** `http://216.250.252.104:5000`
- **المراقبة:** `http://216.250.252.104:8080`
- **Webhook:** `http://216.250.252.104:9000`
- **SSH:** `216.250.252.104:22`

### **الوصول الخارجي (عبر Tunnels)**
- **Cloudflare مؤقت:** `https://random.trycloudflare.com`
- **Cloudflare ثابت:** `https://qortoba.yourdomain.com`
- **Ngrok:** `https://qortoba-server.ngrok.io`

---

## 🎛️ أدوات الإدارة

### **التشغيل والإدارة:**
- `START_RDP_SERVER_216.250.252.104.bat` - تشغيل ذكي مع اختبارات
- `SERVER_MANAGEMENT_216.250.252.104.bat` - إدارة شاملة
- `QUICK_SERVER_CHECK_216.250.252.104.bat` - فحص سريع

### **تشخيص وإصلاح:**
- `QUICK_FIX_CONNECTION.bat` - إصلاح فوري
- `NETWORK_DIAGNOSTIC.bat` - تشخيص شامل
- `check-tunnel-status.bat` - حالة Tunnels

### **الوصول الخارجي:**
- `CLOUDFLARE_QORTOBA_TUNNEL.bat` - Cloudflare setup
- `SETUP_NGROK_SERVER.bat` - Ngrok setup
- `start-qortoba-quick-tunnel.bat` - تشغيل سريع

---

## 🔧 استكشاف الأخطاء

### **مشكلة: التطبيق لا يعمل محلياً**
```bash
# فحص العمليات
tasklist | findstr node.exe
netstat -an | findstr :5000

# إعادة التشغيل
START_RDP_SERVER_216.250.252.104.bat
```

### **مشكلة: يعمل محلياً لكن ليس خارجياً**
```bash
# إصلاح سريع
QUICK_FIX_CONNECTION.bat

# أو استخدم Tunnel
CLOUDFLARE_QORTOBA_TUNNEL.bat
```

### **مشكلة: Tunnel لا يعمل**
```bash
# فحص الاتصال
ping cloudflare.com
ping ngrok.com

# إعادة تحميل
del cloudflared.exe
del ngrok.exe
# ثم أعد تشغيل السكريبت
```

---

## 🔐 الأمان

### **SSH للـ Replit Agent:**
```
Host: 216.250.252.104 أو tunnel-ssh-url
Port: 22
User: Administrator (أو اسم المستخدم)
Key: ~/.ssh/id_rsa (مولد تلقائياً)
```

### **Webhook للتحديثات:**
```
GitHub Webhook URL: http://tunnel-url:9000/webhook/github
Secret: (اختياري)
Events: push, pull_request
```

---

## 📊 المراقبة

### **Health Checks:**
- `/api/health` - صحة التطبيق
- `/api/status` - حالة الخدمات
- `:8080` - Dashboard المراقبة

### **Logs:**
- PM2: `pm2 logs`
- Windows Events: Event Viewer
- Tunnel: في نوافذ التشغيل

---

## 🌍 الاستخدام العالمي

### **للعمل من أي مكان:**
1. شغل Cloudflare Tunnel على السيرفر
2. احصل على URL العام
3. شاركه مع الفريق
4. يمكن الوصول من أي جهاز/مكان

### **للتطوير عن بُعد:**
1. استخدم SSH tunnel للاتصال الآمن
2. أو استخدم Webhook للتحديثات التلقائية
3. مراقبة مستمرة عبر Dashboard

---

## 📞 الدعم الفني

### **إذا واجهت مشاكل:**
1. شغل `NETWORK_DIAGNOSTIC.bat` للتشخيص التلقائي
2. راجع logs في نوافذ التشغيل
3. تأكد من اتصال الإنترنت
4. جرب طريقة مختلفة (Cloudflare بدلاً من Ngrok)

### **للمساعدة المتقدمة:**
- فحص Router Port Forwarding
- تواصل مع مزود الخدمة لفتح البورتات
- استخدام VPN كحل مؤقت

---

## ✅ قائمة التحقق

### **قبل البدء:**
- [ ] التطبيق يعمل على `localhost:5000`
- [ ] جدار الحماية مُكوّن صحيح
- [ ] اتصال إنترنت مستقر

### **بعد الإعداد:**
- [ ] Tunnel يعمل ويظهر URL
- [ ] يمكن الوصول للتطبيق خارجياً
- [ ] SSH يعمل للـ Replit Agent
- [ ] Webhook يستقبل التحديثات

### **للاستخدام المستمر:**
- [ ] URLs محفوظة ومشاركة
- [ ] Tunnels تعمل تلقائياً عند بدء التشغيل
- [ ] نظام مراقبة فعّال
- [ ] نسخ احتياطي منتظم

---

*آخر تحديث: أغسطس 2025*
*النسخة: 2.0 - RDP Server Integration*