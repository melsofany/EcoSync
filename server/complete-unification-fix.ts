// إصلاح كامل لعملية التوحيد - معالجة كل البيانات دفعة واحدة وحفظها في Google Sheets

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';
import { EventEmitter } from 'events';

export class CompleteUnificationFix extends EventEmitter {
  private sheets: any;
  private spreadsheetId: string;
  private isRunning: boolean = false;

  constructor() {
    super();
    this.spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
  }

  async initialize() {
    // تهيئة Google Sheets
    const keyFilePath = './attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json';
    const keyFile = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
    
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const authClient = await auth.getClient();
    this.sheets = google.sheets({ version: 'v4', auth: authClient as OAuth2Client });
    
    console.log('✅ تم الاتصال بـ Google Sheets');
  }

  // دالة المقارنة بين البنود - محسّنة للمقارنة الأكثر دقة
  private areItemsSimilar(item1: any, item2: any): boolean {
    // 1. مطابقة LINE ITEM - أهم معيار
    if (item1.lineItem && item2.lineItem) {
      const clean1 = item1.lineItem.trim().toUpperCase().replace(/\s+/g, ' ');
      const clean2 = item2.lineItem.trim().toUpperCase().replace(/\s+/g, ' ');
      
      // إزالة أي أقواس أو رموز خاصة للمقارنة
      const normalized1 = clean1.replace(/[()\[\]{}<>"']/g, '').trim();
      const normalized2 = clean2.replace(/[()\[\]{}<>"']/g, '').trim();
      
      if (normalized1 && normalized2 && normalized1 === normalized2) {
        console.log(`    ✓ تطابق LINE ITEM: "${item1.lineItem}" = "${item2.lineItem}"`);
        return true;
      }
    }
    
    // 2. مطابقة PART NUMBER - ثاني أهم معيار
    if (item1.partNumber && item2.partNumber) {
      const clean1 = this.normalizePartNumber(item1.partNumber);
      const clean2 = this.normalizePartNumber(item2.partNumber);
      
      // مقارنة مباشرة بدون شرط الطول
      if (clean1 && clean2 && clean1 === clean2) {
        console.log(`    ✓ تطابق PART NUMBER: "${item1.partNumber}" = "${item2.partNumber}"`);
        return true;
      }
    }
    
    // 3. مطابقة الوصف - معيار ثالث (مع أو بدون LINE ITEM/PART NUMBER)
    if (item1.description && item2.description) {
      // تنظيف وتوحيد الوصف
      const desc1 = item1.description.trim().toUpperCase().replace(/\s+/g, ' ');
      const desc2 = item2.description.trim().toUpperCase().replace(/\s+/g, ' ');
      
      // مطابقة تامة
      if (desc1 === desc2 && desc1.length > 10) {
        console.log(`    ✓ تطابق كامل في الوصف: "${item1.description}"`);
        return true;
      }
      
      // مطابقة تشابه عالي (للأوصاف الطويلة)
      if (desc1.length > 20 && desc2.length > 20) {
        const similarity = this.calculateSimilarity(item1.description, item2.description);
        if (similarity > 0.85) {
          console.log(`    ✓ تشابه عالي في الوصف (${Math.round(similarity * 100)}%): "${item1.description}" ≈ "${item2.description}"`);
          return true;
        }
      }
    }
    
    // 4. مطابقة مركبة - LINE ITEM + PART NUMBER جزئي
    if (item1.lineItem && item2.lineItem && item1.partNumber && item2.partNumber) {
      const lineMatch = this.calculateSimilarity(item1.lineItem, item2.lineItem) > 0.8;
      const partMatch = this.calculateSimilarity(item1.partNumber, item2.partNumber) > 0.8;
      
      if (lineMatch && partMatch) {
        console.log(`    ✓ تطابق مركب LINE ITEM + PART NUMBER`);
        return true;
      }
    }
    
    return false;
  }

  private normalizePartNumber(partNumber: string): string {
    return partNumber
      .trim()
      .toUpperCase()
      .replace(/[\s\-_\.\/\\]/g, '')
      .replace(/[^\w\d]/g, '');
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // تنظيف وتوحيد النصوص
    const normalized1 = text1.trim().toUpperCase()
      .replace(/[()\[\]{}<>"']/g, '') // إزالة الأقواس والرموز
      .replace(/\s+/g, ' ')
      .trim();
    const normalized2 = text2.trim().toUpperCase()
      .replace(/[()\[\]{}<>"']/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // تطابق تام
    if (normalized1 === normalized2) return 1;
    
    // إذا كان أحدهما يحتوي الآخر بالكامل
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      return 0.9;
    }
    
    // تقسيم إلى كلمات وحساب التشابه
    const words1 = normalized1.split(' ').filter(w => w.length > 1);
    const words2 = normalized2.split(' ').filter(w => w.length > 1);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    // حساب الكلمات المشتركة
    let commonWords = 0;
    const shortWords1 = words1.length;
    const shortWords2 = words2.length;
    
    for (const word of words1) {
      if (words2.includes(word)) {
        commonWords++;
      } else {
        // البحث عن تطابق جزئي (على الأقل 3 أحرف)
        for (const word2 of words2) {
          if (word.length >= 3 && word2.length >= 3) {
            if (word.includes(word2) || word2.includes(word)) {
              commonWords += 0.5;
              break;
            }
          }
        }
      }
    }
    
    // حساب النسبة بناءً على العدد الأقل من الكلمات
    return commonWords / Math.min(shortWords1, shortWords2);
  }

  async runCompleteUnification() {
    try {
      await this.initialize();
      this.isRunning = true;
      
      console.log('📊 قراءة البيانات من Google Sheets...');
      
      // قراءة البيانات من ورقة DATA
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A:O'
      });

      const rows = response.data.values || [];
      if (rows.length < 2) {
        throw new Error('لا توجد بيانات كافية للمعالجة');
      }

      // تحضير البيانات
      const items = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] || [];
        
        if (row.length >= 5) {
          const lineItem = row[2] ? row[2].toString().trim() : '';
          const partNumber = row[3] ? row[3].toString().trim() : '';
          const description = row[4] ? row[4].toString().trim() : '';

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
      }

      console.log(`📊 تم تحميل ${items.length} بند للمعالجة`);
      
      // عرض عينة من البيانات للتحليل
      console.log('\n📝 عينة من البيانات المحملة:');
      for (let i = 0; i < Math.min(5, items.length); i++) {
        const item = items[i];
        console.log(`  الصف ${item.rowIndex}: LINE="${item.lineItem}" | PART="${item.partNumber}" | DESC="${item.description?.substring(0, 50)}..."`);
      }
      
      // المعالجة الشاملة - البدء من الصف الأول ومقارنته مع كل الصفوف
      const processedRowIndices = new Set();
      const groups = [];
      let nextGroupId = 1;
      
      console.log('\n🔍 بدء المعالجة الشاملة...');
      
      let totalMatches = 0;
      let groupsWithMatches = 0;
      
      for (let i = 0; i < items.length; i++) {
        const masterItem = items[i];
        
        // تخطي الصفوف التي تمت معالجتها
        if (processedRowIndices.has(masterItem.rowIndex)) {
          continue;
        }
        
        // إنشاء معرف جديد للمجموعة
        const groupId = `P-${nextGroupId.toString().padStart(7, '0')}`;
        nextGroupId++;
        
        const group = {
          masterId: groupId,
          items: [masterItem]
        };
        
        // وضع علامة على هذا الصف كمُعالج
        processedRowIndices.add(masterItem.rowIndex);
        
        console.log(`\n🔎 معالجة الصف ${masterItem.rowIndex} (${i+1}/${items.length})`);
        console.log(`  البيانات: LINE="${masterItem.lineItem}" | PART="${masterItem.partNumber}"`);
        
        // البحث عن كل الصفوف المشابهة
        let matchesInGroup = 0;
        for (let j = i + 1; j < items.length; j++) {
          const compareItem = items[j];
          
          // تخطي الصفوف التي تمت معالجتها
          if (processedRowIndices.has(compareItem.rowIndex)) {
            continue;
          }
          
          // المقارنة بناءً على المعايير الثلاثة
          const isSimilar = this.areItemsSimilar(masterItem, compareItem);
          
          if (isSimilar) {
            group.items.push(compareItem);
            processedRowIndices.add(compareItem.rowIndex);
            matchesInGroup++;
            totalMatches++;
            console.log(`  🔗 تطابق مع الصف ${compareItem.rowIndex}`);
          }
        }
        
        groups.push(group);
        
        if (group.items.length > 1) {
          groupsWithMatches++;
          console.log(`  📦 تم إنشاء المجموعة ${group.masterId}: ${group.items.length} بند متطابق`);
        } else {
          console.log(`  ⭕ لا توجد تطابقات - سيحصل على معرف فريد ${groupId}`);
        }
      }
      
      console.log(`\n📊 ملخص التوحيد:`);
      console.log(`  - إجمالي البنود: ${items.length}`);
      console.log(`  - المجموعات المنشأة: ${groups.length}`);
      console.log(`  - المجموعات مع تطابقات: ${groupsWithMatches}`);
      console.log(`  - إجمالي التطابقات المكتشفة: ${totalMatches}`);
      
      console.log(`✅ تم إنشاء ${groups.length} مجموعة من ${items.length} بند`);
      
      // تحضير التحديثات لـ Google Sheets
      const updates = [];
      for (const group of groups) {
        for (const item of group.items) {
          updates.push({
            range: `DATA!A${item.rowIndex}`,
            values: [[group.masterId]]
          });
        }
      }
      
      // تطبيق التحديثات على Google Sheets
      if (updates.length > 0) {
        console.log(`📝 تطبيق ${updates.length} تحديث على Google Sheets...`);
        
        const batchSize = 100;
        let successCount = 0;
        
        for (let i = 0; i < updates.length; i += batchSize) {
          const batch = updates.slice(i, i + batchSize);
          
          await this.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            requestBody: {
              valueInputOption: 'RAW',
              data: batch
            }
          });
          
          successCount += batch.length;
          console.log(`✅ تم تطبيق ${successCount}/${updates.length} تحديث`);
        }
        
        console.log(`🎉 تم تطبيق جميع التحديثات بنجاح على Google Sheets!`);
      }
      
      this.isRunning = false;
      return { success: true, groups: groups.length, totalItems: items.length };
      
    } catch (error: any) {
      console.error('❌ خطأ في التوحيد:', error.message);
      this.isRunning = false;
      throw error;
    }
  }
}