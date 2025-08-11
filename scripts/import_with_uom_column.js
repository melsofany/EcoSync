/**
 * استيراد البيانات مع عمود الوحدات (UOM) والربط الصحيح بين RFQ و PO من نفس الصف
 * بدون تشغيل التوحيد التلقائي
 */
import fs from 'fs';
import { neon } from '@neondatabase/serverless';
import { nanoid } from 'nanoid';

const sql = neon(process.env.DATABASE_URL);

// تعطيل التوحيد التلقائي مؤقتاً
const AI_UNIFICATION_DISABLED = true;

// دالة لتحويل التواريخ من Excel
function parseExcelDate(dateStr) {
  if (!dateStr || dateStr === 'null' || typeof dateStr !== 'string') {
    return null;
  }
  
  try {
    const cleanDateStr = dateStr.split(' ')[0].trim();
    
    if (cleanDateStr.includes('-')) {
      const dateParts = cleanDateStr.split('-').map(part => part.trim());
      if (dateParts.length === 3) {
        const [part1, part2, part3] = dateParts;
        
        if (part1.length === 4) {
          const year = parseInt(part1);
          const month = parseInt(part2);
          const day = parseInt(part3);
          
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          }
        } else {
          const num1 = parseInt(part1);
          const num2 = parseInt(part2);
          const year = parseInt(part3);
          
          if (num1 > 12) {
            if (num2 >= 1 && num2 <= 12 && num1 >= 1 && num1 <= 31) {
              return `${year}-${num2.toString().padStart(2, '0')}-${num1.toString().padStart(2, '0')}`;
            }
          } else if (num2 > 12) {
            if (num1 >= 1 && num1 <= 12 && num2 >= 1 && num2 <= 31) {
              return `${year}-${num1.toString().padStart(2, '0')}-${num2.toString().padStart(2, '0')}`;
            }
          } else {
            if (num2 >= 1 && num2 <= 12 && num1 >= 1 && num1 <= 31) {
              return `${year}-${num2.toString().padStart(2, '0')}-${num1.toString().padStart(2, '0')}`;
            }
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`خطأ في تحويل التاريخ: ${dateStr}`, error);
    return null;
  }
}

// دالة توليد رقم بند تلقائي
async function generateNextItemNumber() {
  try {
    const result = await sql`
      SELECT item_number 
      FROM items 
      WHERE item_number ~ '^P-[0-9]+$' 
      ORDER BY CAST(SUBSTRING(item_number FROM 3) AS INTEGER) DESC 
      LIMIT 1
    `;
    
    let nextNumber = 1;
    if (result.length > 0) {
      const lastNumber = parseInt(result[0].item_number.replace('P-', ''));
      nextNumber = lastNumber + 1;
    }
    
    return `P-${nextNumber.toString().padStart(6, '0')}`;
  } catch (error) {
    console.error('خطأ في توليد رقم البند:', error);
    return `P-${Date.now()}`;
  }
}

// دالة معالجة البيانات
async function processImportData() {
  try {
    console.log('🚀 بدء الاستيراد مع عمود الوحدات...');
    
    // قراءة البيانات الأصلية مع الأرقام الحقيقية
    const authenticDataPath = './attached_assets/authentic_import_data_5449.json';
    if (!fs.existsSync(authenticDataPath)) {
      throw new Error('ملف البيانات الأصلية غير موجود. يرجى تشغيل extract_real_rfq_numbers.js أولاً');
    }
    
    const excelData = JSON.parse(fs.readFileSync(authenticDataPath, 'utf8'));
    console.log(`📊 تم تحميل ${excelData.length} صف من البيانات`);
    
    // إحصائيات الاستيراد
    let processedRows = 0;
    let createdQuotations = 0;
    let createdPOs = 0;
    let createdItems = 0;
    let errors = [];
    
    // معالجة كل صف
    for (let i = 0; i < excelData.length && i < 5449; i++) {
      const row = excelData[i];
      processedRows++;
      
      try {
        console.log(`\n📝 معالجة الصف ${i + 1}/${Math.min(excelData.length, 5449)}`);
        
        // استخراج البيانات مع عمود الوحدة و LINE ITEM و PART NO
        const rfqNumber = row['F']; // عمود F - رقم طلب التسعير
        const poNumber = row['L'];  // عمود L - رقم أمر الشراء من نفس الصف
        const description = row['A']; // الوصف
        const lineItem = row['I']; // عمود I - LINE ITEM
        const partNumber = row['PART_NO'] || row['B']; // PART NO المدمج أو عمود B
        const unitOfMeasure = row['H']; // عمود H - الوحدة (UOM)
        const quantity = parseFloat(row['C']) || 0; // الكمية
        const unitPrice = parseFloat(row['D']) || 0; // سعر الوحدة
        
        // التواريخ المحدثة من البيانات الكاملة
        const rfqDate = row['G']; // تاريخ RFQ
        const poDate = row['M'];  // تاريخ PO
        const responseDate = row['J']; // تاريخ الاستجابة
        
        // تخطي الصفوف الفارغة
        if (!description && !rfqNumber && !poNumber) {
          console.log(`⏭️ تخطي الصف ${i + 1} - فارغ`);
          continue;
        }
        
        // إنشاء أو العثور على البند
        let itemId;
        const itemNumber = await generateNextItemNumber();
        
        // إدراج البند مع الوحدة و LINE ITEM و PART NO (بدون عمود notes)
        const itemResult = await sql`
          INSERT INTO items (
            id, item_number, description, part_number, unit, category, created_by
          ) VALUES (
            ${nanoid()}, ${itemNumber}, ${description || 'بند غير محدد'}, 
            ${partNumber || lineItem || null}, ${unitOfMeasure || 'Piece'}, 'مستورد', 
            (SELECT id FROM users WHERE username = 'admin' LIMIT 1)
          ) RETURNING id
        `;
        
        itemId = itemResult[0].id;
        createdItems++;
        console.log(`📦 تم إنشاء البند: ${itemNumber} - PART NO: ${partNumber || 'غير محدد'} - LINE ITEM: ${lineItem || 'غير محدد'} - الوحدة: ${unitOfMeasure || 'Piece'}`);
        
        // إنشاء طلب التسعير إذا كان موجود
        if (rfqNumber) {
          const quotationId = nanoid();
          const requestNumber = `REQ-${Date.now()}-${nanoid(6)}`;
          
          await sql`
            INSERT INTO quotation_requests (
              id, request_number, custom_request_number, request_date,
              expiry_date, status, created_by, notes
            ) VALUES (
              ${quotationId}, ${requestNumber}, ${rfqNumber},
              ${rfqDate || new Date().toISOString()},
              ${rfqDate ? new Date(new Date(rfqDate).getTime() + 7*24*60*60*1000).toISOString() : new Date(Date.now() + 7*24*60*60*1000).toISOString()},
              'pending', 
              (SELECT id FROM users WHERE username = 'admin' LIMIT 1),
              ${`استيراد من Excel - الصف ${i + 1} - PART NO: ${partNumber || 'غير محدد'} - LINE ITEM: ${lineItem || 'غير محدد'} - الوحدة: ${unitOfMeasure || 'Piece'}`}
            )
          `;
          
          // إضافة البند لطلب التسعير
          await sql`
            INSERT INTO quotation_items (
              id, quotation_id, item_id, quantity, unit_price, total_price, currency
            ) VALUES (
              ${nanoid()}, ${quotationId}, ${itemId}, ${quantity}, ${unitPrice},
              ${quantity * unitPrice}, 'EGP'
            )
          `;
          
          createdQuotations++;
          console.log(`📄 تم إنشاء طلب التسعير: ${rfqNumber}`);
          
          // إنشاء أمر الشراء المرتبط من نفس الصف
          if (poNumber) {
            const poId = nanoid();
            
            await sql`
              INSERT INTO purchase_orders (
                id, po_number, quotation_number, quotation_id, order_date, status,
                total_amount, currency, created_by, notes
              ) VALUES (
                ${poId}, ${poNumber}, ${rfqNumber}, ${quotationId}, ${poDate || new Date().toISOString()},
                'pending', ${quantity * unitPrice}, 'EGP',
                (SELECT id FROM users WHERE username = 'admin' LIMIT 1),
                ${`مرتبط بطلب التسعير ${rfqNumber} - الصف ${i + 1} - PART NO: ${partNumber || 'غير محدد'} - LINE ITEM: ${lineItem || 'غير محدد'} - الوحدة: ${unitOfMeasure || 'Piece'}`}
              )
            `;
            
            // إضافة البند لأمر الشراء
            await sql`
              INSERT INTO purchase_order_items (
                id, po_id, item_id, quantity, unit_price, total_price, currency
              ) VALUES (
                ${nanoid()}, ${poId}, ${itemId}, ${quantity}, ${unitPrice},
                ${quantity * unitPrice}, 'EGP'
              )
            `;
            
            createdPOs++;
            console.log(`🛒 تم إنشاء أمر الشراء: ${poNumber} مرتبط بـ ${rfqNumber}`);
          }
        }
        
        // عرض التقدم كل 100 صف
        if (processedRows % 100 === 0) {
          console.log(`\n📊 التقدم: ${processedRows}/5449 صف`);
          console.log(`✅ طلبات التسعير: ${createdQuotations}`);
          console.log(`✅ أوامر الشراء: ${createdPOs}`);
          console.log(`✅ البنود: ${createdItems}`);
        }
        
      } catch (rowError) {
        console.error(`❌ خطأ في الصف ${i + 1}:`, rowError.message);
        errors.push(`الصف ${i + 1}: ${rowError.message}`);
      }
    }
    
    console.log('\n🎉 اكتمل الاستيراد بنجاح!');
    console.log(`📊 النتائج النهائية:`);
    console.log(`   • الصفوف المعالجة: ${processedRows}`);
    console.log(`   • طلبات التسعير: ${createdQuotations}`);
    console.log(`   • أوامر الشراء: ${createdPOs}`);
    console.log(`   • البنود: ${createdItems}`);
    console.log(`   • الأخطاء: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️ الأخطاء:');
      errors.slice(0, 10).forEach(error => console.log(`   ${error}`));
      if (errors.length > 10) {
        console.log(`   ... و ${errors.length - 10} خطأ آخر`);
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ في عملية الاستيراد:', error);
    throw error;
  }
}

// تشغيل الاستيراد
processImportData().catch(error => {
  console.error('فشل الاستيراد:', error);
  process.exit(1);
});