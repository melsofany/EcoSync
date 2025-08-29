import { google } from 'googleapis';
import { createGoogleAuth } from './google-auth-helper';

export class GoogleSheetsRealtimeData {
  private auth: any;
  private sheets: any;
  private spreadsheetId: string;

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      this.auth = createGoogleAuth();
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      console.log('✅ تم تهيئة Google Sheets للبيانات الحقيقية');
    } catch (error) {
      console.error('❌ خطأ في تهيئة Google Sheets:', (error as Error).message);
    }
  }

  async readDataSheet(): Promise<any[]> {
    try {
      if (!this.sheets) {
        throw new Error('Google Sheets not initialized');
      }

      console.log('🔍 بدء قراءة البيانات من DATA!A2:AA...');
      
      // قراءة البيانات من صفحة DATA بدءاً من الصف 2
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A2:AA', // قراءة كل البيانات من A2 إلى AA بدون حد للصفوف
      });

      const rows = response.data.values || [];
      console.log(`📊 readDataSheet: تم قراءة ${rows.length} صف من Google Sheets`);
      
      // البحث عن 25R000057 في البيانات المقروءة
      let found25R000057 = false;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][5] === '25R000057') {
          found25R000057 = true;
          console.log(`✅ 25R000057 موجود في الصف ${i + 2} من البيانات المقروءة`);
          break;
        }
      }
      if (!found25R000057) {
        console.log('❌ 25R000057 غير موجود في البيانات المقروءة من readDataSheet');
      }

      return rows;
    } catch (error) {
      console.error('❌ خطأ في قراءة البيانات من Google Sheets:', (error as Error).message);
      return [];
    }
  }

  // 🚀 **دالة جديدة لتحديث عدة معرفات دفعة واحدة**
  async updateMultipleItemIds(updates: {oldId: string, newId: string}[]): Promise<number> {
    try {
      if (!this.sheets || updates.length === 0) {
        return 0;
      }

      console.log(`🚀 بدء تحديث ${updates.length} معرف دفعة واحدة...`);
      
      // قراءة جميع البيانات من العمود A مرة واحدة
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A:A',
      });

      const rows = response.data.values || [];
      const batchUpdates: any[] = [];
      let totalUpdated = 0;

      // تحضير جميع التحديثات
      for (const update of updates) {
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0] === update.oldId) {
            batchUpdates.push({
              range: `DATA!A${i + 1}`,
              values: [[update.newId]]
            });
            totalUpdated++;
          }
        }
      }

      // تطبيق التحديثات دفعة واحدة باستخدام batchUpdate
      if (batchUpdates.length > 0) {
        await this.sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            valueInputOption: 'RAW',
            data: batchUpdates
          }
        });
        console.log(`✅ تم تحديث ${totalUpdated} خلية بنجاح في دفعة واحدة`);
      }

      return totalUpdated;

    } catch (error) {
      console.error(`❌ خطأ في التحديث الجماعي:`, error);
      throw error;
    }
  }

  // تحديث معرف بند في جميع الصفوف (للتوحيد)
  async updateItemId(oldItemId: string, newItemId: string): Promise<number> {
    try {
      if (!this.sheets) {
        throw new Error('Google Sheets not initialized');
      }

      console.log(`🔄 تحديث معرف البند: ${oldItemId} → ${newItemId}`);
      
      // قراءة جميع البيانات من العمود A (معرفات البنود)
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A:A',
      });

      const rows = response.data.values || [];
      let updatedCount = 0;
      
      // البحث عن الصفوف التي تحتوي على المعرف القديم وتحديثها
      for (let i = 1; i < rows.length; i++) { // بدءاً من الصف 2 (index 1)
        if (rows[i][0] === oldItemId) {
          const cellAddress = `A${i + 1}`;
          await this.updateCellValue(cellAddress, newItemId);
          updatedCount++;
          console.log(`   ✅ تم تحديث الصف ${i + 1}: ${cellAddress} → ${newItemId}`);
          
          // انتظار أطول لتجنب Google Sheets quota limits
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      console.log(`🎯 تم تحديث ${updatedCount} صف للبند ${oldItemId}`);
      return updatedCount;

    } catch (error) {
      console.error(`❌ خطأ في تحديث معرف البند ${oldItemId}:`, error);
      throw error;
    }
  }

  async updateCellValue(cellAddress: string, value: string, retryCount = 0): Promise<void> {
    const maxRetries = 3;
    
    try {
      if (!this.sheets) {
        throw new Error('Google Sheets not initialized');
      }

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `DATA!${cellAddress}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[value]]
        }
      });

      console.log(`✅ تم تحديث الخلية ${cellAddress} بالقيمة: ${value}`);
    } catch (error: any) {
      if (error.code === 429 && retryCount < maxRetries) {
        // خطأ Quota exceeded - انتظار وإعادة المحاولة
        const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`⏰ Quota exceeded - انتظار ${waitTime/1000}s ثم إعادة المحاولة (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return await this.updateCellValue(cellAddress, value, retryCount + 1);
      }
      
      console.error(`❌ خطأ في تحديث الخلية ${cellAddress}:`, error);
      throw error;
    }
  }

  async findItemByPartNumber(partNumber: string): Promise<{row: number, data: any} | null> {
    try {
      const rawData = await this.readDataSheet();
      
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (row[2] && row[2].toString().includes(partNumber)) { // العمود C - part number
          return {
            row: i + 2, // +2 لأن البيانات تبدأ من الصف 2
            data: {
              id: row[0] || '',
              lineItem: row[1] || '',
              partNumber: row[2] || '',
              description: row[3] || '',
              uom: row[4] || '',
              poNumber: row[10] || '', // العمود K - رقم أمر الشراء
            }
          };
        }
      }
      return null;
    } catch (error) {
      console.error('خطأ في البحث عن البند:', error);
      return null;
    }
  }

  async updatePONumber(itemId: string, poNumber: string): Promise<boolean> {
    try {
      const rawData = await this.readDataSheet();
      console.log(`🔍 البحث عن البند ${itemId} لتحديث PO إلى ${poNumber}`);
      
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        console.log(`فحص الصف ${i + 2}: ${row[0]} مقابل ${itemId}`);
        
        if (row[0] === itemId) { // العمود A - معرف البند
          const rowNumber = i + 2; // +2 لأن البيانات تبدأ من الصف 2
          console.log(`🎯 تم العثور على البند ${itemId} في الصف ${rowNumber}`);
          
          // تحديث العمود K (رقم أمر الشراء) والعمود L (تاريخ أمر الشراء)
          await this.updateCellValue(`K${rowNumber}`, poNumber); // العمود K
          await this.updateCellValue(`L${rowNumber}`, new Date().toLocaleDateString('ar-EG')); // العمود L
          
          console.log(`✅ تم تحديث البند ${itemId} في الصف ${rowNumber} - PO: ${poNumber}`);
          
          // التأكد من التحديث بقراءة البيانات مرة أخرى
          const verificationData = await this.readDataSheet();
          const updatedRow = verificationData[i];
          console.log(`🔍 تأكد من التحديث: العمود K = "${updatedRow[10]}" العمود L = "${updatedRow[11]}"`);
          
          return true;
        }
      }
      
      console.log(`❌ لم يتم العثور على البند ${itemId}`);
      return false;
    } catch (error) {
      console.error('خطأ في تحديث رقم أمر الشراء:', error);
      return false;
    }
  }

  async deleteRow(rowNumber: number): Promise<void> {
    try {
      if (!this.sheets) {
        throw new Error('Google Sheets not initialized');
      }

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 0, // معرف صفحة DATA
                dimension: 'ROWS',
                startIndex: rowNumber - 1, // Google Sheets يستخدم فهرسة من 0
                endIndex: rowNumber
              }
            }
          }]
        }
      });

      console.log(`✅ تم حذف الصف ${rowNumber}`);
    } catch (error) {
      console.error(`❌ خطأ في حذف الصف ${rowNumber}:`, error);
      throw error;
    }
  }

  async calculateTotalValue(): Promise<number> {
    try {
      const rows = await this.readDataSheet();
      let totalValue = 0;

      // حساب إجمالي RFQ: كمية العمود M (12) × سعر العمود N (13)
      for (let i = 1; i < rows.length; i++) { // تخطي صف العناوين
        const row = rows[i];
        if (row.length > 13) {
          // كمية PO من العمود M (رقم 12)
          const quantity = parseFloat(row[12]?.toString().replace(/[^\d.-]/g, '') || '0');
          // سعر PO من العمود N (رقم 13)  
          const price = parseFloat(row[13]?.toString().replace(/[^\d.-]/g, '') || '0');
          
          if (!isNaN(quantity) && !isNaN(price) && quantity > 0 && price > 0) {
            const itemTotal = quantity * price;
            totalValue += itemTotal;
          }
        }
      }

      console.log(`💰 إجمالي القيمة المحسوبة (الكمية × السعر): ${totalValue.toLocaleString()} ج.م`);
      return totalValue;
    } catch (error) {
      console.error('❌ خطأ في حساب إجمالي القيمة:', (error as Error).message);
      return 0;
    }
  }

  async getAllItemsRaw() {
    // نسخة جديدة تقرأ كل الصفوف بدون أي تصفية
    try {
      const rows = await this.readDataSheet();
      console.log(`📊 getAllItemsRaw: معالجة ${rows.length} صف بدون تصفية`);
      
      const items = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const item = {
          id: `item-sheets-${i + 1}`,
          itemNumber: row[0] || '', // العمود A
          uom: row[1] || '', // العمود B
          lineItem: row[2] || '', // العمود C
          partNumber: row[3] || '', // العمود D
          description: row[4] || '', // العمود E
          rfqNumber: row[5] || '', // العمود F
          requestDate: row[6] || '', // العمود G
          quantity: row[7] || '', // العمود H
          price: row[8] || '', // العمود I
          responseDate: row[9] || '', // العمود J
          poNumber: row[10] || '', // العمود K
          poDate: row[11] || '', // العمود L
          poQuantity: row[12] || '', // العمود M
          poPrice: row[13] || '', // العمود N
          totalValue: row[14] || '', // العمود O
          clientName: row[15] || '', // العمود P
          responsibleEmployee: row[16] || '', // العمود Q
          isActive: true,
          createdAt: new Date().toISOString()
        };
        items.push(item);
      }
      
      console.log(`✅ getAllItemsRaw: تم معالجة ${items.length} صنف من ${rows.length} صف`);
      return items;
    } catch (error) {
      console.error('❌ خطأ في getAllItemsRaw:', (error as Error).message);
      return [];
    }
  }
  
  async getAllItems() {
    try {
      console.log('🚀 getAllItems: بدء قراءة البيانات...');
      const rows = await this.readDataSheet();
      console.log(`📊 getAllItems: تم قراءة ${rows.length} صف من readDataSheet`);
      
      // فحص البيانات الخام
      if (rows.length > 0) {
        console.log(`📋 عينة من الصف الأول: ${JSON.stringify(rows[0].slice(0, 6))}`);
        console.log(`📋 عينة من الصف الأخير: ${JSON.stringify(rows[rows.length - 1].slice(0, 6))}`);
        
        // عد الصفوف ذات البيانات الفعلية
        let rowsWithData = 0;
        let emptyRows = 0;
        for (let i = 0; i < rows.length; i++) {
          if (rows[i] && rows[i].length > 0 && rows[i].some(cell => cell && cell.toString().trim() !== '')) {
            rowsWithData++;
          } else {
            emptyRows++;
          }
        }
        console.log(`📊 صفوف بها بيانات: ${rowsWithData}, صفوف فارغة: ${emptyRows}`);
      }
      
      // البحث عن 25R000057 في الصفوف المقروءة
      let found25R000057InRows = false;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][5] === '25R000057') { // العمود F - RFQ NUMBER
          found25R000057InRows = true;
          console.log(`✅ 25R000057 موجود في الصف ${i + 2} من البيانات الخام`);
          console.log(`📋 البيانات: العميل=${rows[i][15]}, الموظف=${rows[i][16]}`);
          break;
        }
      }
      if (!found25R000057InRows) {
        console.log('❌ 25R000057 غير موجود في البيانات الخام من readDataSheet');
      }
      
      const items = [];
      let skippedRows = 0;
      let processedRows = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        // إزالة شرط التخطي - معالجة كل الصفوف
        // if (row.length < 2) {
        //   skippedRows++;
        //   continue; // تخطي الصفوف الفارغة
        // }
        processedRows++;

        const item = {
          id: `item-sheets-${i + 1}`,
          itemNumber: row[0] || '', // العمود A - P-0000001
          uom: row[1] || '', // العمود B - UOM
          lineItem: row[2] || '', // العمود C - LINE ITEM
          partNumber: row[3] || '', // العمود D - PART NO
          description: row[4] || '', // العمود E - DESCRIPTION
          rfqNumber: row[5] || '', // العمود F - RFQ NUMBER  
          requestDate: row[6] || '', // العمود G - REQUEST DATE
          quantity: row[7] || '', // العمود H - QUANTITY
          price: row[8] || '', // العمود I - PRICE
          responseDate: row[9] || '', // العمود J - تاريخ الانتهاء/الاستجابة
          poNumber: row[10] || '', // العمود K - PO NUMBER
          poDate: row[11] || '', // العمود L - PO DATE
          poQuantity: row[12] || '', // العمود M - PO QUANTITY
          poPrice: row[13] || '', // العمود N - PO PRICE
          totalValue: row[14] || '', // العمود O - القيمة الإجمالية
          clientName: row[15] || '', // العمود P (فهرس 15) - اسم العميل
          responsibleEmployee: row[16] || '', // العمود Q (فهرس 16) - الموظف المسؤول
          isActive: true,
          createdAt: new Date().toISOString()
        };

        // طباعة عينة من البيانات للتشخيص (أول 10 صفوف فقط)
        if (i < 10) {
          console.log(`📋 عينة البيانات - الصف ${i + 1}:`, {
            itemNumber: row[0] || 'فارغ',
            uom: row[1] || 'فارغ',
            lineItem: row[2] || 'فارغ', 
            partNumber: row[3] || 'فارغ',
            description: (row[4] || 'فارغ').substring(0, 50) + '...',
            rfqNumber: row[5] || 'فارغ',
            clientName: row[15] || 'فارغ',
            responsibleEmployee: row[16] || 'فارغ',
            totalColumns: row.length
          });
        }

        items.push(item);
      }

      console.log(`📦 تم استخراج ${items.length} صنف من Google Sheets`);
      console.log(`📊 تفاصيل المعالجة: ${processedRows} صف معالج، ${skippedRows} صف تم تخطيه من إجمالي ${rows.length} صف`);
      
      // التحقق مما حدث مع الصفوف المتبقية
      const missingRows = rows.length - processedRows - skippedRows;
      if (missingRows > 0) {
        console.log(`⚠️ هناك ${missingRows} صف لم يتم معالجته!`);
      }
      
      // التحقق من وجود 25R000057 في الأصناف المعالجة
      const item25R000057 = items.find(item => item.rfqNumber === '25R000057');
      if (item25R000057) {
        console.log(`✅ 25R000057 موجود في الأصناف المعالجة: ${item25R000057.clientName}`);
      } else {
        console.log(`❌ 25R000057 غير موجود في الأصناف المعالجة`);
      }
      
      return items;
    } catch (error) {
      console.error('❌ خطأ في استخراج الأصناف:', (error as Error).message);
      return [];
    }
  }

  async getAllQuotations() {
    try {
      console.log('🔄 getAllQuotations: بدء قراءة طلبات التسعير...');
      
      // قراءة البيانات الخام مباشرة للمقارنة
      const rawData = await this.readDataSheet();
      console.log(`📊 getAllQuotations: قراءة ${rawData.length} صف خام مباشرة`);
      
      // استخدام getAllItemsRaw للحصول على كل الصفوف بدون تصفية
      console.log('⚡ getAllQuotations: استدعاء getAllItemsRaw()...');
      const items = await this.getAllItemsRaw();
      console.log(`📊 getAllQuotations: تم استلام ${items.length} صنف من getAllItemsRaw`);
      
      // المقارنة بين البيانات الخام والأصناف
      if (rawData.length !== items.length) {
        console.log(`⚠️ تحذير: هناك فرق بين البيانات الخام (${rawData.length}) والأصناف المعالجة (${items.length})`);
        console.log(`⚠️ الفرق: ${rawData.length - items.length} صف لم يتم معالجته كصنف`);
      }
      
      const quotationsMap = new Map();

      // تجميع الأصناف حسب RFQ NUMBER
      let skippedItems = 0;
      let rfq25R000057Found = false;
      for (const item of items) {
        if (!item.rfqNumber) {
          skippedItems++;
          continue;
        }
        
        if (item.rfqNumber === '25R000057') {
          rfq25R000057Found = true;
          console.log('🎯 وُجد 25R000057 في الأصناف!');
        }

        if (!quotationsMap.has(item.rfqNumber)) {
          quotationsMap.set(item.rfqNumber, {
            id: `rfq-sheets-${item.rfqNumber}`,
            requestNumber: item.rfqNumber, // رقم الطلب من العمود F
            customRequestNumber: item.rfqNumber, // رقم الطلب من العمود F
            clientName: item.clientName && item.clientName.trim() && item.clientName.trim() !== '""' ? item.clientName.trim() : 'غير محدد', // اسم العميل من العمود P
            requestDate: item.requestDate, // التاريخ من العمود G
            expiryDate: item.responseDate || null, // تاريخ الانتهاء من العمود J
            responsibleEmployee: item.responsibleEmployee && item.responsibleEmployee.trim() ? item.responsibleEmployee.trim() : 'غير محدد', // الموظف المسؤول من العمود Q
            status: 'completed',
            notes: `طلب مستورد من Google Sheets`,
            totalItems: 0,
            totalValue: 0,
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }

        const quotation = quotationsMap.get(item.rfqNumber);
        quotation.items.push(item);
        quotation.totalItems++;
        
        // حساب القيمة الإجمالية
        const value = parseFloat(item.totalValue?.toString().replace(/[^\d.-]/g, '') || '0');
        if (!isNaN(value)) {
          quotation.totalValue += value;
        }
      }

      const quotations = Array.from(quotationsMap.values());
      console.log(`📋 تم استخراج ${quotations.length} طلب تسعير من Google Sheets`);
      console.log(`📊 تفاصيل المعالجة: ${skippedItems} صنف بدون RFQ، 25R000057 ${rfq25R000057Found ? 'موجود ✅' : 'غير موجود ❌'}`);
      
      // البحث عن 25R000057 في الطلبات النهائية
      const targetQuotation = quotations.find(q => q.requestNumber === '25R000057');
      if (targetQuotation) {
        console.log('✅ 25R000057 موجود في الطلبات النهائية');
      } else {
        console.log('❌ 25R000057 غير موجود في الطلبات النهائية');
      }
      
      return quotations;
    } catch (error) {
      console.error('❌ خطأ في استخراج طلبات التسعير:', (error as Error).message);
      return [];
    }
  }

  async getAllPurchaseOrders() {
    try {
      // استخدام getAllItemsRaw للحصول على كل الصفوف
      const items = await this.getAllItemsRaw();
      const poMap = new Map();

      // تجميع الأصناف حسب PO NUMBER
      for (const item of items) {
        if (!item.poNumber || item.poNumber === '') continue;

        if (!poMap.has(item.poNumber)) {
          poMap.set(item.poNumber, {
            id: `po-sheets-${item.poNumber}`,
            poNumber: item.poNumber,
            quotationNumber: item.rfqNumber,
            orderDate: item.poDate,
            status: 'confirmed',
            supplierName: item.clientName || 'الموردين المعتمدين', // اسم العميل من العمود P
            currency: 'EGP',
            totalAmount: 0,
            deliveryStatus: 'delivered',
            itemsCount: 0,
            items: []
          });
        }

        const po = poMap.get(item.poNumber);
        po.items.push(item);
        po.itemsCount++;
        
        // حساب القيمة الإجمالية من الكمية والسعر
        const quantity = parseFloat(item.poQuantity?.toString().replace(/[^\d.-]/g, '') || '0');
        const price = parseFloat(item.poPrice?.toString().replace(/[^\d.-]/g, '') || '0');
        if (!isNaN(quantity) && !isNaN(price) && quantity > 0 && price > 0) {
          po.totalAmount += quantity * price;
        }
      }

      const purchaseOrders = Array.from(poMap.values());
      console.log(`🛒 تم استخراج ${purchaseOrders.length} أمر شراء من Google Sheets`);
      
      // عرض تفاصيل أمر P25ETEST إذا كان موجوداً
      const testPO = purchaseOrders.find(po => po.poNumber === 'P25ETEST');
      if (testPO) {
        console.log('📋 تفاصيل P25ETEST:', {
          poNumber: testPO.poNumber,
          orderDate: testPO.orderDate,
          totalAmount: testPO.totalAmount,
          itemsCount: testPO.itemsCount
        });
      }
      
      return purchaseOrders;
    } catch (error) {
      console.error('❌ خطأ في استخراج أوامر الشراء:', (error as Error).message);
      return [];
    }
  }

  async getStatistics() {
    try {
      const [items, quotations, purchaseOrders, totalValue] = await Promise.all([
        this.getAllItems(),
        this.getAllQuotations(),
        this.getAllPurchaseOrders(),
        this.calculateTotalValue()
      ]);

      return {
        totalItems: items.length,
        totalQuotations: quotations.length,
        totalPurchaseOrders: purchaseOrders.length,
        totalValue: totalValue,
        targetValue: global.TARGET_TOTAL_VALUE,
        accuracyPercentage: totalValue === global.TARGET_TOTAL_VALUE ? 100 : 
          ((totalValue / global.TARGET_TOTAL_VALUE) * 100).toFixed(2)
      };
    } catch (error) {
      console.error('❌ خطأ في حساب الإحصائيات:', (error as Error).message);
      return {
        totalItems: 0,
        totalQuotations: 0,
        totalPurchaseOrders: 0,
        totalValue: 0,
        targetValue: global.TARGET_TOTAL_VALUE,
        accuracyPercentage: 0
      };
    }
  }

  // Methods for Telegram Bot Support
  async getLatestQuotations(limit: number = 5): Promise<any[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A2:AA'
      });

      const rows = response.data.values || [];
      const quotations = [];
      const seenRfqNumbers = new Set();

      // Process rows to get unique quotations
      for (const row of rows) {
        if (row[5]) { // Column F contains RFQ Number
          const rfqNumber = row[5];
          if (!seenRfqNumbers.has(rfqNumber)) {
            seenRfqNumbers.add(rfqNumber);
            quotations.push({
              rfqNumber: rfqNumber,
              requestDate: row[6] || '', // Column G - Request Date
              clientName: row[16] || '', // Column Q - Client Name
              expiryDate: row[9] || '' // Column J - Expiry Date
            });
          }
        }
      }

      // Sort by date and return latest
      return quotations
        .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('❌ خطأ في جلب آخر طلبات التسعير:', error);
      return [];
    }
  }

  async getPendingItems(limit: number = 10): Promise<any[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A2:AA'
      });

      const rows = response.data.values || [];
      const pendingItems = [];

      // Get items that might be pending (no price or incomplete data)
      for (const row of rows) {
        if (row[3] && row[4]) { // Part Number and Description exist
          const hasPrice = row[11] && parseFloat(row[11]) > 0; // Check if has price
          
          if (!hasPrice) {
            pendingItems.push({
              partNumber: row[3] || '', // Column D - Part Number
              description: row[4] || '', // Column E - Description
              rfqNumber: row[5] || '', // Column F - RFQ Number
              requestDate: row[6] || '', // Column G - Request Date
              quantity: row[7] || '', // Column H - Quantity
              clientName: row[16] || '' // Column Q - Client Name
            });
          }
        }
      }

      return pendingItems.slice(0, limit);
    } catch (error) {
      console.error('❌ خطأ في جلب البنود المعلقة:', error);
      return [];
    }
  }

  async getAllItems(): Promise<any[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A2:AA'
      });

      const rows = response.data.values || [];
      const items = [];

      for (const row of rows) {
        if (row[3] && row[4]) { // Part Number and Description exist
          items.push({
            id: row[0] || '', // Column A - Item Number
            itemNumber: row[0] || '',
            partNumber: row[3] || '', // Column D - Part Number
            description: row[4] || '', // Column E - Description
            rfqNumber: row[5] || '', // Column F - RFQ Number
            requestDate: row[6] || '', // Column G - Request Date
            quantity: row[7] || '', // Column H - Quantity
            poNumber: row[10] || '', // Column K - رقم أمر الشراء
            poDate: row[11] || '', // Column L - تاريخ أمر الشراء
            poQuantity: row[12] || '', // Column M - كمية أمر الشراء
            poPrice: row[13] || '', // Column N - سعر أمر الشراء
            clientName: row[16] || '' // Column Q - Client Name
          });
        }
      }

      return items;
    } catch (error) {
      console.error('❌ خطأ في جلب جميع الأصناف:', error);
      return [];
    }
  }

  /**
   * قراءة البيانات من صفحة تسعير الموردين
   */
  async getItemsReadyForSupplierPricing(): Promise<any[]> {
    try {
      if (!this.sheets) {
        console.log('❌ Google Sheets غير مُهيأ');
        return [];
      }

      const sheetName = 'تسعير_الموردين';
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A2:AA`, // قراءة كل البيانات بدون حد للصفوف
      });

      const rows = response.data.values || [];
      console.log(`📊 تم قراءة ${rows.length} صف من صفحة تسعير الموردين`);
      
      if (rows.length > 0) {
        console.log(`🔍 مثال على صف: الحالة في العمود Z (فهرس 25): "${rows[0][25] || 'فارغ'}"`);
      }

      // تحويل البيانات إلى تنسيق مناسب مع الحقول الجديدة
      const items = rows.map((row: any[], index: number) => ({
        id: `supplier-${index + 2}`,
        itemNumber: row[0] || '',
        partNumber: row[1] || '',
        description: row[2] || '',
        uom: row[3] || '',
        quantity: row[4] || '',
        rfqNumber: row[5] || '',
        clientName: row[6] || '',
        requestDate: row[7] || '',
        expiryDate: row[8] || '',
        // بيانات المورد المحسنة
        supplierName: row[9] || '',
        supplierContact: row[10] || '', // جهة الاتصال
        supplierPhone: row[11] || '', // الهاتف
        supplierEmail: row[12] || '', // البريد الإلكتروني
        supplierAddress: row[13] || '', // العنوان
        // بيانات التسعير
        unitPrice: row[14] || '',
        totalPrice: row[15] || '',
        currency: row[16] || '',
        // معلومات ضريبة القيمة المضافة
        vatIncluded: row[17] || 'لا', // هل السعر يشمل ضريبة القيمة المضافة
        vatRate: row[18] || '14%', // معدل ضريبة القيمة المضافة
        priceBeforeVat: row[19] || '', // السعر قبل الضريبة
        vatAmount: row[20] || '', // مبلغ الضريبة
        // تفاصيل إضافية
        deliveryTime: row[21] || '',
        paymentTerms: row[22] || '', // شروط الدفع
        warrantyPeriod: row[23] || '', // فترة الضمان
        notes: row[24] || '',
        status: row[25] || 'جديد',
        employeeName: row[26] || ''
      })).filter((item: any) => {
        // التحقق من وجود رقم البند
        if (!item.itemNumber) return false;
        
        // التحقق من الحالة
        if (item.status === "مُسعّر" || item.status === "مكتمل" || item.status === "منتهي") {
          return false;
        }
        
        // التحقق من تاريخ الانتهاء
        if (item.expiryDate) {
          const expiryDate = new Date(item.expiryDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // إذا انتهى تاريخ الصلاحية، لا نعرض البند
          if (expiryDate < today) {
            console.log(`⏰ إخفاء البند ${item.itemNumber} - انتهى في ${item.expiryDate}`);
            return false;
          }
        }
        
        return true;
      });

      return items;
    } catch (error) {
      console.error('❌ خطأ في قراءة صفحة تسعير الموردين:', (error as Error).message);
      return [];
    }
  }

  /**
   * قراءة البيانات من صفحة تسعير العملاء
   */
  async getItemsReadyForCustomerPricing(): Promise<any[]> {
    try {
      if (!this.sheets) {
        console.log('❌ Google Sheets غير مُهيأ');
        return [];
      }

      const sheetName = 'تسعير_العملاء';
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A2:P`, // قراءة كل البيانات بدون حد للصفوف
      });

      const rows = response.data.values || [];
      console.log(`📊 تم قراءة ${rows.length} صف من صفحة تسعير العملاء`);

      // تحويل البيانات إلى تنسيق مناسب
      const items = rows.map((row: any[], index: number) => ({
        id: `customer-${index + 2}`,
        itemNumber: row[0] || '',
        partNumber: row[1] || '',
        description: row[2] || '',
        uom: row[3] || '',
        quantity: row[4] || '',
        rfqNumber: row[5] || '',
        clientName: row[6] || '',
        requestDate: row[7] || '',
        expiryDate: row[8] || '',
        customerUnitPrice: row[9] || '',
        customerTotalPrice: row[10] || '',
        supplierUnitPrice: row[11] || '',
        profitMargin: row[12] || '',
        currency: row[13] || '',
        notes: row[14] || '',
        status: row[15] || 'في انتظار تسعير الموردين',
        lineItem: '' // سيتم ملؤه من صفحة DATA
      })).filter((item: any) => {
        // التحقق من وجود رقم البند
        if (!item.itemNumber) return false;
        
        // التحقق من الحالة
        if (item.status === "مُسعّر" || item.status === "مكتمل" || item.status === "منتهي") {
          return false;
        }
        
        // التحقق من تاريخ الانتهاء
        if (item.expiryDate) {
          const expiryDate = new Date(item.expiryDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // إذا انتهى تاريخ الصلاحية، لا نعرض البند
          if (expiryDate < today) {
            console.log(`⏰ إخفاء البند ${item.itemNumber} - انتهى في ${item.expiryDate}`);
            return false;
          }
        }
        
        return true;
      });

      // الآن نحتاج لجلب LINE ITEM من صفحة DATA لكل بند
      if (items.length > 0) {
        try {
          const dataResponse = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: 'DATA!A2:AA', // قراءة كل البيانات من صفحة DATA
          });

          const dataRows = dataResponse.data.values || [];
          console.log(`📊 تم قراءة ${dataRows.length} صف من صفحة DATA للبحث عن LINE ITEM`);

          // مطابقة كل بند مع LINE ITEM من صفحة DATA وتصحيح معرف البند بعد التوحيد
          for (const item of items) {
            let foundWithRfq = false;
            let correctItemNumber = item.itemNumber; // الافتراضي هو المعرف الأصلي
            
            // أولاً: البحث عن تطابق دقيق بين Item Number (العمود A) و RFQ Number (العمود F)
            for (const dataRow of dataRows) {
              const dataItemNumber = dataRow[0]; // العمود A - Item Number
              const dataLineItem = dataRow[2]; // العمود C - LINE ITEM
              const dataRfqNumber = dataRow[5]; // العمود F - RFQ Number

              if (dataItemNumber === item.itemNumber && dataRfqNumber === item.rfqNumber) {
                item.lineItem = dataLineItem || '';
                foundWithRfq = true;
                if (dataLineItem) {
                  console.log(`✅ تم العثور على LINE ITEM للبند ${item.itemNumber} في RFQ ${item.rfqNumber}: ${dataLineItem}`);
                }
                break;
              }
            }
            
            // إذا لم نجد بمعرف البند، نبحث بـ Part Number + RFQ (البحث الذكي)
            if (!foundWithRfq && item.partNumber) {
              console.log(`🔍 البحث الذكي: البحث بـ Part Number "${item.partNumber}" + RFQ "${item.rfqNumber}"`);
              
              for (const dataRow of dataRows) {
                const dataPartNumber = (dataRow[3] || '').trim(); // العمود D - Part Number
                const dataRfqNumber = (dataRow[5] || '').trim(); // العمود F - RFQ Number
                
                if (dataPartNumber === item.partNumber && dataRfqNumber === item.rfqNumber) {
                  item.lineItem = dataRow[2] || ''; // العمود C - LINE ITEM
                  correctItemNumber = dataRow[0] || item.itemNumber; // المعرف الصحيح من DATA
                  foundWithRfq = true;
                  
                  if (correctItemNumber !== item.itemNumber) {
                    console.log(`⚠️ تصحيح معرف البند: ${item.itemNumber} → ${correctItemNumber}`);
                    item.itemNumber = correctItemNumber; // تحديث المعرف الصحيح
                  }
                  
                  if (item.lineItem) {
                    console.log(`🎯 البحث الذكي نجح! LINE ITEM: ${item.lineItem}`);
                  }
                  break;
                }
              }
            }
            
            // إذا لم نجد تطابق كامل، نبحث بـ Part Number فقط
            if (!foundWithRfq && item.partNumber) {
              console.log(`🔍 البحث الذكي: البحث بـ Part Number فقط "${item.partNumber}"`);
              
              for (const dataRow of dataRows) {
                const dataPartNumber = (dataRow[3] || '').trim(); // العمود D - Part Number
                
                if (dataPartNumber === item.partNumber) {
                  item.lineItem = dataRow[2] || ''; // العمود C - LINE ITEM
                  correctItemNumber = dataRow[0] || item.itemNumber; // المعرف الصحيح من DATA
                  
                  if (correctItemNumber !== item.itemNumber) {
                    console.log(`⚠️ تصحيح معرف البند: ${item.itemNumber} → ${correctItemNumber}`);
                    item.itemNumber = correctItemNumber; // تحديث المعرف الصحيح
                  }
                  
                  if (item.lineItem) {
                    console.log(`✅ البحث الذكي نجح! LINE ITEM: ${item.lineItem}`);
                  }
                  break;
                }
              }
            }
            
            // إذا لم نجد بالبحث الذكي، نبحث عن البند بمعرفه الأصلي فقط
            if (!foundWithRfq && !item.lineItem) {
              for (const dataRow of dataRows) {
                const dataItemNumber = dataRow[0]; // العمود A - Item Number
                const dataLineItem = dataRow[2]; // العمود C - LINE ITEM
                
                if (dataItemNumber === item.itemNumber) {
                  item.lineItem = dataLineItem || '';
                  if (dataLineItem) {
                    console.log(`✅ وجدت LINE ITEM للبند ${item.itemNumber} (بدون تطابق RFQ): ${dataLineItem}`);
                  }
                  break;
                }
              }
            }
            
            if (!item.lineItem) {
              console.log(`⚠️ لم يتم العثور على LINE ITEM للبند ${item.itemNumber}`);
            }
          }
        } catch (dataError) {
          console.error('⚠️ خطأ في قراءة LINE ITEM من صفحة DATA:', (dataError as Error).message);
          // نستمر بدون LINE ITEM في حالة الخطأ
        }
      }

      return items;
    } catch (error) {
      console.error('❌ خطأ في قراءة صفحة تسعير العملاء:', (error as Error).message);
      return [];
    }
  }

  /**
   * الحصول على كل الصفوف المتعلقة بالبند من ورقة DATA
   */
  async getAllDataRowsForItem(itemId: string): Promise<any[]> {
    try {
      if (!this.sheets) {
        console.error('❌ Google Sheets غير مهيأ');
        return [];
      }

      console.log(`🔍 البحث عن كل الصفوف للبند ${itemId} في ورقة DATA`);

      const dataResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A2:Z20000', // نقرأ حتى الصف 20000 لضمان قراءة كل البيانات
      });

      const dataRows = dataResponse.data.values || [];
      const itemRows = [];
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowItemNumber = (row[0] || '').trim();
        
        if (rowItemNumber === itemId) {
          const rowData = {
            itemNumber: row[0] || '',       // العمود A - معرف البند
            uom: row[1] || '',              // العمود B - UOM
            line_item: row[2] || '',        // العمود C - LINE ITEM
            part_no: row[3] || '',          // العمود D - PART NO
            description: row[4] || '',      // العمود E - DESCRIPTION
            rfq_number: row[5] || '',       // العمود F - RFQ
            rfq_date: row[6] || '',         // العمود G - DATE/RFQ
            rfq_qty: row[7] || '',          // العمود H - QTY
            customer_price: row[8] || '',   // العمود I - PRICE RFQ
            res_date: row[9] || '',         // العمود J - RES. DATE
            po_number: row[10] || '',       // العمود K - PO
            po_date: row[11] || '',         // العمود L - DATE/PO
            po_quantity: row[12] || '',     // العمود M - Quantity/PO
            po_price: row[13] || '',        // العمود N - PRICE/PO
            po_total: row[14] || '',        // العمود O - TOTAL PO
            client_name: row[15] || '',     // العمود P - العميل
            employee_name: row[16] || '',   // العمود Q - الموظف المسؤول
            category: 'ELEC',               // Default category
          };
          itemRows.push(rowData);
          console.log(`📌 وجدت البند ${itemId} في الصف ${i + 2}: RFQ="${row[5]}", LINE_ITEM="${row[2]}"`);
        }
      }
      
      console.log(`✅ تم العثور على ${itemRows.length} صف للبند ${itemId}`);
      return itemRows;
    } catch (error) {
      console.error('❌ خطأ في الحصول على صفوف البند:', error);
      return [];
    }
  }

  /**
   * الحصول على تفاصيل بند بواسطة معرف البند من صفحة تسعير العملاء وربطه بصفحة DATA
   */
  async getItemDetailsById(itemId: string): Promise<any> {
    try {
      if (!this.sheets) {
        console.log('❌ Google Sheets غير مُهيأ');
        return null;
      }

      // أولاً: البحث في صفحة تسعير العملاء للحصول على البيانات الكاملة
      const customerPricingResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'تسعير_العملاء!A2:Q',
      });

      const customerRows = customerPricingResponse.data.values || [];
      let customerItemData: any = null;

      // البحث عن البند في صفحة تسعير العملاء
      for (const row of customerRows) {
        if (row[0] === itemId) { // العمود A - Item Number
          // استخراج جميع البيانات من صفحة تسعير العملاء
          customerItemData = {
            itemNumber: row[0] || '', // العمود A - Item Number
            partNumber: row[1] || '', // العمود B - Part Number
            description: row[2] || '', // العمود C - Description (التوصيف)
            uom: row[3] || 'EACH', // العمود D - UOM
            quantity: row[4] || '1', // العمود E - Quantity
            rfqNumber: row[5] || '', // العمود F - RFQ Number
            clientName: row[6] || '', // العمود G - Client Name
            requestDate: row[7] || '', // العمود H - Request Date
            expiryDate: row[8] || '', // العمود I - Expiry Date
            customerUnitPrice: row[9] || '', // العمود J - Customer Unit Price
            customerTotalPrice: row[10] || '', // العمود K - Customer Total Price
            supplierUnitPrice: row[11] || '', // العمود L - Supplier Unit Price
            profitMargin: row[12] || '', // العمود M - Profit Margin
            currency: row[13] || '', // العمود N - Currency
            notes: row[14] || '', // العمود O - Notes
            status: row[15] || '', // العمود P - Status
            employeeName: row[16] || '' // العمود Q - Employee Name
            // LINE ITEM غير موجود هنا - سيتم جلبه من صفحة DATA
          };
          console.log(`📋 تم العثور على البند في صفحة تسعير العملاء: ${itemId}, RFQ: ${customerItemData.rfqNumber}`);
          break;
        }
      }

      if (!customerItemData) {
        console.log(`❌ لم يتم العثور على البند ${itemId} في صفحة تسعير العملاء`);
        return null;
      }
      
      const rfqNumber = customerItemData.rfqNumber;

      // LINE ITEM دائماً يأتي من صفحة DATA وليس من صفحة تسعير العملاء
      console.log(`🔍 البحث عن LINE ITEM في صفحة DATA للبند ${itemId} في طلب التسعير ${rfqNumber}`);

      // ثانياً: البحث في صفحة DATA للحصول على LINE ITEM إذا لم يكن موجوداً
      const dataResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'DATA!A2:Z20000', // نقرأ حتى الصف 20000 لضمان قراءة كل البيانات
      });

      const dataRows = dataResponse.data.values || [];

      // البحث عن السجل الذي يحتوي على رقم طلب التسعير والبند المطلوب
      console.log(`📊 عدد الصفوف في صفحة DATA: ${dataRows.length}`);
      
      // طباعة أول 5 صفوف للتحقق من البنية
      if (dataRows.length > 0) {
        console.log('🔍 أمثلة من البيانات في صفحة DATA:');
        for (let j = 0; j < Math.min(5, dataRows.length); j++) {
          console.log(`  الصف ${j + 2}: A="${dataRows[j][0]||''}", B="${dataRows[j][1]||''}", C="${dataRows[j][2]||''}", F="${dataRows[j][5]||''}"`);
        }
        
        // طباعة الصف 191 تحديداً إذا كان موجوداً
        if (dataRows.length >= 190) {
          const row189 = dataRows[189]; // الصف 191 في Google Sheets (الفهرس 189 في المصفوفة)
          console.log(`📍 الصف 191 تحديداً: A="${row189?.[0]||''}", B="${row189?.[1]||''}", C="${row189?.[2]||''}", D="${row189?.[3]||''}", E="${row189?.[4]||''}", F="${row189?.[5]||''}"`);
        }
      }
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowRfqNumber = (row[5] || '').trim(); // العمود F - RFQ Number
        const rowItemNumber = (row[0] || '').trim(); // العمود A - Item Number
        const rowPartNumber = row[3] || ''; // العمود D - PART NO
        const rowDescription = row[4] || ''; // العمود E - Description
        
        // طباعة السجلات التي تحتوي على البند المطلوب للتتبع
        if (rowItemNumber === itemId) {
          console.log(`📌 وجدت ${itemId} في الصف ${i + 2}: RFQ="${rowRfqNumber}" (يُبحث عن "${rfqNumber}"), LINE_ITEM="${row[2]||'فارغ'}"`);
        }

        // البحث عن مطابقة كاملة: رقم البند + رقم طلب التسعير
        if (rowItemNumber === itemId && rowRfqNumber === rfqNumber) {
          console.log(`🎯 مطابقة كاملة! البند ${itemId} مع RFQ ${rfqNumber} في الصف ${i + 2}`);
          
          // البحث عن سعر المورد واسم المورد في ورقة تسعير الموردين
          let supplierPrice = '';
          let supplierName = '';
          try {
            const supplierResponse = await this.sheets.spreadsheets.values.get({
              spreadsheetId: this.spreadsheetId,
              range: 'تسعير_الموردين!A2:Z',
            });
            
            const supplierRows = supplierResponse.data.values || [];
            console.log(`🔍 البحث عن سعر المورد للبند ${itemId} مع RFQ ${rfqNumber} في ${supplierRows.length} صف`);
            
            // طباعة أول 5 صفوف للتحقق من البنية
            if (supplierRows.length > 0) {
              console.log('📊 أمثلة من ورقة تسعير الموردين:');
              for (let j = 0; j < Math.min(5, supplierRows.length); j++) {
                const row = supplierRows[j];
                console.log(`  الصف ${j + 2}:`);
                console.log(`    A="${row[0]||''}" (البند)`);
                console.log(`    F="${row[5]||''}" (RFQ المحتمل)`);
                console.log(`    J="${row[9]||''}" (اسم المورد)`);
                console.log(`    O="${row[14]||''}" (السعر)`);
                console.log(`    P="${row[15]||''}" (العمود P)`);
                console.log(`    Q="${row[16]||''}" (العمود Q)`);
              }
            }
            
            let foundCount = 0;
            for (let idx = 0; idx < supplierRows.length; idx++) {
              const supplierRow = supplierRows[idx];
              const supplierItemNumber = (supplierRow[0] || '').trim();
              const supplierRfqNumber = (supplierRow[5] || '').trim(); // العمود F - RFQ Number الصحيح
              const rowSupplierName = supplierRow[9] || ''; // العمود J - اسم المورد
              const supplierUnitPrice = supplierRow[14] || ''; // العمود O - سعر المورد
              
              // طباعة كل سجل يحتوي على البند المطلوب
              if (supplierItemNumber === itemId) {
                foundCount++;
                console.log(`📌 وجدت ${itemId} في ورقة تسعير الموردين، الصف ${idx + 2}: RFQ="${supplierRfqNumber}" (يُبحث عن "${rfqNumber}"), المورد="${rowSupplierName}", السعر="${supplierUnitPrice}"`);
              }
              
              if (supplierItemNumber === itemId && supplierRfqNumber === rfqNumber) {
                supplierPrice = supplierUnitPrice;
                supplierName = rowSupplierName;
                console.log(`💰 تم العثور على سعر المورد من العمود O في الصف ${idx + 2}: ${supplierPrice} من المورد: ${supplierName}`);
                break;
              }
            }
            
            if (!supplierPrice) {
              console.log(`⚠️ لم يتم العثور على سعر المورد في ورقة تسعير الموردين (وجدت ${foundCount} سجل للبند بدون تطابق RFQ)`);
            }
          } catch (error) {
            console.error('❌ خطأ في البحث عن سعر المورد:', error);
          }
          
          const mergedData = {
            ...customerItemData,
            itemId: itemId,
            lineItem: row[2] || '', // العمود C من صفحة DATA - LINE ITEM
            supplierUnitPrice: supplierPrice || customerItemData.supplierUnitPrice, // سعر المورد من ورقة تسعير الموردين
            supplierName: supplierName, // اسم المورد من ورقة تسعير الموردين
          };
          
          if (row[2] && row[2].trim() !== '') {
            console.log(`✅ تم العثور على LINE ITEM: ${row[2]}`);
          } else {
            console.log(`⚠️ التطابق موجود لكن LINE ITEM فارغ في الصف ${i + 2}`);
          }
          
          console.log(`📊 البيانات المدمجة:`, mergedData);
          return mergedData;
        }
      }
      
      // لم نجد مطابقة كاملة (رقم البند + رقم طلب التسعير)
      // لكن دعنا نبحث عن البند فقط بغض النظر عن رقم طلب التسعير
      console.log(`⚠️ لم يتم العثور على تطابق كامل، البحث عن البند ${itemId} بدون قيد RFQ`);
      
      let lineItemFromAnyRow = '';
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowItemNumber = (row[0] || '').trim(); // العمود A - Item Number
        
        // إذا وجدنا البند، نأخذ LINE ITEM منه
        if (rowItemNumber === itemId) {
          lineItemFromAnyRow = row[2] || ''; // العمود C - LINE ITEM
          console.log(`✅ وجدت LINE ITEM للبند ${itemId} في الصف ${i + 2}: "${lineItemFromAnyRow}"`);
          break;
        }
      }
      
      // إذا لم نجد البند برقمه، نبحث بـ Part Number + RFQ
      let correctItemNumber = itemId; // الافتراضي هو المعرف الأصلي
      if (!lineItemFromAnyRow && customerItemData) {
        console.log(`🔍 البحث الذكي: البحث بـ Part Number "${customerItemData.partNumber}" + RFQ "${rfqNumber}"`);
        
        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const rowPartNumber = (row[3] || '').trim(); // العمود D - Part Number
          const rowRfqNumber = (row[5] || '').trim(); // العمود F - RFQ Number
          
          // البحث بـ Part Number + RFQ
          if (rowPartNumber === customerItemData.partNumber && rowRfqNumber === rfqNumber) {
            lineItemFromAnyRow = row[2] || ''; // العمود C - LINE ITEM
            console.log(`🎯 البحث الذكي نجح! وجدت LINE ITEM في الصف ${i + 2} للبند ذو Part Number "${rowPartNumber}": LINE ITEM="${lineItemFromAnyRow}"`);
            
            // تحديث رقم البند الصحيح من صفحة DATA
            correctItemNumber = row[0] || itemId; // استخدم المعرف من DATA إن وجد
            if (correctItemNumber && correctItemNumber !== itemId) {
              console.log(`⚠️ تصحيح رقم البند: الرقم في تسعير_العملاء=${itemId}, الرقم الصحيح في DATA=${correctItemNumber}`);
              customerItemData.itemNumber = correctItemNumber; // تحديث المعرف في البيانات المرجعة
            }
            break;
          }
        }
        
        // إذا لم نجد بـ Part Number + RFQ، نبحث بـ Part Number فقط
        if (!lineItemFromAnyRow) {
          console.log(`🔍 البحث الذكي: البحث بـ Part Number فقط "${customerItemData.partNumber}"`);
          
          for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            const rowPartNumber = (row[3] || '').trim(); // العمود D - Part Number
            
            if (rowPartNumber === customerItemData.partNumber) {
              lineItemFromAnyRow = row[2] || ''; // العمود C - LINE ITEM
              console.log(`✅ البحث الذكي نجح! وجدت LINE ITEM بـ Part Number في الصف ${i + 2}: "${lineItemFromAnyRow}"`);
              
              // تحديث رقم البند الصحيح من صفحة DATA
              correctItemNumber = row[0] || itemId; // استخدم المعرف من DATA إن وجد
              if (correctItemNumber && correctItemNumber !== itemId) {
                console.log(`⚠️ تصحيح رقم البند: الرقم في تسعير_العملاء=${itemId}, الرقم الصحيح في DATA=${correctItemNumber}`);
                customerItemData.itemNumber = correctItemNumber; // تحديث المعرف في البيانات المرجعة
              }
              break;
            }
          }
        }
      }
      
      // تحديث معرف البند في كل الحالات إذا تم العثور على المعرف الصحيح
      if (correctItemNumber !== itemId) {
        customerItemData.itemNumber = correctItemNumber;
      }
      
      // البحث في ورقة تسعير الموردين للحصول على سعر المورد واسم المورد
      console.log(`🔍 البحث عن سعر المورد في ورقة تسعير الموردين`);
      
      let supplierPrice = '';
      let supplierName = '';
      try {
        const supplierResponse = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: 'تسعير_الموردين!A2:Z', // قراءة كل البيانات بدون حد للصفوف
        });
        
        const supplierRows = supplierResponse.data.values || [];
        console.log(`🔍 البحث عن سعر المورد للبند ${itemId} مع RFQ ${rfqNumber} في ${supplierRows.length} صف`);
        
        // طباعة أول 5 صفوف للتحقق من البنية
        if (supplierRows.length > 0) {
          console.log('📊 أمثلة من ورقة تسعير الموردين:');
          for (let j = 0; j < Math.min(5, supplierRows.length); j++) {
            const row = supplierRows[j];
            console.log(`  الصف ${j + 2}:`);
            console.log(`    A="${row[0]||''}" (البند)`);
            console.log(`    F="${row[5]||''}" (RFQ المحتمل)`);
            console.log(`    J="${row[9]||''}" (اسم المورد)`);
            console.log(`    O="${row[14]||''}" (السعر)`);
            console.log(`    P="${row[15]||''}" (العمود P)`);
            console.log(`    Q="${row[16]||''}" (العمود Q)`);
          }
        }
        
        let foundCount = 0;
        // البحث عن البند في ورقة تسعير الموردين
        for (let idx = 0; idx < supplierRows.length; idx++) {
          const row = supplierRows[idx];
          const rowItemNumber = (row[0] || '').trim(); // العمود A - Item Number
          const rowRfqNumber = (row[5] || '').trim(); // العمود F - RFQ Number الصحيح
          const rowSupplierName = row[9] || ''; // العمود J - اسم المورد
          const rowSupplierPrice = row[14] || ''; // العمود O - سعر المورد
          
          // طباعة كل سجل يحتوي على البند المطلوب
          if (rowItemNumber === itemId) {
            foundCount++;
            console.log(`📌 وجدت ${itemId} في ورقة تسعير الموردين، الصف ${idx + 2}: RFQ="${rowRfqNumber}" (يُبحث عن "${rfqNumber}"), المورد="${rowSupplierName}", السعر="${rowSupplierPrice}"`);
          }
          
          if (rowItemNumber === itemId && rowRfqNumber === rfqNumber) {
            supplierPrice = rowSupplierPrice;
            supplierName = rowSupplierName;
            console.log(`✅ تم العثور على سعر المورد من العمود O في الصف ${idx + 2}: ${supplierPrice} من المورد: ${supplierName}`);
            break;
          }
        }
        
        if (!supplierPrice) {
          console.log(`⚠️ لم يتم العثور على سعر المورد في ورقة تسعير الموردين (وجدت ${foundCount} سجل للبند بدون تطابق RFQ)`);
        }
      } catch (error) {
        console.error('❌ خطأ في البحث عن سعر المورد:', error);
      }
      
      // إرجاع البيانات من صفحة تسعير العملاء مع LINE ITEM من صفحة DATA (إن وُجد)
      const dataWithLineItem = {
        ...customerItemData,
        itemId: itemId,
        lineItem: lineItemFromAnyRow || '', // استخدام LINE ITEM من صفحة DATA إن وُجد
        supplierUnitPrice: supplierPrice || customerItemData.supplierUnitPrice, // استخدام سعر المورد من ورقة تسعير الموردين إن وجد
        supplierName: supplierName, // اسم المورد من ورقة تسعير الموردين
      };
      
      if (lineItemFromAnyRow) {
        console.log(`📊 البيانات المُرجعة (مع LINE ITEM="${lineItemFromAnyRow}"):`, dataWithLineItem);
      } else {
        console.log(`📊 البيانات المُرجعة (بدون LINE ITEM):`, dataWithLineItem);
      }
      return dataWithLineItem;
    } catch (error) {
      console.error('❌ خطأ في الحصول على تفاصيل البند:', (error as Error).message);
      return null;
    }
  }


}

export const googleSheetsRealtimeData = new GoogleSheetsRealtimeData();