// حل بسيط لاستيراد Excel مع مطابقة تلقائية ذكية
export function autoMapExcelColumns(excelColumns: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  // قاموس مطابقة بسيط
  const columnMaps = {
    lineItem: ['LINE ITEM', 'line item', 'Line Item', 'lineitem', 'Item No', 'ITEM NO'],
    partNumber: ['PART NO', 'part no', 'Part No', 'partno', 'part number', 'Part Number'],
    description: ['Description', 'DESCRIPTION', 'description', 'DESC', 'desc'],
    quantity: ['Quantity', 'QUANTITY', 'quantity', 'QTY', 'qty', 'Qty'],
    unit: ['uom', 'UOM', 'Unit', 'UNIT', 'unit'],
    requestDate: ['Request Date', 'REQUEST DATE', 'request date', 'RFQ Date'],
    expiryDate: ['Response Date', 'RESPONSE DATE', 'response date', 'Expiry Date'],
    clientName: ['العميل ', 'العميل', 'Client', 'CLIENT', 'client', 'Customer'],
    rfqNumber: ['Source File', 'SOURCE FILE', 'source file', 'RFQ No', 'rfq no'],
    unitPrice: ['price', 'PRICE', 'Price', 'Unit Price', 'unit price']
  };

  // مطابقة الأعمدة
  for (const [field, possibleNames] of Object.entries(columnMaps)) {
    for (const excelColumn of excelColumns) {
      for (const possibleName of possibleNames) {
        if (excelColumn === possibleName || 
            excelColumn.toLowerCase() === possibleName.toLowerCase() ||
            excelColumn.includes(possibleName) ||
            possibleName.includes(excelColumn)) {
          mapping[field] = excelColumn;
          break;
        }
      }
      if (mapping[field]) break;
    }
  }

  return mapping;
}

export function convertExcelDate(value: any): string {
  if (!value) return '';

  // إذا كان التاريخ عبارة عن string
  if (typeof value === 'string') {
    const cleanValue = value.trim();
    
    // تجربة تحويل التواريخ النصية المختلفة
    const dateFormats = [
      // تنسيقات مختلفة للتاريخ
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/YYYY or MM/DD/YYYY
      /(\d{1,2})-(\d{1,2})-(\d{4})/,   // DD-MM-YYYY or MM-DD-YYYY
      /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
      /(\d{1,2})\.(\d{1,2})\.(\d{4})/  // DD.MM.YYYY
    ];

    for (const format of dateFormats) {
      const match = cleanValue.match(format);
      if (match) {
        let day, month, year;
        if (format.source.startsWith('(\\d{4})')) {
          // YYYY-MM-DD format
          [, year, month, day] = match;
        } else {
          // Other formats - assume DD/MM/YYYY
          [, day, month, year] = match;
        }
        
        const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(parsedDate.getTime())) {
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
    }

    // تجربة تحويل مباشر للتاريخ
    const directDate = new Date(cleanValue);
    if (!isNaN(directDate.getTime())) {
      const year = directDate.getFullYear();
      const month = String(directDate.getMonth() + 1).padStart(2, '0');
      const day = String(directDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  // إذا كان رقم تسلسلي لـ Excel
  if (typeof value === 'number' && !isNaN(value)) {
    const utc_days = Math.floor(value - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const year = date_info.getFullYear();
    const month = String(date_info.getMonth() + 1).padStart(2, '0');
    const day = String(date_info.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // تاريخ افتراضي إذا فشل التحويل
  return new Date().toISOString().split('T')[0];
}

export function processExcelRowForQuotation(row: any, mapping: Record<string, string>, index: number) {
  return {
    rowIndex: index + 1,
    lineNumber: index + 1,
    requestNumber: row[mapping.rfqNumber] || `REQ-${Date.now()}-${index + 1}`,
    customRequestNumber: row[mapping.rfqNumber] || '',
    requestDate: convertExcelDate(row[mapping.requestDate]),
    expiryDate: convertExcelDate(row[mapping.expiryDate]),
    status: 'pending',
    clientName: row[mapping.clientName] || 'غير محدد',
    itemNumber: '',
    kItemId: '',
    partNumber: row[mapping.partNumber] || '',
    lineItem: row[mapping.lineItem] || '',
    description: row[mapping.description] || '',
    unit: row[mapping.unit] || 'غير محدد',
    category: '',
    brand: '',
    quantity: Number(row[mapping.quantity]) || 0,
    unitPrice: Number(row[mapping.unitPrice]) || 0,
    totalPrice: (Number(row[mapping.quantity]) || 0) * (Number(row[mapping.unitPrice]) || 0),
    currency: 'EGP',
    aiStatus: 'pending',
    aiMatchedItemId: null
  };
}