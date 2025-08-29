# متغيرات البيئة المطلوبة لـ Railway

## المتغيرات الأساسية المطلوبة

قم بإضافة هذه المتغيرات في Railway Settings > Variables:

### 1. Google Sheets Configuration
```
GOOGLE_SHEETS_ID=1KWqy1Rw-1jIBOK0lQrBfqzQlZKzZN6GrKl4BF2LyOKw
GOOGLE_SERVICE_ACCOUNT_BASE64=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAiY29ydG9iYS1zdXBwLXN5cyIsCiAgInByaXZhdGVfa2V5X2lkIjogIjkzZWEzZTViY2FkMjNiZWU5OTMzZWU0OGE1YmNhYjk3MDU4NDlhMGMiLAogICJwcml2YXRlX2tleSI6ICItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRQ3g3eWxaQkplSHdsUENcbjQxT0pPakhEOG5VZG12L09PUllMSzJ3MVg3WHc4QURHMVpNclNMWmxmTkdYanhqQjBpSnZ2MWVUMVlheTRHSWZcbnNSaTR2Qm9xY1EvaVZZeCtKRlQxbHFNSW1hR2hjYzdsRVRvN2c0MkV2Sjl6RTF5cUdKTlVLMThYUW5NSVN5RHhcbm16TmsxR0ltcHlTZGpZemN1Z0lGbW1FRzN0cytHWWErZldraE5rVW9JTzBwTFFHOVJScXI1S1lmc1U4dXpOSmpcbkZDUTd1OE5LcEdjUEJnSXRIY3ZDbE1vSllxaDJBZUFHcGZ3emRlQ3l3UVRhd2pUL09aaXFzTWc0c0htM2tKL09cblFxMU83MmMwT1k5aHhBM0kwN2pvazdXTnl4azBMNXp5WnJDNEN1WUJwd2swVGNzQlIrWXRuSHU1NWFycUFhQ3JcbjgwSlBCakhQQWdNQkFBRUNnZ0VBTTF2Ulp2amMxaHBBdkJXS3BLYnYrMXVOODJ3c1h2VjZSK0lTT3p1emsrWnFcbml2blZuMTQvQzM4aUxpbG5IM2JNYXMzamRPL2lqOW9WYUlsaEZkMXhmZ09oYnBaNzFXTWVSTDdrc3hSSkk0VHFcbmo1TFA2S0s1by9FZjR3TFpNZDJqRk4zcDloZy9oTXJPcVA0L3NPQmVya0o3WHFDZllveXNEYnI0TzVmeTEzTGhcbnUzNDhodzI5TEswNmhmenZoclFZeWN6RXRGTm11WVBPMkNiS0xQTkZxSytVenN5ckNnYTFMSU02V0ZJWWhVc1pcbmdOWklUNUtoczhrNC9sSDNzMW9QNDZKMzdTQmswSXNOUUlHeDhOWkNKdFp2OG9ydUNITkNIeU1uY2Qyemh2MmdcbkhMWjUxMEljcERiUDlicTVWdDBDbTRKVUdGQ3V6ME8zVTdWcC9vYmhuUUtCZ1FEdmVXM2R5RkJJckVtc3Z4TE5cbkxuZFc1ZmFYeE8xWG4xaXNhUDdzNFVTQ1gzTjYrMXpCWEJQVUVIcWU1M2ZGUVFzczNWeXRwWXduOURTcUVxRG9cbkhnbE95K0RvVnhlSEdOU3NYUjIvOFRnNE1USlZXWldSVlB4a09icFN1aEZnN1VLTDVqSzlpUVpYREdQT2I3TzlcbnVxVG5DZGJ6TGV0d1ljOFg5VGkrZi81L0RRS0JnUUMrTm85ejQrODROT3Z2TVRrWjc2d21Bd0xVVkhHdlMxL3NcbnlVdEZIc0JnNTZmYndlYWcxT213TW5IOHNWczFSNzFDMS90bXRvYlorQ2MxOVJ1cDJSNkxGenZTS2dKUlZTMHZcbmgwV01zc01TbXJ2V0hETGo0WnlGZjU4WS9XZld3Z1dHd1NkU29UNjlKRzdkYUs2Ym1LRWZhTWN1MnBTL29hQTRcbkU5VmNwcnlkU3dLQmdIdTV2UzNOQk0zSFZmbE9ieVJiVVlVd0l3dWV6eEZxWHFJVlRVQ04wcHVaUFV6WStiOWRcbkYxR0ZnaFQvZWo0THNQNXBFQzBYVHlhRllZQk5SNTBsaDZHU2JJMGVFaVhXaW1yVFlUOStIWkhLdVRxbm9rTUlcbkthNk90Tmx4RVBHSEk4NnNES01vWElJMUFJdno0bVd3UE9xeGhzRDFoS0wzcGN1M0FxNUo2dTh4QW9HQkFJN3ZcbnNSMEZTOTZRNWpyNFlsQjdLb0htQVZwTm1xQi9vN1hzRGdRQzk4M2FSdWw4N0RJdnpPdjYvRzFIV2FMUUpnajFcbkJKWkswMHM0ano2YzBnendlMk5LTWtuY0I2SFd2LzNYU1F4UnlRVlNBWlVEMjdvaTc5dmg2MHg4SUd2aG9RV0NcbllHcFhnUzNoRXU2T202ZVJLb0xQMmQzN280dmRpT2lhL3RxQThYdkJBb0dBVHRmTkpJL1dEdUxqekdIRjRkRDdcblQxOXJCMHI4bVdIUlJ3WjIxUWl2Ui9sTjBLdlRLNVdBOTlYWENsVEtBaVZveGs5dTNwdlVQN2F6ZXY5RFFseUZcblp2dW1oSE5VSWpSN2xUSTliNktnaHJpUEZ1UTNQdktpaEFkWlBHdVA2OGxuWllCUlpPeVpJVHBDb0pvengxZmVcblRObkNoT1BkaTdBTE1lSisrMWg5VWZVPVxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIiwKICAiY2xpZW50X2VtYWlsIjogImNvcnRvYmEtc3lzQGNvcnRvYmEtc3VwcC1zeXMuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJjbGllbnRfaWQiOiAiMTA4NDg2NjQxNTA1ODc3OTE3NDQwIiwKICAiYXV0aF91cmkiOiAiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tL28vb2F1dGgyL2F1dGgiLAogICJ0b2tlbl91cmkiOiAiaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW4iLAogICJhdXRoX3Byb3ZpZGVyX3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vb2F1dGgyL3YxL2NlcnRzIiwKICAiY2xpZW50X3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vcm9ib3QvdjEvbWV0YWRhdGEveDUwOS9jb3J0b2JhLXN5cyU0MGNvcnRvYmEtc3VwcC1zeXMuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K
```

### 2. Session Secret (مطلوب للأمان)
```
SESSION_SECRET=your-secure-random-string-here-minimum-32-chars
```
**مهم:** استخدم سلسلة عشوائية قوية (32 حرف على الأقل)

### 3. قاعدة البيانات (اختياري)
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```
**ملاحظة:** المشروع يستخدم Google Sheets كقاعدة بيانات أساسية، لذا DATABASE_URL اختياري

### 4. DeepSeek API (للذكاء الاصطناعي)
```
DEEPSEEK_API_KEY=sk-11817199e686483081e5d3ab5c679eb8
```

### 5. Telegram Bot (اختياري)
```
TELEGRAM_BOT_TOKEN=7910604598:AAGRxzJyg1UkRh_-aJK2vP1dWxRSo-Z7qlc
```

### 6. Resend API (اختياري - للبريد الإلكتروني)
```
RESEND_API_KEY=(اختياري - سيتم تعطيل البريد الإلكتروني إذا لم يتم توفيره)
```

### 7. Port (Railway يضبطه تلقائياً)
```
PORT=8080
```
**ملاحظة:** Railway سيضبط هذا تلقائياً، لكن التطبيق يستمع على 8080

## كيفية إضافة المتغيرات في Railway:

1. اذهب إلى مشروعك في Railway Dashboard
2. اضغط على الخدمة (Service)
3. اذهب إلى **Settings** tab
4. ابحث عن قسم **Variables**
5. اضغط على **"Add Variable"**
6. أضف كل متغير بالاسم والقيمة
7. Railway سيعيد تشغيل التطبيق تلقائياً

## متغيرات اختيارية إضافية:

### للبريد الإلكتروني (SendGrid)
```
SENDGRID_API_KEY=your-sendgrid-api-key
```

### للنسخ الاحتياطية
```
BACKUP_ENABLED=false
```

## نصائح مهمة:

1. **SESSION_SECRET** يجب أن يكون عشوائياً وقوياً للأمان
2. **GOOGLE_SHEETS_ID** و **GOOGLE_SHEETS_USER_MANAGEMENT_ID** مطلوبان للعمل مع Google Sheets
3. **DATABASE_URL** غير مطلوب إذا كنت تستخدم Google Sheets فقط
4. احرص على عدم مشاركة هذه المتغيرات مع أي شخص

## للحصول على المفاتيح:

- **DeepSeek API**: من https://platform.deepseek.com/
- **SendGrid**: من https://sendgrid.com/
- **Telegram Bot**: من @BotFather في Telegram

بعد إضافة جميع المتغيرات المطلوبة، سيعمل التطبيق بنجاح على Railway! 🚀