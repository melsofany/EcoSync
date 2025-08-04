import Database from 'better-sqlite3';

const sqlite = new Database('qurtoba.db');

async function addSampleData() {
  console.log('📊 إضافة بيانات عينة للنظام...');
  
  try {
    // الحصول على timestamp ثابت
    const now = Date.now();
    
    // 1. إضافة عملاء جدد
    console.log('👥 إضافة عملاء جدد...');
    
    const clientsData = [
      ['client-atlas-001', 'شركة الأطلس للمقاولات', 'المهندس سلطان الحربي', 'sultan@atlas-contracting.com', '+966122334455', 'الرياض، حي الملز', 0, now - 86400000 * 40, now - 86400000 * 5],
      ['client-mideast-002', 'مجموعة الشرق الأوسط التجارية', 'السيدة هند المطيري', 'hind@me-trading.com', '+966133445566', 'الدمام، الكورنيش', 0, now - 86400000 * 35, now - 86400000 * 8],
      ['client-green-003', 'مؤسسة الخضراء للطاقة المتجددة', 'الدكتور عامر الزهراني', 'amer@green-energy.com', '+966144667788', 'جدة، طريق الملك عبدالله', 0, now - 86400000 * 30, now - 86400000 * 3]
    ];

    const insertClient = sqlite.prepare(`
      INSERT OR REPLACE INTO clients (id, name, contactPerson, email, phone, address, isDeleted, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const client of clientsData) {
      insertClient.run(...client);
    }

    // 2. إضافة موردين جدد
    console.log('🚚 إضافة موردين جدد...');
    
    const suppliersData = [
      ['supplier-elite-001', 'مؤسسة النخبة للتوريدات الفنية', 'المهندس طارق الشمراني', 'tareq@elite-technical.com', '+966144556677', 'جدة، شارع التحلية', 0, now - 86400000 * 50, now - 86400000 * 12],
      ['supplier-medina-002', 'شركة المدينة للأجهزة الكهربائية', 'المهندسة لينا القحطاني', 'lina@medina-electrical.com', '+966155667788', 'المدينة المنورة، طريق الملك عبدالعزيز', 0, now - 86400000 * 45, now - 86400000 * 15],
      ['supplier-advanced-003', 'الشركة المتقدمة للأنظمة الذكية', 'المهندس ماهر الشهري', 'maher@advanced-systems.com', '+966166778899', 'الخبر، مدينة الملك فهد', 0, now - 86400000 * 40, now - 86400000 * 10]
    ];

    const insertSupplier = sqlite.prepare(`
      INSERT OR REPLACE INTO suppliers (id, name, contactPerson, email, phone, address, isDeleted, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const supplier of suppliersData) {
      insertSupplier.run(...supplier);
    }

    // 3. إضافة أصناف جديدة
    console.log('📦 إضافة أصناف جديدة...');
    
    const itemsData = [
      ['item-motor-001', 'ENG-MT-2024-001', '5001.001.MECH.0001', 'محرك تيار متردد أحادي الطور 3 حصان', 'قطعة', 'محركات ومعدات ميكانيكية', 'جهد التشغيل: 220 فولت، تردد: 50 هرتز، سرعة: 1400 دورة/دقيقة، كفاءة: IE3', 'مع شهادة CE وضمان سنتين', 0, now - 86400000 * 60, now - 86400000 * 20],
      ['item-cable-002', 'ELC-CBL-2024-002', '5002.001.ELEC.0001', 'كابل كهربائي متعدد الأطراف 5×2.5 مم²', 'متر', 'كابلات وأسلاك كهربائية', 'نحاس خالص، عزل PVC، مقاوم للحرارة حتى 70°م، جهد 750 فولت', 'حسب المواصفات السعودية SASO', 0, now - 86400000 * 55, now - 86400000 * 18],
      ['item-hvac-003', 'HVAC-AC-2024-003', '5003.001.HVAC.0001', 'وحدة تكييف مركزي تجاري 48000 وحدة حرارية', 'وحدة', 'أنظمة التكييف والتبريد', 'نوع سبليت، غاز R32 صديق للبيئة، ضاغط انفرتر، تحكم ذكي WiFi', 'يشمل التركيب والصيانة لمدة 3 سنوات', 0, now - 86400000 * 50, now - 86400000 * 15],
      ['item-pump-004', 'PMP-CENT-2024-004', '5004.001.PUMP.0001', 'مضخة مياه طرد مركزي 7.5 حصان', 'وحدة', 'مضخات ومعدات المياه', 'تصريف: 75 م³/ساعة، ارتفاع: 45 متر، مدخل: 6 بوصة، مخرج: 4 بوصة', 'مصنوعة من الحديد الزهر المقاوم للصدأ', 0, now - 86400000 * 45, now - 86400000 * 12],
      ['item-panel-005', 'ELC-PNL-2024-005', '5005.001.ELEC.0002', 'لوحة توزيع كهربائية ذكية 400 أمبير', 'وحدة', 'لوحات التوزيع الكهربائية', 'معيار IP54، مع أجهزة قياس رقمية، حماية ذكية ضد التسرب', 'تشمل نظام مراقبة عن بُعد', 0, now - 86400000 * 42, now - 86400000 * 8]
    ];

    const insertItem = sqlite.prepare(`
      INSERT OR REPLACE INTO items (id, partNumber, lineItem, description, unit, category, specifications, notes, isDeleted, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of itemsData) {
      insertItem.run(...item);
    }

    // 4. إضافة طلبات تسعير
    console.log('📋 إضافة طلبات تسعير...');
    
    const quotationsData = [
      ['quot-atlas-001', 'RFQ-2024-ATLAS-001', 'client-atlas-001', now - 86400000 * 18, now + 86400000 * 7, 'pending', 'توريد معدات ميكانيكية لمشروع برج الأطلس', 'يرجى تضمين خدمة التركيب والتدريب', now - 86400000 * 18, now - 86400000 * 5],
      ['quot-green-002', 'RFQ-2024-GREEN-002', 'client-green-003', now - 86400000 * 14, now + 86400000 * 10, 'responded', 'توريد أنظمة الطاقة المتجددة', 'مشروع استراتيجي للطاقة الشمسية', now - 86400000 * 14, now - 86400000 * 3],
      ['quot-mideast-003', 'RFQ-2024-ME-003', 'client-mideast-002', now - 86400000 * 10, now + 86400000 * 15, 'draft', 'توريد أنظمة التكييف والتبريد', 'للمجمع التجاري الجديد', now - 86400000 * 10, now - 86400000 * 1]
    ];

    // التحقق من وجود جدول quotationRequests أو quotation_requests
    const tableExists = sqlite.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND (name='quotationRequests' OR name='quotation_requests')
    `).get();
    
    const quotationTable = tableExists?.name || 'quotationRequests';
    
    const insertQuotation = sqlite.prepare(`
      INSERT OR REPLACE INTO ${quotationTable} (id, requestNumber, clientId, requestDate, responseDate, status, description, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const quot of quotationsData) {
      insertQuotation.run(...quot);
    }

    // 5. إضافة بنود طلبات التسعير
    console.log('📝 إضافة بنود طلبات التسعير...');
    
    const quotationItemsData = [
      ['qi-atlas-001', 'quot-atlas-001', 'item-motor-001', 15, 3200, 48000, 'مع قواعد التثبيت والتوصيل', now - 86400000 * 18],
      ['qi-atlas-002', 'quot-atlas-001', 'item-pump-004', 8, 12500, 100000, 'تشمل أنابيب التوصيل', now - 86400000 * 18],
      ['qi-green-001', 'quot-green-002', 'item-hvac-003', 12, 18500, 222000, 'أنظمة تكييف موفرة للطاقة', now - 86400000 * 14],
      ['qi-green-002', 'quot-green-002', 'item-panel-005', 6, 8500, 51000, 'لوحات ذكية للتحكم في الطاقة', now - 86400000 * 14],
      ['qi-mideast-001', 'quot-mideast-003', 'item-cable-002', 2500, 45, 112500, 'كابلات عالية الجودة', now - 86400000 * 10]
    ];

    const insertQuotationItem = sqlite.prepare(`
      INSERT OR REPLACE INTO quotationItems (id, quotationRequestId, itemId, quantity, unitPrice, totalPrice, notes, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of quotationItemsData) {
      insertQuotationItem.run(...item);
    }

    // 6. إضافة أوامر شراء
    console.log('🛒 إضافة أوامر شراء...');
    
    const purchaseOrdersData = [
      ['po-atlas-001', 'PO-2024-ATLAS-001', 'quot-atlas-001', 'supplier-elite-001', now - 86400000 * 12, now + 86400000 * 21, 'confirmed', 148000, 'أولوية عالية - مشروع حكومي', now - 86400000 * 12, now - 86400000 * 2],
      ['po-green-002', 'PO-2024-GREEN-002', 'quot-green-002', 'supplier-advanced-003', now - 86400000 * 8, now + 86400000 * 28, 'pending', 273000, 'مشروع الطاقة المتجددة', now - 86400000 * 8, now - 86400000 * 1]
    ];

    // التحقق من وجود جدول purchaseOrders أو purchase_orders
    const poTableExists = sqlite.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND (name='purchaseOrders' OR name='purchase_orders')
    `).get();
    
    const poTable = poTableExists?.name || 'purchaseOrders';

    const insertPO = sqlite.prepare(`
      INSERT OR REPLACE INTO ${poTable} (id, orderNumber, quotationId, supplierId, orderDate, deliveryDate, status, totalAmount, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const po of purchaseOrdersData) {
      insertPO.run(...po);
    }

    // 7. إضافة أنشطة للنظام
    console.log('📊 إضافة سجل أنشطة متنوعة...');
    
    const activitiesData = [
      ['sara-new', 'create_client', 'client', 'client-atlas-001', 'تم إنشاء عميل جديد: شركة الأطلس للمقاولات', '192.168.1.101', now - 86400000 * 40],
      ['sara-new', 'create_supplier', 'supplier', 'supplier-elite-001', 'تم إضافة مورد جديد: مؤسسة النخبة للتوريدات الفنية', '192.168.1.101', now - 86400000 * 35],
      ['sara-new', 'create_item', 'item', 'item-motor-001', 'تم إضافة صنف جديد: محرك تيار متردد 3 حصان', '192.168.1.101', now - 86400000 * 30],
      ['khaled-new', 'create_quotation', 'quotation', 'quot-atlas-001', 'تم إنشاء طلب تسعير جديد لشركة الأطلس', '192.168.1.102', now - 86400000 * 18],
      ['khaled-new', 'create_purchase_order', 'purchase_order', 'po-atlas-001', 'تم إنشاء أمر شراء: PO-2024-ATLAS-001', '192.168.1.102', now - 86400000 * 12],
      ['fatima-new', 'view_reports', 'report', 'financial-q4-2024', 'عرض التقارير المالية للربع الرابع', '192.168.1.103', now - 86400000 * 7],
      ['mohammed-new', 'system_maintenance', 'system', 'daily-backup', 'تم تنفيذ الصيانة الدورية ونسخ البيانات', '192.168.1.104', now - 86400000 * 3],
      ['admin-new', 'user_management', 'user', 'system-review', 'مراجعة شاملة لصلاحيات المستخدمين', '192.168.1.100', now - 86400000 * 1]
    ];

    const insertActivity = sqlite.prepare(`
      INSERT INTO activity_log (user_id, action, entity_type, entity_id, details, ip_address, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const activity of activitiesData) {
      insertActivity.run(...activity);
    }

    console.log('✅ تم إضافة جميع البيانات العينة بنجاح!');
    
    // إحصائيات نهائية
    const finalStats = {
      users: sqlite.prepare('SELECT COUNT(*) as count FROM users').get(),
      clients: sqlite.prepare('SELECT COUNT(*) as count FROM clients').get(),
      suppliers: sqlite.prepare('SELECT COUNT(*) as count FROM suppliers').get(),
      items: sqlite.prepare('SELECT COUNT(*) as count FROM items').get(),
      quotations: sqlite.prepare(`SELECT COUNT(*) as count FROM ${quotationTable}`).get(),
      purchaseOrders: sqlite.prepare(`SELECT COUNT(*) as count FROM ${poTable}`).get(),
      activities: sqlite.prepare('SELECT COUNT(*) as count FROM activity_log').get()
    };

    console.log('\n📊 إحصائيات قاعدة البيانات النهائية:');
    console.log(`   👥 المستخدمون: ${finalStats.users.count}`);
    console.log(`   🏢 العملاء: ${finalStats.clients.count}`);
    console.log(`   🚚 الموردون: ${finalStats.suppliers.count}`);
    console.log(`   📦 الأصناف: ${finalStats.items.count}`);
    console.log(`   📋 طلبات التسعير: ${finalStats.quotations.count}`);
    console.log(`   🛒 أوامر الشراء: ${finalStats.purchaseOrders.count}`);
    console.log(`   📝 سجل الأنشطة: ${finalStats.activities.count}`);

  } catch (error) {
    console.error('❌ خطأ في إضافة البيانات:', error);
  } finally {
    sqlite.close();
  }
}

addSampleData();