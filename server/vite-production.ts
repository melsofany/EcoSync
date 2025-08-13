import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  const fallbackPath = path.resolve(process.cwd(), "public");
  
  let servePath = distPath;
  
  if (!fs.existsSync(distPath)) {
    if (fs.existsSync(fallbackPath)) {
      servePath = fallbackPath;
      console.log('📁 استخدام مجلد public للإنتاج');
    } else {
      console.log('⚠️ تحذير: مجلد الإنتاج غير موجود، النظام سيعمل مع API فقط');
      // إنشاء route بسيط للصفحة الرئيسية
      app.get("*", (_req, res) => {
        res.send(`
          <html>
            <head><title>نظام قرطبة للتوريدات - وضع الإنتاج</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
              <h1>🏭 نظام قرطبة للتوريدات</h1>
              <h2>يعمل في وضع الإنتاج</h2>
              <p>API متاح على: <a href="/api/health">/api/health</a></p>
              <p>تم تفعيل جميع إعدادات الأمان المتقدمة</p>
            </body>
          </html>
        `);
      });
      return;
    }
  }

  app.use(express.static(servePath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(servePath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send(`
        <html>
          <head><title>نظام قرطبة للتوريدات</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>🏭 نظام قرطبة للتوريدات - وضع الإنتاج</h1>
            <p>API متاح على: <a href="/api/health">/api/health</a></p>
          </body>
        </html>
      `);
    }
  });
}