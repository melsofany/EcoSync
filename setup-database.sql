-- إعداد قاعدة البيانات لمشروع قرطبة للتوريدات
-- تشغيل هذا الملف كمستخدم postgres

-- إنشاء قاعدة البيانات
DROP DATABASE IF EXISTS qortoba_supplies;
CREATE DATABASE qortoba_supplies
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Arabic_Saudi Arabia.1256'
    LC_CTYPE = 'Arabic_Saudi Arabia.1256'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- إنشاء المستخدم
DROP USER IF EXISTS qortoba_user;
CREATE USER qortoba_user WITH
    LOGIN
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE
    INHERIT
    NOREPLICATION
    CONNECTION LIMIT -1
    PASSWORD 'QortobaPass2025!';

-- منح الصلاحيات
GRANT ALL PRIVILEGES ON DATABASE qortoba_supplies TO qortoba_user;

-- الاتصال بقاعدة البيانات الجديدة
\c qortoba_supplies;

-- منح الصلاحيات على الجداول المستقبلية
ALTER DEFAULT PRIVILEGES FOR USER postgres IN SCHEMA public GRANT ALL ON TABLES TO qortoba_user;
ALTER DEFAULT PRIVILEGES FOR USER postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO qortoba_user;
ALTER DEFAULT PRIVILEGES FOR USER postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO qortoba_user;

-- إنشاء Schema إضافي للنسخ الاحتياطية
CREATE SCHEMA IF NOT EXISTS backups;
GRANT ALL ON SCHEMA backups TO qortoba_user;

-- تأكيد الإعدادات
SELECT 'Database qortoba_supplies created successfully' AS status;
SELECT 'User qortoba_user created with full privileges' AS status;

-- عرض معلومات الاتصال
SELECT 'Connection string: postgresql://qortoba_user:QortobaPass2025!@localhost:5432/qortoba_supplies' AS connection_info;