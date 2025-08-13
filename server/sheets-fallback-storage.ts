import { readFileSync } from 'fs';

/**
 * Storage fallback that uses Google Sheets data when PostgreSQL database is unavailable
 */
export class SheetsFallbackStorage {
  private sheetsData: any = null;
  
  constructor() {
    this.loadSheetsData();
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
  
  getQuotationRequests() {
    if (!this.sheetsData) return [];
    
    // Extract quotation requests from the data
    const quotations = this.sheetsData.quotations || this.sheetsData.rfqs || [];
    
    return quotations.map((q: any, index: number) => ({
      id: q.id || `rfq-sheets-${q.requestNumber || index}`,
      requestNumber: q.requestNumber || q.rfqNumber || `25R${String(index).padStart(6, '0')}`,
      customRequestNumber: q.customRequestNumber || q.customNumber,
      clientId: q.clientId || 'default-client',
      clientName: q.clientName || 'عميل افتراضي',
      requestDate: q.requestDate || new Date().toISOString(),
      expiryDate: q.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: q.status || 'pending',
      responsibleEmployee: q.responsibleEmployee || 'الموظف المسؤول',
      notes: q.notes || '',
      createdAt: q.createdAt || new Date().toISOString(),
      createdBy: q.createdBy || 'system'
    }));
  }
  
  getQuotationById(id: string) {
    const quotations = this.getQuotationRequests();
    return quotations.find((q: any) => 
      q.id === id || 
      q.requestNumber === id ||
      q.customRequestNumber === id
    );
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
      unitPrice: item.unitPrice || item.price,
      totalPrice: item.totalPrice || (parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || item.price || 0)),
      currency: item.currency || 'EGP',
      // Item details
      itemNumber: item.itemNumber || item.kItemId,
      kItemId: item.kItemId,
      partNumber: item.partNumber,
      lineItem: item.lineItem,
      description: item.description,
      unit: item.unit || item.uom,
      category: item.category,
      brand: item.brand,
      // Supplier details
      supplierName: item.supplierName,
      supplierQuoteDate: item.supplierQuoteDate
    }));
  }
  
  getAllClients() {
    // Return default clients based on data
    return [
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
}

export const sheetsFallbackStorage = new SheetsFallbackStorage();