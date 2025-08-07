# إعداد DNS لدومين cor-toba.online
## دليل إضافة قرطبة للتوريدات إلى Cloudflare

---

## 📋 المعلومات الحالية

- **Domain:** `cor-toba.online`
- **Tunnel ID:** `0c7982bb-a61f-43f0-8b7c-b9fdddd96a69`
- **Nameservers:** `liz.ns.cloudflare.com` و `major.ns.cloudflare.com`
- **RDP موجود:** `rdp.cor-toba.online` ✅

---

## 🎯 الهدف

إضافة تطبيق قرطبة للتوريدات إلى نفس الـ domain مع الحفاظ على RDP الحالي.

---

## 📝 DNS Records المطلوب إضافتها

### في Cloudflare Dashboard:

#### 1. التطبيق الرئيسي
```
Type: CNAME
Name: app
Content: 0c7982bb-a61f-43f0-8b7c-b9fdddd96a69.cfargotunnel.com
Proxy Status: Proxied
TTL: Auto
```
**النتيجة:** `https://app.cor-toba.online`

#### 2. الموقع (www)
```
Type: CNAME  
Name: www
Content: 0c7982bb-a61f-43f0-8b7c-b9fdddd96a69.cfargotunnel.com
Proxy Status: Proxied
TTL: Auto
```
**النتيجة:** `https://www.cor-toba.online`

#### 3. SSH للـ Replit Agent
```
Type: CNAME
Name: ssh
Content: 0c7982bb-a61f-43f0-8b7c-b9fdddd96a69.cfargotunnel.com
Proxy Status: DNS Only (Gray Cloud)
TTL: Auto
```
**النتيجة:** `ssh.cor-toba.online:22`

#### 4. Webhook لـ GitHub
```
Type: CNAME
Name: webhook
Content: 0c7982bb-a61f-43f0-8b7c-b9fdddd96a69.cfargotunnel.com
Proxy Status: Proxied
TTL: Auto
```
**النتيجة:** `https://webhook.cor-toba.online`

#### 5. مراقبة النظام
```
Type: CNAME
Name: monitor
Content: 0c7982bb-a61f-43f0-8b7c-b9fdddd96a69.cfargotunnel.com
Proxy Status: Proxied
TTL: Auto
```
**النتيجة:** `https://monitor.cor-toba.online`

#### 6. API Access
```
Type: CNAME
Name: api
Content: 0c7982bb-a61f-43f0-8b7c-b9fdddd96a69.cfargotunnel.com
Proxy Status: Proxied
TTL: Auto
```
**النتيجة:** `https://api.cor-toba.online`

---

## 🛠️ خطوات التنفيذ

### الخطوة 1: إضافة DNS Records
1. اذهب إلى [Cloudflare Dashboard](https://dash.cloudflare.com)
2. اختر domain `cor-toba.online`
3. اذهب إلى **DNS** > **Records**
4. أضف كل record من القائمة أعلاه باستخدام **Add record**

### الخطوة 2: تحديث ملف إعدادات Tunnel
```yaml
tunnel: 0c7982bb-a61f-43f0-8b7c-b9fdddd96a69
credentials-file: C:\Users\Administrator\.cloudflared\0c7982bb-a61f-43f0-8b7c-b9fdddd96a69.json

ingress:
  # RDP Access (existing)
  - hostname: rdp.cor-toba.online
    service: rdp://localhost:3389

  # Qortoba Main Application
  - hostname: app.cor-toba.online
    service: http://localhost:5000

  # Website (www)
  - hostname: www.cor-toba.online
    service: http://localhost:5000

  # SSH Access
  - hostname: ssh.cor-toba.online
    service: ssh://localhost:22

  # Webhook Handler
  - hostname: webhook.cor-toba.online
    service: http://localhost:9000

  # Monitoring
  - hostname: monitor.cor-toba.online
    service: http://localhost:8080

  # API Access
  - hostname: api.cor-toba.online
    service: http://localhost:5000
    path: /api/*

  # Catch-all
  - service: http_status:404
```

### الخطوة 3: تشغيل Tunnel المحدّث
```bash
# على السيرفر RDP
cd C:\QortobaServer
start-updated-tunnel.bat
```

---

## 🔍 التحقق من النتائج

### اختبار DNS Propagation:
```bash
# في Command Prompt أو PowerShell
nslookup app.cor-toba.online
nslookup www.cor-toba.online
nslookup webhook.cor-toba.online
```

### اختبار الخدمات:
- **التطبيق:** https://app.cor-toba.online
- **الموقع:** https://www.cor-toba.online
- **RDP:** rdp.cor-toba.online (موجود)
- **Webhook:** https://webhook.cor-toba.online
- **مراقبة:** https://monitor.cor-toba.online
- **API:** https://api.cor-toba.online/api/health

---

## 📊 الشكل النهائي للـ DNS Records

بعد الإضافة، ستكون DNS records كالتالي:

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| CNAME | cor-toba.online | 0c7982bb...cfargotunnel.com | Proxied | Auto |
| CNAME | app | 0c7982bb...cfargotunnel.com | Proxied | Auto |
| CNAME | www | 0c7982bb...cfargotunnel.com | Proxied | Auto |
| CNAME | ssh | 0c7982bb...cfargotunnel.com | DNS Only | Auto |
| CNAME | webhook | 0c7982bb...cfargotunnel.com | Proxied | Auto |
| CNAME | monitor | 0c7982bb...cfargotunnel.com | Proxied | Auto |
| CNAME | api | 0c7982bb...cfargotunnel.com | Proxied | Auto |

---

## 🔧 استكشاف الأخطاء

### مشكلة: DNS لا يعمل
```bash
# انتظر 5-10 دقائق للانتشار
# تحقق من صحة Records في Cloudflare
# استخدم DNS Checker: https://dnschecker.org
```

### مشكلة: Tunnel لا يستجيب
```bash
# تأكد من تشغيل التطبيق على البورت الصحيح
netstat -an | findstr :5000

# تحقق من حالة Tunnel
cloudflared tunnel info 0c7982bb-a61f-43f0-8b7c-b9fdddd96a69
```

### مشكلة: SSL/HTTPS لا يعمل
- تأكد من تفعيل Proxy (Orange Cloud) للـ records
- انتظر بضع دقائق لإنشاء SSL certificates

---

## 📱 للاستخدام المتنقل

### GitHub Webhook Setup:
```
Payload URL: https://webhook.cor-toba.online/webhook/github
Content Type: application/json
Secret: (اختياري)
Events: Just the push event
```

### SSH Config للـ Replit Agent:
```
Host: ssh.cor-toba.online
Port: 22
User: Administrator
IdentityFile: ~/.ssh/id_rsa
```

---

## ✅ قائمة التحقق النهائية

- [ ] DNS Records تم إضافتها في Cloudflare
- [ ] تطبيق قرطبة يعمل على البورت 5000
- [ ] Tunnel تم تشغيله بالإعدادات الجديدة
- [ ] جميع URLs تستجيب بنجاح
- [ ] HTTPS يعمل تلقائياً
- [ ] SSH accessible للـ Replit Agent
- [ ] Webhook يستقبل من GitHub
- [ ] RDP tunnel الأصلي لا يزال يعمل

---

*تاريخ الإنشاء: أغسطس 2025*
*المطور: نظام قرطبة للتوريدات*