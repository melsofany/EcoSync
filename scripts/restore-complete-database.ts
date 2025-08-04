import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const sqlite = new Database('qurtoba.db');

async function restoreCompleteDatabase() {
  console.log('🗄️ استعادة قاعدة البيانات الكاملة...');
  
  try {
    // 1. إعادة إنشاء بيانات العملاء
    console.log('👥 إضافة العملاء...');
    sqlite.prepare(`DELETE FROM clients`).run();
    const clientsData = [
      {
        id: 'client-001',
        name: 'شركة النور للمقاولات',
        contactPerson: 'المهندس أحمد عبدالله',
        email: 'ahmed@alnoor-contracting.com',
        phone: '+966112345678',
        address: 'الرياض، المملكة العربية السعودية',
        taxId: '123456789',
        isActive: 1,
        createdAt: Date.now() - 86400000 * 30,
        updatedAt: Date.now() - 86400000 * 10
      },
      {
        id: 'client-002', 
        name: 'مؤسسة الخليج للتجارة',
        contactPerson: 'السيدة فاطمة محمد',
        email: 'fatima@gulf-trade.com',
        phone: '+966113456789',
        address: 'جدة، المملكة العربية السعودية',
        taxId: '987654321',
        isActive: 1,
        createdAt: Date.now() - 86400000 * 25,
        updatedAt: Date.now() - 86400000 * 5
      },
      {
        id: 'client-003',
        name: 'شركة الأصيل للصناعات',
        contactPerson: 'المهندس خالد السالم',
        email: 'khaled@aseel-industries.com', 
        phone: '+966114567890',
        address: 'الدمام، المملكة العربية السعودية',
        taxId: '456789123',
        isActive: 1,
        createdAt: Date.now() - 86400000 * 20,
        updatedAt: Date.now() - 86400000 * 3
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

    // 2. إعادة إنشاء بيانات الموردين
    console.log('🚚 إضافة الموردين...');
    sqlite.prepare(`DELETE FROM suppliers`).run();
    const suppliersData = [
      {
        id: 'supplier-001',
        name: 'شركة الصالحية للتوريدات الكهربائية',
        contactPerson: 'المهندس سعد الغامدي',
        email: 'saad@salehiya-electric.com',
        phone: '+966115678901',
        address: 'الرياض، حي الصالحية',
        taxId: '789123456',
        paymentTerms: 'دفع خلال 30 يوم',
        isActive: 1,
        createdAt: Date.now() - 86400000 * 45,
        updatedAt: Date.now() - 86400000 * 8
      },
      {
        id: 'supplier-002',
        name: 'مؤسسة الرائد للأدوات الصناعية',
        contactPerson: 'السيد محمد الأحمد',
        email: 'mohammed@raed-tools.com',
        phone: '+966116789012',
        address: 'جدة، شارع فلسطين',
        taxId: '321654987',
        paymentTerms: 'دفع مقدم 50%',
        isActive: 1,
        createdAt: Date.now() - 86400000 * 40,
        updatedAt: Date.now() - 86400000 * 12
      },
      {
        id: 'supplier-003',
        name: 'شركة التقنية المتقدمة للمعدات',
        contactPerson: 'المهندسة نورا العتيبي',
        email: 'nora@advanced-tech.com',
        phone: '+966117890123',
        address: 'الخبر، الكورنيش الشمالي',
        taxId: '654987321',
        paymentTerms: 'دفع خلال 45 يوم',
        isActive: 1,
        createdAt: Date.now() - 86400000 * 35,
        updatedAt: Date.now() - 86400000 * 6
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

    // 3. إعادة إنشاء بيانات الأصناف
    console.log('📦 إضافة الأصناف...');
    sqlite.prepare(`DELETE FROM items`).run();
    const itemsData = [
      {
        id: 'item-001',
        itemNumber: 'P-000001',
        description: 'محرك كهربائي ثلاثي الأطوار 10 حصان',
        specification: 'جهد 380 فولت، تردد 50 هرتز، سرعة 1450 دورة/دقيقة',
        unit: 'وحدة',
        category: 'محركات كهربائية',
        partNumber: 'MOT-3PH-10HP-380V',
        brand: 'سيمنز',
        isActive: 1,
        createdAt: Date.now() - 86400000 * 50,
        updatedAt: Date.now() - 86400000 * 15
      },
      {
        id: 'item-002',
        itemNumber: 'P-000002',
        description: 'كابل كهربائي نحاسي 4×16 مم²',
        specification: 'كابل نحاسي معزول بـ XLPE، جهد 1000 فولت',
        unit: 'متر',
        category: 'كابلات كهربائية',
        partNumber: 'CBL-CU-4X16-XLPE',
        brand: 'الكابل السعودي',
        isActive: 1,
        createdAt: Date.now() - 86400000 * 45,
        updatedAt: Date.now() - 86400000 * 20
      },
      {
        id: 'item-003',
        itemNumber: 'P-000003',
        description: 'لوحة توزيع كهربائية IP65',
        specification: 'لوحة فولاذية مقاومة للغبار والماء، أبعاد 600×400×200 مم',
        unit: 'وحدة',
        category: 'لوحات كهربائية',
        partNumber: 'PNL-STL-IP65-600X400',
        brand: 'شنايدر إلكتريك',
        isActive: 1,
        createdAt: Date.now() - 86400000 * 40,
        updatedAt: Date.now() - 86400000 * 10
      },
      {
        id: 'item-004',
        itemNumber: 'P-000004',
        description: 'مفتاح كهربائي أوتوماتيكي 63 أمبير',
        specification: 'MCB ثلاثي الأقطاب، منحنى C، قدرة قطع 6kA',
        unit: 'وحدة',
        category: 'قواطع كهربائية',
        partNumber: 'MCB-3P-63A-C-6KA',
        brand: 'ABB',
        isActive: 1,
        createdAt: Date.now() - 86400000 * 35,
        updatedAt: Date.now() - 86400000 * 5
      },
      {
        id: 'item-005',
        itemNumber: 'P-000005',
        description: 'مضخة مياه طرد مركزي 5 حصان',
        specification: 'مضخة أفقية، تصريف 50 م³/ساعة، ارتفاع 35 متر',
        unit: 'وحدة', 
        category: 'مضخات مياه',
        partNumber: 'PMP-CENT-5HP-50CMH',
        brand: 'جراندفوس',
        isActive: 1,
        createdAt: Date.now() - 86400000 * 30,
        updatedAt: Date.now() - 86400000 * 7
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

    // 4. إضافة طلبات التسعير
    console.log('📋 إضافة طلبات التسعير...');
    sqlite.prepare(`DELETE FROM quotation_requests`).run();
    sqlite.prepare(`DELETE FROM quotationItems`).run();

    const quotationsData = [
      {
        id: 'quot-001',
        requestNumber: 'RFQ-2024-001',
        clientId: 'client-001',
        requestDate: Date.now() - 86400000 * 15,
        responseDate: Date.now() + 86400000 * 5,
        status: 'pending',
        description: 'توريد معدات كهربائية لمشروع برج النور التجاري',
        notes: 'يرجى تضمين الضمان وخدمة ما بعد البيع',
        createdAt: Date.now() - 86400000 * 15,
        updatedAt: Date.now() - 86400000 * 2
      },
      {
        id: 'quot-002', 
        requestNumber: 'RFQ-2024-002',
        clientId: 'client-002',
        requestDate: Date.now() - 86400000 * 10,
        responseDate: Date.now() + 86400000 * 10,
        status: 'responded',
        description: 'توريد كابلات وأدوات تحكم لمصنع الخليج',
        notes: 'التسليم على دفعات حسب جدول المشروع',
        createdAt: Date.now() - 86400000 * 10,
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

    // إضافة بنود طلبات التسعير
    const quotationItemsData = [
      {
        id: 'qi-001',
        quotationId: 'quot-001',
        itemId: 'item-001',
        lineItem: '0001.001.ELEC.0001',
        quantity: 5,
        unitPrice: 2500,
        totalPrice: 12500,
        notes: 'مع قاعدة تثبيت',
        createdAt: Date.now() - 86400000 * 15
      },
      {
        id: 'qi-002',
        quotationId: 'quot-001', 
        itemId: 'item-002',
        lineItem: '0001.002.ELEC.0002',
        quantity: 500,
        unitPrice: 25,
        totalPrice: 12500,
        notes: 'حسب المواصفات المطلوبة',
        createdAt: Date.now() - 86400000 * 15
      },
      {
        id: 'qi-003',
        quotationId: 'quot-002',
        itemId: 'item-003',
        lineItem: '0002.001.ELEC.0003',
        quantity: 3,
        unitPrice: 1800,
        totalPrice: 5400,
        notes: 'مع أدوات التثبيت',
        createdAt: Date.now() - 86400000 * 10
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

    // 5. إضافة أوامر الشراء
    console.log('🛒 إضافة أوامر الشراء...');
    sqlite.prepare(`DELETE FROM purchase_orders`).run();
    sqlite.prepare(`DELETE FROM purchaseOrderItems`).run();

    const purchaseOrdersData = [
      {
        id: 'po-001',
        orderNumber: 'PO-2024-001',
        quotationId: 'quot-001',
        supplierId: 'supplier-001',
        orderDate: Date.now() - 86400000 * 5,
        deliveryDate: Date.now() + 86400000 * 20,
        status: 'confirmed',
        totalAmount: 25000,
        notes: 'أولوية عالية للتسليم',
        createdAt: Date.now() - 86400000 * 5,
        updatedAt: Date.now() - 86400000 * 1
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

    // 6. إضافة المزيد من الأنشطة
    console.log('📝 إضافة سجل الأنشطة...');
    
    const activitiesData = [
      {
        userId: 'admin-new',
        action: 'system_startup',
        entityType: 'system',
        entityId: 'system-001',
        details: 'تم بدء تشغيل النظام بنجاح',
        ipAddress: '192.168.1.100',
        timestamp: Date.now() - 86400000 * 30
      },
      {
        userId: 'sara-new',
        action: 'create_client',
        entityType: 'client',
        entityId: 'client-001',
        details: 'تم إنشاء عميل جديد: شركة النور للمقاولات',
        ipAddress: '192.168.1.101',
        timestamp: Date.now() - 86400000 * 25
      },
      {
        userId: 'sara-new',
        action: 'create_item',
        entityType: 'item',
        entityId: 'item-001',
        details: 'تم إضافة صنف جديد: محرك كهربائي ثلاثي الأطوار',
        ipAddress: '192.168.1.101',
        timestamp: Date.now() - 86400000 * 20
      },
      {
        userId: 'khaled-new',
        action: 'create_purchase_order',
        entityType: 'purchase_order',
        entityId: 'po-001',
        details: 'تم إنشاء أمر شراء جديد: PO-2024-001',
        ipAddress: '192.168.1.102',
        timestamp: Date.now() - 86400000 * 15
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

    console.log('✅ تم استعادة جميع البيانات بنجاح!');
    console.log('📊 إحصائيات قاعدة البيانات:');
    
    const stats = {
      users: sqlite.prepare('SELECT COUNT(*) as count FROM users').get(),
      clients: sqlite.prepare('SELECT COUNT(*) as count FROM clients').get(),
      suppliers: sqlite.prepare('SELECT COUNT(*) as count FROM suppliers').get(),
      items: sqlite.prepare('SELECT COUNT(*) as count FROM items').get(),
      quotations: sqlite.prepare('SELECT COUNT(*) as count FROM quotation_requests').get(),
      purchaseOrders: sqlite.prepare('SELECT COUNT(*) as count FROM purchase_orders').get(),
      activities: sqlite.prepare('SELECT COUNT(*) as count FROM activity_log').get()
    };

    console.log(`   👥 المستخدمون: ${stats.users.count}`);
    console.log(`   🏢 العملاء: ${stats.clients.count}`);
    console.log(`   🚚 الموردون: ${stats.suppliers.count}`);
    console.log(`   📦 الأصناف: ${stats.items.count}`);
    console.log(`   📋 طلبات التسعير: ${stats.quotations.count}`);
    console.log(`   🛒 أوامر الشراء: ${stats.purchaseOrders.count}`);
    console.log(`   📝 سجل الأنشطة: ${stats.activities.count}`);

  } catch (error) {
    console.error('❌ خطأ في استعادة البيانات:', error);
  } finally {
    sqlite.close();
  }
}

restoreCompleteDatabase();