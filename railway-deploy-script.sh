#!/bin/bash

# 🚀 سكريبت النشر على Railway مع نقل البيانات
# تشغيل هذا السكريپت بعد إعداد المشروع في Railway

echo "==============================================="
echo "       نشر قرطبة للتوريدات على Railway"
echo "==============================================="
echo ""

# التحقق من وجود المتطلبات
if ! command -v git &> /dev/null; then
    echo "❌ Git غير مثبت. يرجى تثبيت Git أولاً."
    exit 1
fi

# التحقق من Railway CLI (اختياري)
if command -v railway &> /dev/null; then
    echo "✅ Railway CLI متاح"
    RAILWAY_CLI=true
else
    echo "⚠️  Railway CLI غير مثبت - سيتم النشر عبر GitHub"
    RAILWAY_CLI=false
fi

echo ""
echo "📋 الملفات المحضرة للنشر:"
echo "   ✅ railway.json"
echo "   ✅ nixpacks.toml" 
echo "   ✅ package.json (محدث)"
echo "   ✅ database-backup.sql"
echo "   ✅ export-production-data.js"
echo ""

echo "🗄️  البيانات الجاهزة للنقل:"
echo "   📊 المستخدمون: 4"
echo "   📊 طلبات التسعير: 1539"  
echo "   📊 العناصر: 1559"
echo ""

echo "🔧 خطوات النشر:"
echo ""
echo "1️⃣  أنشئ مشروع جديد في Railway.app"
echo "2️⃣  اربط مستودع GitHub"
echo "3️⃣  أضف خدمة PostgreSQL"
echo "4️⃣  أضف متغيرات البيئة:"
echo "     DATABASE_URL=<من Railway PostgreSQL>"
echo "     SESSION_SECRET=<مفتاح طويل وآمن>"
echo "     NODE_ENV=production"
echo "     PORT=3000"
echo ""
echo "5️⃣  بعد النشر الناجح، استورد البيانات:"
echo "     psql \$RAILWAY_DATABASE_URL < database-backup.sql"
echo ""

if [ "$RAILWAY_CLI" = true ]; then
    echo "💡 يمكنك أيضاً استخدام Railway CLI:"
    echo "   railway login"
    echo "   railway link <project-id>"
    echo "   railway up"
    echo ""
fi

echo "🌍 بعد النشر ستحصل على:"
echo "   🔗 رابط تطبيقك: https://your-app.railway.app"
echo "   📊 لوحة مراقبة شاملة"
echo "   🔄 نشر تلقائي عند التحديث"
echo "   🛡️  SSL/TLS تلقائي"
echo ""

echo "⚠️  ملاحظات مهمة:"
echo "   🔐 احتفظ بنسخة من كلمات المرور"
echo "   💾 اعمل نسخة احتياطية من البيانات الحالية"  
echo "   🔑 قم بتحديث كلمات مرور المديرين بعد النشر"
echo ""

echo "✅ جميع الملفات جاهزة للنشر!"
echo "==============================================="