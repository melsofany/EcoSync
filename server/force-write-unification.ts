/**
 * إصلاح نهائي للتوحيد - يكتب النتائج مباشرة في Google Sheets بدون شروط
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';

export class ForceWriteUnification {
  private sheets: any;
  private spreadsheetId: string;

  constructor() {
    this.spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
  }

  async initialize() {
    const keyFilePath = './attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json';
    const keyFile = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
    
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const authClient = await auth.getClient();
    this.sheets = google.sheets({ version: 'v4', auth: authClient as OAuth2Client });
    
    console.log('✅ تم الاتصال بـ Google Sheets للكتابة المباشرة');
  }

  // دالة المقارنة المحسنة
  private areItemsSimilar(item1: any, item2: any): boolean {
    // 1. مطابقة LINE ITEM
    if (item1.lineItem && item2.lineItem) {
      const clean1 = item1.lineItem.trim().toUpperCase()
        .replace(/[\s\-_\.\/\\(){}[\]"']/g, '');
      const clean2 = item2.lineItem.trim().toUpperCase()
        .replace(/[\s\-_\.\/\\(){}[\]"']/g, '');
      
      if (clean1 && clean2 && clean1 === clean2) {
        return true;
      }
    }
    
    // 2. مطابقة PART NUMBER
    if (item1.partNumber && item2.partNumber) {
      const clean1 = item1.partNumber.trim().toUpperCase()
        .replace(/[\s\-_\.\/\\(){}[\]"']/g, '');
      const clean2 = item2.partNumber.trim().toUpperCase()
        .replace(/[\s\-_\.\/\\(){}[\]"']/g, '');
      
      if (clean1 && clean2 && clean1 === clean2) {
        return true;
      }
    }
    
    // 3. مطابقة الوصف
    if (item1.description && item2.description) {
      const desc1 = item1.description.trim().toUpperCase();
      const desc2 = item2.description.trim().toUpperCase();
      
      // تطابق تام
      if (desc1 === desc2 && desc1.length > 10) {
        return true;
      }
      
      // تشابه عالي
      const similarity = this.calculateSimilarity(desc1, desc2);
      if (similarity > 0.85 && desc1.length > 20 && desc2.length > 20) {
        return true;
      }
    }
    
    return false;
  }

  private calculateSimilarity(text1: string, text2: string): number {
    if (text1 === text2) return 1;
    
    const words1 = text1.split(/\s+/).filter(w => w.length > 2);
    const words2 = text2.split(/\s+/).filter(w => w.length > 2);
    
    if (!words1.length || !words2.length) return 0;
    
    let matches = 0;
    for (const word of words1) {
      if (words2.includes(word)) matches++;
    }
    
    return matches / Math.min(words1.length, words2.length);
  }

  async runForceUnification() {
    try {
      await this.initialize();
      
      console.log('📊 قراءة البيانات من Google Sheets...');
      
      // قراءة كل البيانات
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A:O'
      });

      const rows = response.data.values || [];
      console.log(`📊 تم قراءة ${rows.length} صف من Google Sheets`);
      
      if (rows.length < 2) {
        throw new Error('لا توجد بيانات كافية');
      }

      // تجهيز البيانات
      const items = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] || [];
        
        const lineItem = row[2]?.toString().trim() || '';
        const partNumber = row[3]?.toString().trim() || '';
        const description = row[4]?.toString().trim() || '';

        if (lineItem || partNumber || description) {
          items.push({
            rowIndex: i + 1,
            lineItem,
            partNumber,
            description,
            currentId: row[0] || ''
          });
        }
      }

      console.log(`✅ تم تحضير ${items.length} بند للمعالجة`);
      
      // المعالجة والتوحيد
      const groups = [];
      const processed = new Set();
      let nextId = 1;
      let totalMatches = 0;
      
      for (let i = 0; i < items.length; i++) {
        if (processed.has(i)) continue;
        
        const master = items[i];
        const groupId = `P-${nextId.toString().padStart(7, '0')}`;
        nextId++;
        
        const group = {
          id: groupId,
          items: [{ ...master, index: i }]
        };
        
        processed.add(i);
        
        // البحث عن المطابقات
        for (let j = i + 1; j < items.length; j++) {
          if (processed.has(j)) continue;
          
          if (this.areItemsSimilar(master, items[j])) {
            group.items.push({ ...items[j], index: j });
            processed.add(j);
            totalMatches++;
          }
        }
        
        groups.push(group);
        
        if (group.items.length > 1) {
          console.log(`✅ المجموعة ${groupId}: ${group.items.length} بند متطابق`);
        }
      }
      
      console.log(`\n📊 النتائج النهائية:`);
      console.log(`  - إجمالي البنود: ${items.length}`);
      console.log(`  - المجموعات المنشأة: ${groups.length}`);
      console.log(`  - التطابقات المكتشفة: ${totalMatches}`);
      
      // الكتابة المباشرة إلى Google Sheets - بدون شروط
      const updates = [];
      for (const group of groups) {
        for (const item of group.items) {
          updates.push({
            range: `DATA!A${item.rowIndex}`,
            values: [[group.id]]
          });
        }
      }
      
      console.log(`\n📝 بدء الكتابة المباشرة إلى Google Sheets...`);
      console.log(`📝 سيتم كتابة ${updates.length} معرف جديد`);
      
      // الكتابة على دفعات
      const batchSize = 100;
      let written = 0;
      
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        await this.sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            valueInputOption: 'RAW',
            data: batch
          }
        });
        
        written += batch.length;
        console.log(`✅ تم كتابة ${written}/${updates.length} معرف`);
        
        // انتظار قليل لتجنب حدود API
        if (i + batchSize < updates.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log(`\n🎉 اكتمل التوحيد والكتابة بنجاح!`);
      console.log(`✅ تم كتابة ${updates.length} معرف جديد في Google Sheets`);
      
      return {
        success: true,
        groups: groups.length,
        totalItems: items.length,
        totalMatches,
        updatesWritten: updates.length
      };
      
    } catch (error: any) {
      console.error('❌ خطأ في التوحيد:', error);
      throw error;
    }
  }
}