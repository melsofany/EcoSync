import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// المشروع يستخدم Google Sheets كقاعدة بيانات أساسية
// في حالة عدم وجود DATABASE_URL، نستخدم قيمة افتراضية لتجنب الأخطاء
let pool: Pool;
let db: any;

try {
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
  pool = new Pool({ connectionString: databaseUrl });
  db = drizzle({ client: pool, schema });
  console.log('✅ تم الاتصال بقاعدة البيانات PostgreSQL');
} catch (error) {
  console.log('⚠️ لا توجد قاعدة بيانات PostgreSQL، سيتم استخدام Google Sheets فقط');
  // قيم افتراضية لتجنب الأخطاء
  pool = null as any;
  db = null as any;
}

export { pool, db };