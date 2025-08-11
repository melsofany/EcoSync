// استخدام قاعدة بيانات مؤقتة للتطوير
import { tempDb, initTempDatabase } from './temp-db.js';
import * as schema from "@shared/schema";

// تصدير قاعدة البيانات المؤقتة
export const db = tempDb;
export const pool = null; // لن نحتاج للتجمع في قاعدة البيانات المؤقتة

// تهيئة قاعدة البيانات عند التحميل
await initTempDatabase();

console.log('🔄 استخدام قاعدة بيانات مؤقتة للتطوير');