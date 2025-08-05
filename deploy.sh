#!/bin/bash

# سكريبت نشر مشروع قرطبة للتوريدات
# استخدام: ./deploy.sh [production|staging]

set -e  # إيقاف السكريبت عند أول خطأ

ENVIRONMENT=${1:-production}
PROJECT_NAME="qortoba-supplies"

echo "🚀 بدء نشر مشروع قرطبة للتوريدات - البيئة: $ENVIRONMENT"

# التحقق من وجود Node.js
if ! command -v node &> /dev/null; then
    echo "❌ خطأ: Node.js غير مثبت"
    echo "يرجى تثبيت Node.js من: https://nodejs.org/"
    exit 1
fi

# التحقق من وجود PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ خطأ: PostgreSQL غير مثبت"
    echo "يرجى تثبيت PostgreSQL من: https://www.postgresql.org/"
    exit 1
fi

echo "✅ تم التحقق من متطلبات النظام"

# التحقق من وجود ملف البيئة
if [ ! -f ".env" ]; then
    echo "⚠️  ملف .env غير موجود، سيتم إنشاء نموذج"
    cp .env.production.example .env
    echo "📝 تم إنشاء ملف .env من النموذج"
    echo "⚠️  يرجى تعديل ملف .env بالإعدادات الصحيحة قبل المتابعة"
    echo "📖 راجع ملف production-deployment-package.md للتفاصيل"
    read -p "اضغط Enter للمتابعة بعد تعديل ملف .env..."
fi

echo "📦 تثبيت التبعيات..."
npm ci --omit=dev

echo "🏗️  بناء المشروع..."
npm run build

echo "🗃️  إعداد قاعدة البيانات..."
npm run db:push

echo "🔍 اختبار الاتصال بقاعدة البيانات..."
if npm run test:db 2>/dev/null; then
    echo "✅ الاتصال بقاعدة البيانات ناجح"
else
    echo "⚠️  لا يمكن اختبار قاعدة البيانات - تأكد من الإعدادات"
fi

# إعداد PM2 إذا كان متوفراً
if command -v pm2 &> /dev/null; then
    echo "🔄 إعداد PM2..."
    
    # إيقاف التطبيق الحالي إذا كان يعمل
    pm2 stop $PROJECT_NAME 2>/dev/null || true
    pm2 delete $PROJECT_NAME 2>/dev/null || true
    
    # تشغيل التطبيق الجديد
    pm2 start npm --name "$PROJECT_NAME" -- start
    pm2 save
    
    echo "✅ تم تشغيل التطبيق باستخدام PM2"
    echo "📊 لمراقبة التطبيق: pm2 monit"
    echo "📋 لعرض السجلات: pm2 logs $PROJECT_NAME"
else
    echo "⚠️  PM2 غير مثبت - سيتم تشغيل التطبيق مباشرة"
    echo "💡 لتثبيت PM2: npm install -g pm2"
    echo "🚀 تشغيل التطبيق..."
    npm start &
    echo "✅ تم تشغيل التطبيق في الخلفية"
fi

echo ""
echo "🎉 تم نشر المشروع بنجاح!"
echo ""
echo "📋 معلومات مهمة:"
echo "   🌐 رابط التطبيق: http://localhost:5000"
echo "   📁 مجلد المشروع: $(pwd)"
echo "   📊 لمراقبة الأداء: pm2 monit (إذا كان PM2 مثبت)"
echo "   📜 لعرض السجلات: pm2 logs $PROJECT_NAME"
echo ""
echo "📖 للمزيد من التفاصيل راجع:"
echo "   - production-deployment-package.md"
echo "   - SERVER_DEPLOYMENT_GUIDE.md"
echo "   - RDP_DEPLOYMENT_GUIDE.md"
echo ""
echo "⚠️  لا تنس:"
echo "   1. إعداد النسخ الاحتياطية التلقائية"
echo "   2. إعداد Nginx كـ reverse proxy"
echo "   3. تأمين قاعدة البيانات"
echo "   4. إعداد HTTPS للأمان"
echo ""
echo "✅ النشر مكتمل!"