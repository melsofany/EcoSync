import Database from 'better-sqlite3';

const sqlite = new Database('qurtoba.db');

async function restoreDatabase() {
  console.log('🗄️ استعادة البيانات مع أسماء الجداول الصحيحة...');
  
  try {
    // 1. العملاء - استخدام الاسم الصحيح للجدول
    console.log('👥 إضافة بيانات العملاء...');
    
    const clientsData = [
      {
        id: 'client-004',
        name: 'شركة المستقبل للهندسة',
        contactPerson: 'المهندس يوسف الشريف',
        email: 'youssef@future-eng.com',
        phone: '+966118901234',
        address: 'الرياض، حي العليا',
        taxId: '147258369',
        isActive: 1,
        createdAt: Date.now() - 86400000 * 60,
        updatedAt: Date.now() - 86400000 * 20
      },
      {
        id: 'client-005',
        name: 'مجموعة الرياض التجارية',
        contactPerson: 'السيد عبدالرحمن القاسم',
        email: 'abdulrahman@riyadh-group.com',
        phone: '+966119012345',
        address: 'الرياض، شارع الملك عبدالعزيز',
        taxId: '963852741',
        isActive: 1,
        createdAt: Date.now() - 86400000 * 45,
        updatedAt: Date.now() - 86400000 * 15
      }
    ];

    const insertClient = sqlite.prepare(`
      INSERT OR REPLACE INTO clients (id, name, contact_person, email, phone, address, tax_id, is_active, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const client of clientsData) {
      insertClient.run(
        client.id, client.name, client.contactPerson, client.email, 
        client.phone, client.address, client.taxId, client.isActive,
        client.createdAt, client.updatedAt
      );
    }

    // 2. الموردين
    console.log('🚚 إضافة بيانات الموردين...');
    
    const suppliersData = [
      {
        id: 'supplier-004',
        name: 'مؤسسة الإمداد الصناعي',
        contactPerson: 'المهندس ماجد الزهراني',
        email: 'majed@industrial-supply.com',
        phone: '+966120123456',
        address: 'الدمام، المنطقة الصناعية الأولى',
        taxId: '258147963',
        paymentTerms: 'دفع خلال 60 يوم',
        isActive: 1,
        createdAt: Date.now() - 86400000 * 55,
        updatedAt: Date.now() - 86400000 * 18
      },
      {
        id: 'supplier-005',
        name: 'شركة الخليج للتقنيات المتقدمة',
        contactPerson: 'المهندسة ريم العبدالله',
        email: 'reem@gulf-advanced-tech.com',
        phone: '+966121234567',
        address: 'جدة، حي الفيصلية',
        taxId: '852963147',
        paymentTerms: 'دفع مقدم 30%',
        isActive: 1,
        createdAt: Date.now() - 86400000 * 50,
        updatedAt: Date.now() - 86400000 * 12
      }
    ];

    const insertSupplier = sqlite.prepare(`
      INSERT OR REPLACE INTO suppliers (id, name, contact_person, email, phone, address, tax_id, payment_terms, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const supplier of suppliersData) {
      insertSupplier.run(
        supplier.id, supplier.name, supplier.contactPerson, supplier.email,
        supplier.phone, supplier.address, supplier.taxId, supplier.paymentTerms,
        supplier.isActive, supplier.createdAt, supplier.updatedAt
      );
    }

    // 3. الأصناف
    console.log('📦 إضافة بيانات الأصناف...');
    
    const itemsData = [
      {
        id: 'item-006',
        itemNumber: 'P-000006',
        description: 'مكيف هواء مركزي 24000 وحدة حرارية',
        specification: 'مكيف سبليت، غاز R410A، كفاءة طاقة عالية',
        unit: 'وحدة',
        category: 'أجهزة التكييف',
        partNumber: 'AC-SPLIT-24K-R410A',
        brand: 'كاريير',
        isActive: 1,
        createdAt: Date.now() - 86400000 * 42,
        updatedAt: Date.now() - 86400000 * 18
      },
      {
        id: 'item-007',
        itemNumber: 'P-000007',
        description: 'جهاز إنذار حريق ذكي',
        specification: 'كاشف دخان وحرارة، اتصال لاسلكي، بطارية ليثيوم',
        unit: 'وحدة',
        category: 'أنظمة الأمان',
        partNumber: 'FA-SMART-SMOKE-HEAT',
        brand: 'هانيويل',
        isActive: 1,
        createdAt: Date.now() - 86400000 * 38,
        updatedAt: Date.now() - 86400000 * 14
      },
      {
        id: 'item-008',
        itemNumber: 'P-000008',
        description: 'مولد كهرباء ديزل 100 كيلو واط',
        specification: 'مولد احتياطي، بدء تشغيل أوتوماتيكي، خزان وقود 500 لتر',
        unit: 'وحدة',
        category: 'مولدات كهربائية',
        partNumber: 'GEN-DIESEL-100KW-AUTO',
        brand: 'كاتربيلر',
        isActive: 1,
        createdAt: Date.now() - 86400000 * 35,
        updatedAt: Date.now() - 86400000 * 10
      }
    ];

    const insertItem = sqlite.prepare(`
      INSERT OR REPLACE INTO items (id, item_number, description, specification, unit, category, part_number, brand, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of itemsData) {
      insertItem.run(
        item.id, item.itemNumber, item.description, item.specification,
        item.unit, item.category, item.partNumber, item.brand, 
        item.isActive, item.createdAt, item.updatedAt
      );
    }

    // 4. طلبات التسعير
    console.log('📋 إضافة طلبات التسعير...');
    
    const quotationsData = [
      {
        id: 'quot-003',
        requestNumber: 'RFQ-2024-003',
        clientId: 'client-004',
        requestDate: Date.now() - 86400000 * 12,
        responseDate: Date.now() + 86400000 * 8,
        status: 'pending',
        description: 'توريد أنظمة تكييف لمجمع المستقبل التجاري',
        notes: 'تشمل التركيب والصيانة لمدة سنة',
        createdAt: Date.now() - 86400000 * 12,
        updatedAt: Date.now() - 86400000 * 3
      },
      {
        id: 'quot-004',
        requestNumber: 'RFQ-2024-004',
        clientId: 'client-005',
        requestDate: Date.now() - 86400000 * 8,
        responseDate: Date.now() + 86400000 * 12,
        status: 'draft',
        description: 'توريد مولدات كهربائية احتياطية',
        notes: 'للاستخدام في حالات الطوارئ فقط',
        createdAt: Date.now() - 86400000 * 8,
        updatedAt: Date.now() - 86400000 * 1
      }
    ];

    const insertQuotation = sqlite.prepare(`
      INSERT OR REPLACE INTO quotation_requests (id, request_number, client_id, request_date, response_date, status, description, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const quot of quotationsData) {
      insertQuotation.run(
        quot.id, quot.requestNumber, quot.clientId, quot.requestDate,
        quot.responseDate, quot.status, quot.description, quot.notes,
        quot.createdAt, quot.updatedAt
      );
    }

    // 5. بنود طلبات التسعير
    const quotationItemsData = [
      {
        id: 'qi-004',
        quotationId: 'quot-003',
        itemId: 'item-006',
        lineItem: '0003.001.HVAC.0001',
        quantity: 8,
        unitPrice: 4500,
        totalPrice: 36000,
        notes: 'مع التركيب والضمان',
        createdAt: Date.now() - 86400000 * 12
      },
      {
        id: 'qi-005',
        quotationId: 'quot-003',
        itemId: 'item-007',
        lineItem: '0003.002.SAFE.0001',
        quantity: 20,
        unitPrice: 350,
        totalPrice: 7000,
        notes: 'نظام إنذار متكامل',
        createdAt: Date.now() - 86400000 * 12
      },
      {
        id: 'qi-006',
        quotationId: 'quot-004',
        itemId: 'item-008',
        lineItem: '0004.001.GEN.0001',
        quantity: 2,
        unitPrice: 85000,
        totalPrice: 170000,
        notes: 'مع خدمة التشغيل والصيانة',
        createdAt: Date.now() - 86400000 * 8
      }
    ];

    const insertQuotationItem = sqlite.prepare(`
      INSERT OR REPLACE INTO quotationItems (id, quotation_id, item_id, line_item, quantity, unit_price, total_price, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of quotationItemsData) {
      insertQuotationItem.run(
        item.id, item.quotationId, item.itemId, item.lineItem,
        item.quantity, item.unitPrice, item.totalPrice, item.notes,
        item.createdAt
      );
    }

    // 6. أوامر الشراء
    console.log('🛒 إضافة أوامر الشراء...');
    
    const purchaseOrdersData = [
      {
        id: 'po-002',
        orderNumber: 'PO-2024-002',
        quotationId: 'quot-003',
        supplierId: 'supplier-004',
        orderDate: Date.now() - 86400000 * 6,
        deliveryDate: Date.now() + 86400000 * 25,
        status: 'pending',
        totalAmount: 43000,
        notes: 'يرجى التأكد من جودة التركيب',
        createdAt: Date.now() - 86400000 * 6,
        updatedAt: Date.now() - 86400000 * 2
      },
      {
        id: 'po-003',
        orderNumber: 'PO-2024-003',
        quotationId: 'quot-004',
        supplierId: 'supplier-005',
        orderDate: Date.now() - 86400000 * 3,
        deliveryDate: Date.now() + 86400000 * 30,
        status: 'confirmed',
        totalAmount: 170000,
        notes: 'مشروع استراتيجي - أولوية قصوى',
        createdAt: Date.now() - 86400000 * 3,
        updatedAt: Date.now()
      }
    ];

    const insertPO = sqlite.prepare(`
      INSERT OR REPLACE INTO purchase_orders (id, order_number, quotation_id, supplier_id, order_date, delivery_date, status, total_amount, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const po of purchaseOrdersData) {
      insertPO.run(
        po.id, po.orderNumber, po.quotationId, po.supplierId,
        po.orderDate, po.deliveryDate, po.status, po.totalAmount,
        po.notes, po.createdAt, po.updatedAt
      );
    }

    // 7. المزيد من الأنشطة
    console.log('📝 إضافة أنشطة إضافية...');
    
    const activitiesData = [
      {
        userId: 'sara-new',
        action: 'create_quotation',
        entityType: 'quotation',
        entityId: 'quot-003',
        details: 'تم إنشاء طلب تسعير جديد للمستقبل للهندسة',
        ipAddress: '192.168.1.101',
        timestamp: Date.now() - 86400000 * 12
      },
      {
        userId: 'khaled-new',
        action: 'create_purchase_order',
        entityType: 'purchase_order',
        entityId: 'po-002',
        details: 'تم إنشاء أمر شراء: PO-2024-002',
        ipAddress: '192.168.1.102',
        timestamp: Date.now() - 86400000 * 6
      },
      {
        userId: 'fatima-new',
        action: 'view_reports',
        entityType: 'report',
        entityId: 'financial-summary-2024',
        details: 'عرض التقارير المالية للربع الحالي',
        ipAddress: '192.168.1.103',
        timestamp: Date.now() - 86400000 * 3
      },
      {
        userId: 'mohammed-new',
        action: 'system_backup',
        entityType: 'system',
        entityId: 'backup-daily',
        details: 'تم إنشاء نسخة احتياطية يومية',
        ipAddress: '192.168.1.104',
        timestamp: Date.now() - 86400000 * 1
      }
    ];

    const insertActivity = sqlite.prepare(`
      INSERT INTO activity_log (user_id, action, entity_type, entity_id, details, ip_address, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const activity of activitiesData) {
      insertActivity.run(
        activity.userId, activity.action, activity.entityType, activity.entityId,
        activity.details, activity.ipAddress, activity.timestamp
      );
    }

    console.log('✅ تم إضافة جميع البيانات الإضافية بنجاح!');
    
    // إحصائيات نهائية
    const finalStats = {
      users: sqlite.prepare('SELECT COUNT(*) as count FROM users').get(),
      clients: sqlite.prepare('SELECT COUNT(*) as count FROM clients').get(),
      suppliers: sqlite.prepare('SELECT COUNT(*) as count FROM suppliers').get(),
      items: sqlite.prepare('SELECT COUNT(*) as count FROM items').get(),
      quotations: sqlite.prepare('SELECT COUNT(*) as count FROM quotation_requests').get(),
      purchaseOrders: sqlite.prepare('SELECT COUNT(*) as count FROM purchase_orders').get(),
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
    console.error('❌ خطأ في استعادة البيانات:', error);
  } finally {
    sqlite.close();
  }
}

restoreDatabase();