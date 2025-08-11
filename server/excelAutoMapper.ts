// نظام المطابقة التلقائية الذكي لأعمدة Excel
export interface AutoMappingResult {
  columnMapping: Record<string, string>;
  confidence: number;
  suggestions: Array<{
    field: string;
    column: string;
    confidence: number;
    reason: string;
  }>;
}

// قاموس المطابقة الذكية
const SMART_MAPPING_DICTIONARY = {
  lineItem: [
    'LINE ITEM', 'line item', 'Line Item', 'lineitem', 'Item No', 'ITEM NO', 'البند', 'رقم البند'
  ],
  partNumber: [
    'PART NO', 'part no', 'Part No', 'partno', 'part number', 'Part Number', 'PART NUMBER', 'رقم القطعة'
  ],
  description: [
    'Description', 'DESCRIPTION', 'description', 'DESC', 'desc', 'التوصيف', 'الوصف'
  ],
  quantity: [
    'Quantity', 'QUANTITY', 'quantity', 'QTY', 'qty', 'Qty', 'الكمية'
  ],
  unit: [
    'uom', 'UOM', 'Unit', 'UNIT', 'unit', 'وحدة القياس', 'الوحدة'
  ],
  requestDate: [
    'Request Date', 'REQUEST DATE', 'request date', 'RFQ Date', 'rfq date', 'تاريخ الطلب'
  ],
  expiryDate: [
    'Response Date', 'RESPONSE DATE', 'response date', 'Expiry Date', 'expiry date', 'تاريخ انتهاء العرض'
  ],
  clientName: [
    'العميل ', 'العميل', 'Client', 'CLIENT', 'client', 'Customer', 'CUSTOMER', 'customer', 'اسم العميل'
  ],
  rfqNumber: [
    'Source File', 'SOURCE FILE', 'source file', 'RFQ No', 'rfq no', 'RFQ NUMBER', 'رقم الطلب'
  ],
  unitPrice: [
    'price', 'PRICE', 'Price', 'Unit Price', 'unit price', 'UNIT PRICE', 'السعر'
  ]
};

// دالة المطابقة الذكية
export function autoMapColumns(excelColumns: string[]): AutoMappingResult {
  const columnMapping: Record<string, string> = {};
  const suggestions: Array<{
    field: string;
    column: string;
    confidence: number;
    reason: string;
  }> = [];

  // لكل حقل في قاموس البيانات
  for (const [field, possibleNames] of Object.entries(SMART_MAPPING_DICTIONARY)) {
    let bestMatch: { column: string; confidence: number; reason: string } | null = null;

    // البحث عن أفضل مطابقة
    for (const excelColumn of excelColumns) {
      for (const possibleName of possibleNames) {
        let confidence = 0;
        let reason = '';

        // مطابقة تامة
        if (excelColumn === possibleName) {
          confidence = 100;
          reason = 'مطابقة تامة';
        }
        // مطابقة بدون حساسية للحروف
        else if (excelColumn.toLowerCase() === possibleName.toLowerCase()) {
          confidence = 95;
          reason = 'مطابقة بدون حساسية للحروف';
        }
        // يحتوي على النص
        else if (excelColumn.toLowerCase().includes(possibleName.toLowerCase())) {
          confidence = 80;
          reason = 'يحتوي على النص المطلوب';
        }
        // النص يحتوي على العمود
        else if (possibleName.toLowerCase().includes(excelColumn.toLowerCase())) {
          confidence = 70;
          reason = 'مطابقة جزئية';
        }

        // إذا وجدنا مطابقة أفضل
        if (confidence > 0 && (!bestMatch || confidence > bestMatch.confidence)) {
          bestMatch = { column: excelColumn, confidence, reason };
        }
      }
    }

    // إضافة أفضل مطابقة
    if (bestMatch && bestMatch.confidence >= 70) {
      columnMapping[field] = bestMatch.column;
      suggestions.push({
        field,
        column: bestMatch.column,
        confidence: bestMatch.confidence,
        reason: bestMatch.reason
      });
    }
  }

  // حساب الثقة الإجمالية
  const totalFields = Object.keys(SMART_MAPPING_DICTIONARY).length;
  const mappedFields = Object.keys(columnMapping).length;
  const overallConfidence = Math.round((mappedFields / totalFields) * 100);

  return {
    columnMapping,
    confidence: overallConfidence,
    suggestions
  };
}

// دالة لعرض نتائج المطابقة
export function formatMappingResults(result: AutoMappingResult): string {
  let output = `🤖 المطابقة التلقائية (الثقة: ${result.confidence}%)\n`;
  output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  
  for (const suggestion of result.suggestions) {
    const fieldNames: Record<string, string> = {
      lineItem: 'رقم البند',
      partNumber: 'رقم القطعة', 
      description: 'التوصيف',
      quantity: 'الكمية',
      unit: 'وحدة القياس',
      requestDate: 'تاريخ الطلب',
      expiryDate: 'تاريخ انتهاء العرض',
      clientName: 'اسم العميل',
      rfqNumber: 'رقم الطلب',
      unitPrice: 'سعر الوحدة'
    };
    
    const fieldName = fieldNames[suggestion.field] || suggestion.field;
    output += `✅ ${fieldName} ← "${suggestion.column}" (${suggestion.confidence}% - ${suggestion.reason})\n`;
  }
  
  return output;
}