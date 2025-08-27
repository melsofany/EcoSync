#!/usr/bin/env node

/**
 * اختبار نظام التوحيد بـ DeepSeek على عينة صغيرة
 */

import { google } from 'googleapis';
import fs from 'fs';
import fetch from 'node-fetch';

// التكوين
const keyFile = JSON.parse(fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8'));
const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// إعداد Google Sheets
const auth = new google.auth.GoogleAuth({
  credentials: keyFile,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const authClient = await auth.getClient();
const sheets = google.sheets({ version: 'v4', auth: authClient });

/**
 * استدعاء DeepSeek API
 */
async function testDeepSeek() {
  console.log('🧪 اختبار DeepSeek API على عينة صغيرة...\n');
  
  // قراءة 10 بنود فقط للاختبار
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'DATA!A2:E11'  // البنود من 2 إلى 11
  });
  
  const rows = response.data.values || [];
  console.log(`📊 تم قراءة ${rows.length} بنود للاختبار\n`);
  
  // اختبار المطابقة بين بندين
  if (rows.length >= 2) {
    const item1 = {
      description: rows[0][4] || '',
      partNumber: rows[0][3] || '',
      lineItem: rows[0][2] || ''
    };
    
    const item2 = {
      description: rows[1][4] || '',
      partNumber: rows[1][3] || '',
      lineItem: rows[1][2] || ''
    };
    
    console.log('البند الأول:');
    console.log(`  الوصف: ${item1.description.substring(0, 50)}...`);
    console.log(`  رقم القطعة: ${item1.partNumber}`);
    console.log(`  رقم البند: ${item1.lineItem}\n`);
    
    console.log('البند الثاني:');
    console.log(`  الوصف: ${item2.description.substring(0, 50)}...`);
    console.log(`  رقم القطعة: ${item2.partNumber}`);
    console.log(`  رقم البند: ${item2.lineItem}\n`);
    
    // اختبار المستوى 1: الوصف فقط
    console.log('🔍 اختبار المستوى 1 (الوصف)...');
    
    const prompt = `أنت خبير في تحليل البنود. قارن بين هذين البندين:
البند الأول: ${item1.description}
البند الثاني: ${item2.description}

هل هما نفس المنتج؟ أجب بـ JSON: {"match": true/false, "confidence": 0-100}`;
    
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 100
        })
      });
      
      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        console.log('✅ استجابة DeepSeek:', data.choices[0].message.content);
        
        try {
          const result = JSON.parse(data.choices[0].message.content);
          console.log(`\n📊 النتيجة: التطابق = ${result.match}, الثقة = ${result.confidence}%`);
        } catch (e) {
          console.log('⚠️ لا يمكن تحليل JSON من الاستجابة');
        }
      }
      
    } catch (error) {
      console.error('❌ خطأ في DeepSeek:', error.message);
    }
  }
}

// تشغيل الاختبار
if (!DEEPSEEK_API_KEY) {
  console.error('❌ خطأ: DEEPSEEK_API_KEY غير موجود');
  process.exit(1);
}

testDeepSeek();