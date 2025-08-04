import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';

const sqlite = new Database('qurtoba.db');

// إضافة عملاء نموذجيين
const clients = [
  {
    id: 'client-1',
    name: 'شركة الخليج للمقاولات',
    phone: '+966112345678',
    email: 'info@gulf-contracting.com',
    address: 'الرياض، المملكة العربية السعودية',
    created_by: 'sara-data-entry'
  },
  {
    id: 'client-2', 
    name: 'مؤسسة النهضة التجارية',
    phone: '+966123456789',
    email: 'sales@nahda-trading.com',
    address: 'جدة، المملكة العربية السعودية',
    created_by: 'sara-data-entry'
  },
  {
    id: 'client-3',
    name: 'شركة الأصالة للصناعات',
    phone: '+966134567890',
    email: 'contact@asala-industries.com', 
    address: 'الدمام، المملكة العربية السعودية',
    created_by: 'admin-original'
  }
];

// إضافة موردين نموذجيين
const suppliers = [
  {
    id: 'supplier-1',
    name: 'مؤسسة الأطلس للتوريدات الصناعية',
    phone: '+966145678901',
    email: 'info@atlas-supplies.com',
    address: 'الرياض، المملكة العربية السعودية',
    created_by: 'sara-data-entry'
  },
  {
    id: 'supplier-2',
    name: 'شركة النجم الذهبي للمعدات',
    phone: '+966156789012',
    email: 'sales@golden-star.com',
    address: 'الخبر، المملكة العربية السعودية',
    created_by: 'admin-original'
  }
];

// إضافة بنود نموذجية
const items = [
  {
    id: 'item-1',
    part_number: 'SW-001-2024',
    line_item: '1001.001.ELEC.0001',
    description: 'مفتاح كهربائي صناعي 220 فولت - مقاوم للماء',
    quantity: 50,
    unit: 'قطعة',
    created_by: 'sara-data-entry'
  },
  {
    id: 'item-2', 
    part_number: 'CB-002-2024',
    line_item: '1002.001.ELEC.0002',
    description: 'قاطع تيار أوتوماتيكي 63 أمبير - ثلاثي الأطوار',
    quantity: 25,
    unit: 'قطعة',
    created_by: 'sara-data-entry'
  },
  {
    id: 'item-3',
    part_number: 'PMP-003-2024',
    line_item: '1003.001.MECH.0003', 
    description: 'مضخة مياه طرد مركزي 5 حصان - للاستخدام الصناعي',
    quantity: 10,
    unit: 'قطعة',
    created_by: 'admin-original'
  }
];

// إدراج العملاء
const insertClientStmt = sqlite.prepare(`
  INSERT INTO clients (id, name, phone, email, address, created_by, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const client of clients) {
  insertClientStmt.run(
    client.id, client.name, client.phone, client.email, 
    client.address, client.created_by, Date.now()
  );
}

// إدراج الموردين
const insertSupplierStmt = sqlite.prepare(`
  INSERT INTO suppliers (id, name, phone, email, address, created_by, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const supplier of suppliers) {
  insertSupplierStmt.run(
    supplier.id, supplier.name, supplier.phone, supplier.email,
    supplier.address, supplier.created_by, Date.now()
  );
}

// إدراج البنود
const insertItemStmt = sqlite.prepare(`
  INSERT INTO items (id, part_number, line_item, description, quantity, unit, created_by, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const item of items) {
  insertItemStmt.run(
    item.id, item.part_number, item.line_item, item.description,
    item.quantity, item.unit, item.created_by, Date.now()
  );
}

console.log('تم إدراج البيانات النموذجية بنجاح!');
console.log(`- ${clients.length} عملاء`);
console.log(`- ${suppliers.length} موردين`);
console.log(`- ${items.length} بنود`);

sqlite.close();