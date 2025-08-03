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

export function convertExcelDate(serialDate: any): string {
  if (!serialDate || isNaN(serialDate)) return '';
  const utc_days = Math.floor(serialDate - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  const year = date_info.getFullYear();
  const month = String(date_info.getMonth() + 1).padStart(2, '0');
  const day = String(date_info.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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