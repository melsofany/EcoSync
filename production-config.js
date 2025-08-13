// إعدادات الإنتاج - نظام قرطبة للتوريدات
export const productionConfig = {
  // إعدادات النظام
  environment: 'production',
  port: process.env.PORT || 5000,
  
  // إعدادات الأمان
  security: {
    enableCors: false,
    trustProxy: true,
    enableRateLimit: true,
    maxRequestsPerMinute: 100,
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 ساعات
    useHttps: true,
    sameSite: 'strict'
  },
  
  // إعدادات التسجيل
  logging: {
    level: 'warn',
    enableAccessLogs: false,
    onlyLogErrors: true
  },
  
  // إعدادات التطبيق
  app: {
    disableAutoSync: false,
    batchSize: 1000,
    maxUploadSize: '50mb',
    enableGoogleSheets: true
  },
  
  // إعدادات قاعدة البيانات
  database: {
    useConnectionPool: true,
    sessionStoreTable: 'user_sessions',
    createTablesIfMissing: true
  }
};

console.log('🏭 تم تحميل إعدادات الإنتاج');
console.log('🔒 مستوى الأمان: مرتفع');
console.log('📊 إعدادات قاعدة البيانات: PostgreSQL');