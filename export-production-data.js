#!/usr/bin/env node
/**
 * أداة تصدير البيانات للنشر على Railway
 * تقوم بتصدير جميع البيانات الحالية من قاعدة البيانات
 */

import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// الاتصال بقاعدة البيانات الحالية
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

const tables = [
  'users',
  'clients', 
  'suppliers',
  'quotation_requests',
  'items',
  'quotation_items', 
  'purchase_orders',
  'purchase_order_items',
  'supplier_quotes',
  'supplier_pricing',
  'customer_pricing',
  'pricing_history',
  'activity_log'
];

async function exportData() {
  console.log('🚀 بدء تصدير البيانات للنشر على Railway...\n');
  
  let sqlOutput = `-- قاعدة بيانات قرطبة للتوريدات - نسخة احتياطية كاملة
-- تاريخ التصدير: ${new Date().toISOString()}
-- للاستيراد على Railway

BEGIN;

-- تعطيل التحقق من المفاتيح الخارجية مؤقتاً
SET session_replication_role = replica;

`;

  try {
    for (const table of tables) {
      console.log(`📋 تصدير جدول: ${table}`);
      
      // الحصول على أعمدة الجدول
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table]);
      
      const columns = columnsResult.rows.map(row => row.column_name);
      
      // الحصول على البيانات
      const dataResult = await pool.query(`SELECT * FROM ${table}`);
      
      if (dataResult.rows.length > 0) {
        sqlOutput += `\n-- بيانات جدول ${table} (${dataResult.rows.length} سجل)\n`;
        
        for (const row of dataResult.rows) {
          const values = columns.map(col => {
            const value = row[col];
            if (value === null) return 'NULL';
            if (typeof value === 'boolean') return value;
            if (typeof value === 'number') return value;
            if (value instanceof Date) return `'${value.toISOString()}'`;
            // تنظيف النصوص وحمايتها من SQL injection
            if (typeof value === 'string') {
              return `'${value.replace(/'/g, "''")}'`;
            }
            if (typeof value === 'object') {
              return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
            }
            return `'${String(value).replace(/'/g, "''")}'`;
          }).join(', ');
          
          sqlOutput += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values});\n`;
        }
      }
      
      console.log(`✅ تم تصدير ${dataResult.rows.length} سجل من ${table}`);
    }
    
    sqlOutput += `
-- إعادة تفعيل التحقق من المفاتيح الخارجية
SET session_replication_role = DEFAULT;

COMMIT;

-- تم الانتهاء من التصدير
-- للاستيراد: psql $DATABASE_URL < production-data-export.sql
`;

    // حفظ الملف
    const outputFile = join(__dirname, 'production-data-export.sql');
    fs.writeFileSync(outputFile, sqlOutput);
    
    console.log(`\n✅ تم الانتهاء من التصدير!`);
    console.log(`📁 ملف البيانات: ${outputFile}`);
    console.log(`📊 إجمالي البيانات المُصدّرة:`);
    
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`   ${table}: ${result.rows[0].count} سجل`);
    }
    
  } catch (error) {
    console.error('❌ خطأ في التصدير:', error);
  } finally {
    await pool.end();
  }
}

// تشغيل التصدير
exportData();