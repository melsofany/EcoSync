import { readFileSync } from 'fs';

/**
 * Storage fallback that uses Google Sheets data when PostgreSQL database is unavailable
 */
export class SheetsFallbackStorage {
  private sheetsData: any = null;
  
  constructor() {
    this.loadSheetsData();
  }
  
  // Add required methods for user management (using Google Sheets user data)
  async getUserByUsername(username: string) {
    // Default admin user for testing
    if (username === 'admin') {
      return {
        id: 'admin-user',
        username: 'admin',
        password: '$2b$10$rOzJe0P7XVjQQd7Z9vKF7uGHlZf5QcZvJ4R4q2V8nG8X0nJ1KlP6W', // admin123
        fullName: 'مدير النظام',
        email: 'admin@qurtoba.com',
        role: 'it_admin',
        permissions: ['view_all', 'edit_all', 'delete_all', 'manage_users'],
        isActive: true,
        createdAt: new Date().toISOString()
      };
    }
    return null;
  }
  
  async updateUserOnlineStatus(id: string, isOnline: boolean, ipAddress?: string) {
    // Stub for user status updates
    console.log(`👤 تحديث حالة المستخدم ${id}: ${isOnline ? 'متصل' : 'غير متصل'}`);
  }
  
  async logActivity(userId: string, action: string, resourceType: string, resourceId: string, description: string) {
    // محاولة الحصول على اسم المستخدم من userId
    try {
      const users = await this.getAllUsers();
      const user = users.find(u => u.id === userId);
      const userName = user?.fullName || user?.username || userId;
      console.log(`📝 نشاط: ${userName} - ${description}`);
    } catch (error) {
      console.log(`📝 نشاط: ${userId} - ${description}`);
    }
  }
  
  private loadSheetsData() {
    try {
      // Try to load synced data from sheets
      this.sheetsData = JSON.parse(readFileSync('./attached_assets/synced_data_from_sheets.json', 'utf8'));
      console.log('📊 تم تحميل بيانات Google Sheets كنظام احتياطي');
    } catch (error) {
      try {
        // Fallback to complete excel data
        this.sheetsData = JSON.parse(readFileSync('./attached_assets/complete_excel_data.json', 'utf8'));
        console.log('📊 تم تحميل البيانات من complete_excel_data.json');
      } catch (error2) {
        try {
          // Final fallback to corrected data
          this.sheetsData = JSON.parse(readFileSync('./attached_assets/corrected_data_5449.json', 'utf8'));
          console.log('📊 تم تحميل البيانات من corrected_data_5449.json');
        } catch (error3) {
          console.error('❌ فشل في تحميل أي ملف بيانات:', error3.message);
          this.sheetsData = { quotations: [], items: [], purchaseOrders: [] };
        }
      }
    }
  }
  
  // Add getAllPurchaseOrders method
  getAllPurchaseOrders() {
    if (!this.sheetsData) return [];
    
    try {
      const purchaseOrders = this.sheetsData.purchaseOrders || [];
      
      // If no purchase orders from main data, extract from items
      if (!purchaseOrders.length && this.sheetsData.items) {
        const items = this.sheetsData.items;
        const uniquePOs = [...new Set(items.map((item: any) => item.poNumber).filter(Boolean))];
        
        return uniquePOs.map((poNumber: string) => {
          const poItems = items.filter((item: any) => item.poNumber === poNumber);
          const firstItem = poItems[0] || {};
          
          return {
            id: `po-${poNumber}`,
            poNumber: poNumber,
            quotationNumber: firstItem.rfqNumber || '',
            orderDate: firstItem.orderDate || firstItem.poDate || new Date().toISOString(),
            status: 'confirmed',
            deliveryStatus: 'pending',
            totalAmount: poItems.reduce((sum: number, item: any) => 
              sum + (parseFloat(item.totalPOValue) || 0), 0),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        });
      }
      
      return purchaseOrders;
    } catch (error) {
      console.error('Error getting purchase orders:', error);
      return [];
    }
  }

  getQuotationRequests() {
    if (!this.sheetsData) return [];
    
    // Extract quotation requests from the data
    const quotations = this.sheetsData.quotations || this.sheetsData.rfqs || [];
    const items = this.sheetsData.items || [];
    
    // Extract unique RFQ numbers from items
    const uniqueRfqs = [...new Set(items.map((item: any) => item.rfqNumber).filter(Boolean))];
    
    // Create quotation requests based on RFQ numbers from items
    const quotationsFromItems = uniqueRfqs.map((rfqNumber: string, index: number) => {
      const relatedItems = items.filter((item: any) => item.rfqNumber === rfqNumber);
      const firstItem = relatedItems[0] || {};
      
      return {
        id: `rfq-sheets-${rfqNumber}`,
        requestNumber: rfqNumber,
        customRequestNumber: rfqNumber,
        clientId: 'edc-client',
        clientName: 'EDC',
        requestDate: firstItem.rfqDate || new Date().toISOString(), // From column G (rfqDate)
        expiryDate: firstItem.poNumber || firstItem.poDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // From column J (using poNumber as it contains date)
        status: 'pending',
        responsibleEmployee: 'موظف EDC',
        notes: `طلب تسعير ${rfqNumber} - ${relatedItems.length} أصناف`,
        createdAt: firstItem.rfqDate || new Date().toISOString(),
        createdBy: 'system'
      };
    });
    
    // Merge with existing quotations if any
    const existingQuotations = quotations.map((q: any, index: number) => ({
      id: q.id || `rfq-sheets-${q.requestNumber || index}`,
      requestNumber: q.requestNumber || q.rfqNumber || `25R${String(index).padStart(6, '0')}`,
      customRequestNumber: q.customRequestNumber || q.customNumber,
      clientId: q.clientId || 'default-client',
      clientName: q.clientName || 'عميل افتراضي',
      requestDate: q.rfqDate || q.requestDate || new Date().toISOString(), // From column G
      expiryDate: q.poNumber || q.poDate || q.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // From column J (using poNumber as it contains expiry date)
      status: q.status || 'pending',
      responsibleEmployee: q.responsibleEmployee || 'الموظف المسؤول',
      notes: q.notes || '',
      createdAt: q.createdAt || new Date().toISOString(),
      createdBy: q.createdBy || 'system'
    }));
    
    return [...quotationsFromItems, ...existingQuotations];
  }
  
  getQuotationById(id: string) {
    const quotations = this.getQuotationRequests();
    const found = quotations.find((q: any) => 
      q.id === id || 
      q.requestNumber === id ||
      q.customRequestNumber === id ||
      id.includes(q.requestNumber)
    );
    
    console.log(`🔍 البحث عن طلب التسعير: ${id}`);
    console.log(`📋 تم العثور على ${quotations.length} طلب تسعير`);
    console.log(`✅ النتيجة:`, found ? `وُجد - ${found.requestNumber}` : 'لم يوجد');
    
    return found;
  }
  
  getQuotationItems(quotationId: string) {
    if (!this.sheetsData) return [];
    
    const items = this.sheetsData.items || [];
    const quotation = this.getQuotationById(quotationId);
    
    if (!quotation) return [];
    
    // Filter items that belong to this quotation and have quantity > 0
    return items.filter((item: any) => {
      const hasQuantity = item.quantity && parseFloat(item.quantity.toString()) > 0;
      const belongsToQuotation = 
        item.quotationId === quotationId ||
        item.rfqNumber === quotation.requestNumber ||
        item.rfqNumber === quotation.customRequestNumber;
        
      return hasQuantity && belongsToQuotation;
    }).map((item: any, index: number) => ({
      id: item.id || `item-${index}`,
      quotationId: quotationId,
      itemId: item.itemId || item.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice || item.price || item.rfqPrice,
      totalPrice: item.totalPrice || (parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || item.price || item.rfqPrice || 0)),
      currency: item.currency || 'EGP',
      // Item details - CORRECTED MAPPING: Data is stored differently than expected
      itemNumber: item.itemNumber || item.kItemId || item.id,
      kItemId: item.kItemId || item.id,
      // CORRECT THE SWAPPED DATA:
      partNumber: item.description && item.description.trim() !== '' ? item.description : 'غير محدد', // Part No from Column D (stored in description)
      lineItem: item.partNumber, // LINE ITEM from Column C (stored in partNumber field)
      description: item.uom, // Description from Column E (stored in uom field)
      unit: item.lineItem, // UOM from Column B (stored in lineItem field)
      category: item.category,
      brand: item.brand,
      // Supplier details
      supplierName: item.supplierName,
      supplierQuoteDate: item.supplierQuoteDate,
      // Additional fields for better display
      rfqPrice: item.rfqPrice,
      rfqDate: item.rfqDate,
      poNumber: item.poNumber,
      poDate: item.poDate,
      poQuantity: item.poQuantity,
      poPrice: item.poPrice
    }));
  }
  
  getAllClients() {
    // Return default clients based on data
    return [
      {
        id: 'edc-client',
        name: 'EDC',
        phone: '+20-xxx-xxx-xxxx',
        email: 'info@edc.com',
        address: 'القاهرة، مصر',
        createdAt: new Date().toISOString()
      },
      {
        id: 'default-client',
        name: 'العميل الافتراضي',
        phone: '',
        email: '',
        address: '',
        createdAt: new Date().toISOString()
      }
    ];
  }
  
  // Add stub methods for other required storage functions
  async getAllQuotationRequests() {
    return this.getQuotationRequests();
  }
  
  async getAllQuotationRequestsWithClients() {
    const quotations = this.getQuotationRequests();
    const clients = this.getAllClients();
    
    return quotations.map(q => {
      const client = clients.find(c => c.id === q.clientId);
      return {
        ...q,
        clientName: client?.name || q.clientName
      };
    });
  }
  
  async getQuotationRequest(id: string) {
    return this.getQuotationById(id);
  }
}

export const sheetsFallbackStorage = new SheetsFallbackStorage();