import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import "./telegram-bot"; // Initialize Telegram bot
import { storage } from "./storage";

// إعلان النوع العالمي للنظام الفارغ
declare global {
  var SYSTEM_COMPLETELY_EMPTY: boolean;
  var TARGET_TOTAL_VALUE: number;
}

const app = express();

// خدمة الملفات الثابتة (الصور المرفوعة)
app.use('/uploads', express.static('public/uploads'));

// زيادة حد حجم الطلب لدعم ملفات Excel الكبيرة (حتى 100 ميجابايت)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ 
  limit: '100mb',
  extended: false,
  parameterLimit: 50000 // زيادة حد المعاملات أيضاً
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(`${new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit", 
        second: "2-digit",
        hour12: true,
      })} [express] ${logLine}`);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error(`Express error (${status}): ${message}`, err);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./vite.js");
    await setupVite(app, server);
  } else {
    // Use production-only static file serving without vite dependencies
    const { serveStatic } = await import("./vite-production.js");
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  // تعيين مفتاح Google Sheets من الملف المُرفق
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const fs = await import('fs/promises');
      const keyData = await fs.readFile('./attached_assets/cortoba-supp-sys-75c0919d127e_1754952836786.json', 'utf8');
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY = keyData;
      console.log('✅ تم تحميل مفتاح Google Sheets من الملف المُرفق');
    } catch (error) {
      console.error('❌ خطأ في تحميل مفتاح Google Sheets:', (error as Error).message);
    }
  }

  // تفعيل النظام للاستقبال من Google Sheets فقط
  global.SYSTEM_COMPLETELY_EMPTY = false;
  global.TARGET_TOTAL_VALUE = 14006975; // القيمة المستهدفة بالجنيه المصري
  
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    console.log(`${new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit", 
      hour12: true,
    })} [express] serving on port ${port}`);
    console.log(`Health endpoint available at: http://0.0.0.0:${port}/api/health`);
    
    // عرض حالة النظام الفارغ
    console.log('🚀 نظام قرطبة للتوريدات - نظام إدارة التوريدات');
    console.log('📭 النظام فارغ تماماً - جاهز لبيانات جديدة');
    console.log('🎯 المعادلة جاهزة: SUM(N2:N∞) = 14,006,975 ج.م');
    console.log('🔄 مزامنة مع Google Sheets نشطة');
    console.log('🤖 تكامل AI متقدم للتحليل والتوحيد الذكي');
    console.log('✅ النظام جاهز - admin / admin123');
    
    // تشغيل التوحيد التلقائي للبنود المكررة
    setTimeout(async () => {
      try {
        const { initializeAutoUnification } = await import('./auto-unification.js');
        await initializeAutoUnification();
      } catch (error) {
        console.log('⚠️ التوحيد التلقائي غير متاح:', (error as Error).message);
      }
    }, 10000); // تأخير 10 ثوان لضمان استقرار النظام

    // تفعيل مزامنة البيانات الجديدة
    setTimeout(async () => {
      try {
        await realTimeSync.startRealTimeSync();
        console.log('🔄 تم تفعيل المزامنة الحقيقية الجديدة');
      } catch (error) {
        console.log('⚠️ المزامنة الحقيقية غير متاحة:', (error as Error).message);
      }
    }, 3000); // بدء المزامنة بعد 3 ثوان

    // إعداد المزامنة التلقائية مع Google Sheets
    setTimeout(async () => {
      try {
        console.log('⚡ تشغيل المزامنة التلقائية مع Google Sheets...');
        await setupRealTimeSync();
        console.log('✅ تم تفعيل المزامنة التلقائية مع Google Sheets');
      } catch (error) {
        console.log('⚠️ سيتم المحاولة لاحقاً:', (error as Error).message);
      }
    }, 5000); // انتظار 5 ثوانِ

    // تفعيل بوت التليجرام
    setTimeout(async () => {
      try {
        console.log('📱 [TELEGRAM BOT] Starting Telegram bot...');
        const { telegramBotGoogleSheets } = await import('./telegram-bot-google-sheets');
        console.log('📱 [TELEGRAM BOT] Telegram bot started successfully');
      } catch (error) {
        console.error('📱 [TELEGRAM BOT] Failed to start:', error);
      }
    }, 7000); // انتظار 7 ثوانِ لضمان استقرار النظام
  });
})();
