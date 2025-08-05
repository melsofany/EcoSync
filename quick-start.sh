#!/bin/bash

# سكريبت البدء السريع لمشروع قرطبة للتوريدات
# للاستخدام: curl -fsSL [script-url] | bash

set -e

echo "🚀 مرحباً بك في مشروع قرطبة للتوريدات"
echo "📋 سكريبت النشر السريع"
echo ""

# متغيرات
PROJECT_NAME="qortoba-supplies"
DB_NAME="qortoba_supplies"
DB_USER="qortoba_user"
DB_PASS=""
INSTALL_DIR="/opt/$PROJECT_NAME"

# وظائف مساعدة
log_info() {
    echo "ℹ️  $1"
}

log_success() {
    echo "✅ $1"
}

log_error() {
    echo "❌ $1"
    exit 1
}

log_warning() {
    echo "⚠️  $1"
}

# فحص صلاحيات المدير
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "يُنصح بعدم تشغيل السكريبت كـ root"
        read -p "هل تريد المتابعة؟ (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# فحص نظام التشغيل
check_os() {
    log_info "فحص نظام التشغيل..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        if command -v apt-get &> /dev/null; then
            DISTRO="debian"
        elif command -v yum &> /dev/null; then
            DISTRO="redhat"
        else
            log_error "توزيعة Linux غير مدعومة"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        if ! command -v brew &> /dev/null; then
            log_error "يتطلب Homebrew على macOS"
        fi
    else
        log_error "نظام التشغيل غير مدعوم: $OSTYPE"
    fi
    
    log_success "نظام التشغيل: $OS ($DISTRO)"
}

# تثبيت Node.js
install_nodejs() {
    log_info "فحص Node.js..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_success "Node.js موجود: $NODE_VERSION"
        
        # فحص الإصدار
        if [[ "${NODE_VERSION:1:2}" -lt "18" ]]; then
            log_warning "إصدار Node.js قديم، يُنصح بـ 18+"
        fi
    else
        log_info "تثبيت Node.js..."
        
        if [[ "$OS" == "linux" && "$DISTRO" == "debian" ]]; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif [[ "$OS" == "linux" && "$DISTRO" == "redhat" ]]; then
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs
        elif [[ "$OS" == "macos" ]]; then
            brew install node
        fi
        
        log_success "تم تثبيت Node.js"
    fi
}

# تثبيت PostgreSQL
install_postgresql() {
    log_info "فحص PostgreSQL..."
    
    if command -v psql &> /dev/null; then
        PG_VERSION=$(psql --version | head -n1 | awk '{print $3}')
        log_success "PostgreSQL موجود: $PG_VERSION"
    else
        log_info "تثبيت PostgreSQL..."
        
        if [[ "$OS" == "linux" && "$DISTRO" == "debian" ]]; then
            sudo apt update
            sudo apt install -y postgresql postgresql-contrib
            sudo systemctl start postgresql
            sudo systemctl enable postgresql
        elif [[ "$OS" == "linux" && "$DISTRO" == "redhat" ]]; then
            sudo yum install -y postgresql-server postgresql-contrib
            sudo postgresql-setup initdb
            sudo systemctl start postgresql
            sudo systemctl enable postgresql
        elif [[ "$OS" == "macos" ]]; then
            brew install postgresql
            brew services start postgresql
        fi
        
        log_success "تم تثبيت PostgreSQL"
    fi
}

# إعداد قاعدة البيانات
setup_database() {
    log_info "إعداد قاعدة البيانات..."
    
    # إنشاء كلمة مرور عشوائية
    DB_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    
    # إنشاء قاعدة البيانات والمستخدم
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    
    log_success "تم إعداد قاعدة البيانات"
    log_info "كلمة مرور قاعدة البيانات: $DB_PASS"
}

# تحميل المشروع
download_project() {
    log_info "تحميل المشروع..."
    
    if [[ -d "$INSTALL_DIR" ]]; then
        log_warning "مجلد المشروع موجود، سيتم النسخ الاحتياطي"
        sudo mv "$INSTALL_DIR" "${INSTALL_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    sudo mkdir -p "$INSTALL_DIR"
    
    # إذا كان هناك رابط Git
    if [[ -n "${REPO_URL:-}" ]]; then
        sudo git clone "$REPO_URL" "$INSTALL_DIR"
    else
        log_warning "لا يوجد رابط Git، يرجى رفع الملفات يدوياً إلى $INSTALL_DIR"
        read -p "اضغط Enter بعد رفع الملفات..."
    fi
    
    sudo chown -R $USER:$USER "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    log_success "تم تحميل المشروع"
}

# إعداد البيئة
setup_environment() {
    log_info "إعداد متغيرات البيئة..."
    
    cat > .env << EOF
NODE_ENV=production
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
PORT=5000
SESSION_SECRET=$(openssl rand -base64 32)
EOF
    
    log_success "تم إنشاء ملف .env"
}

# تثبيت التبعيات
install_dependencies() {
    log_info "تثبيت تبعيات المشروع..."
    
    npm ci --omit=dev
    
    log_success "تم تثبيت التبعيات"
}

# بناء المشروع
build_project() {
    log_info "بناء المشروع..."
    
    npm run build
    
    log_success "تم بناء المشروع"
}

# إعداد قاعدة البيانات
setup_project_database() {
    log_info "إعداد جداول قاعدة البيانات..."
    
    npm run db:push
    
    log_success "تم إعداد جداول قاعدة البيانات"
}

# تثبيت PM2
install_pm2() {
    log_info "تثبيت PM2..."
    
    if ! command -v pm2 &> /dev/null; then
        sudo npm install -g pm2
        log_success "تم تثبيت PM2"
    else
        log_success "PM2 موجود مسبقاً"
    fi
}

# تشغيل المشروع
start_project() {
    log_info "تشغيل المشروع..."
    
    # إيقاف التطبيق السابق إن وجد
    pm2 stop "$PROJECT_NAME" 2>/dev/null || true
    pm2 delete "$PROJECT_NAME" 2>/dev/null || true
    
    # تشغيل التطبيق الجديد
    pm2 start npm --name "$PROJECT_NAME" -- start
    pm2 save
    pm2 startup
    
    log_success "تم تشغيل المشروع"
}

# فحص النشر
verify_deployment() {
    log_info "فحص النشر..."
    
    sleep 5
    
    if curl -f http://localhost:5000/api/health &>/dev/null; then
        log_success "التطبيق يعمل بنجاح!"
    else
        log_warning "قد تكون هناك مشكلة في التطبيق"
        log_info "فحص السجلات: pm2 logs $PROJECT_NAME"
    fi
}

# عرض النتائج
show_results() {
    echo ""
    echo "🎉 تم نشر مشروع قرطبة للتوريدات بنجاح!"
    echo ""
    echo "📋 معلومات مهمة:"
    echo "   🌐 رابط التطبيق: http://$(hostname -I | awk '{print $1}'):5000"
    echo "   📁 مجلد المشروع: $INSTALL_DIR"
    echo "   🗄️  قاعدة البيانات: $DB_NAME"
    echo "   👤 مستخدم قاعدة البيانات: $DB_USER"
    echo "   🔑 كلمة مرور قاعدة البيانات: $DB_PASS"
    echo ""
    echo "📊 أوامر مفيدة:"
    echo "   pm2 status           - حالة التطبيق"
    echo "   pm2 logs $PROJECT_NAME - سجلات التطبيق"
    echo "   pm2 restart $PROJECT_NAME - إعادة تشغيل"
    echo "   pm2 monit            - مراقبة الأداء"
    echo ""
    echo "⚠️  احفظ كلمة مرور قاعدة البيانات في مكان آمن!"
    echo ""
}

# التشغيل الرئيسي
main() {
    echo "🚀 بدء التثبيت التلقائي..."
    
    check_root
    check_os
    install_nodejs
    install_postgresql
    setup_database
    download_project
    setup_environment
    install_dependencies
    build_project
    setup_project_database
    install_pm2
    start_project
    verify_deployment
    show_results
    
    log_success "اكتمل النشر!"
}

# تشغيل السكريبت
main "$@"