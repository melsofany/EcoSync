/**
 * مطابق أعمدة Excel التلقائي الذكي
 * يحلل أسماء الأعمدة ويطابقها تلقائياً مع الحقول المطلوبة
 */

interface ColumnMapping {
  lineItem: string;
  partNumber: string;
  description: string;
  quantity: string;
  unit: string;
  requestDate: string;
  expiryDate: string;
  clientName: string;
  rfqNumber: string;
  unitPrice: string;
}

interface MappingResult {
  columnMapping: ColumnMapping;
  confidence: number;
  mappedFields: number;
  totalFields: number;
  suggestions: string[];
}

const FIELD_PATTERNS = {
  lineItem: [
    'line item', 'lineitem', 'line_item', 'line no', 'lineno', 'item no', 'itemno',
    'بند', 'رقم البند', 'line', 'item', 'ln'
  ],
  partNumber: [
    'part no', 'partno', 'part_no', 'part number', 'partnumber', 'p/n', 'pn',
    'رقم القطعة', 'part', 'spare part', 'component'
  ],
  description: [
    'description', 'desc', 'item description', 'product description',
    'التوصيف', 'الوصف', 'توصيف', 'وصف'
  ],
  quantity: [
    'quantity', 'qty', 'qtn', 'amount', 'count',
    'الكمية', 'كمية', 'عدد'
  ],
  unit: [
    'uom', 'unit', 'unit of measure', 'units', 'measure',
    'وحدة القياس', 'وحدة', 'قياس'
  ],
  requestDate: [
    'request date', 'req date', 'date requested', 'order date', 'date',
    'تاريخ الطلب', 'تاريخ', 'التاريخ'
  ],
  expiryDate: [
    'response date', 'expiry date', 'exp date', 'due date', 'deadline',
    'تاريخ الانتهاء', 'تاريخ الرد', 'انتهاء'
  ],
  clientName: [
    'client', 'customer', 'client name', 'customer name', 'company',
    'العميل', 'اسم العميل', 'الشركة', 'عميل'
  ],
  rfqNumber: [
    'rfq', 'rfq no', 'rfq number', 'request number', 'req no', 'source file',
    'رقم الطلب', 'رقم التسعير', 'طلب', 'source'
  ],
  unitPrice: [
    'price', 'unit price', 'cost', 'rate', 'amount',
    'السعر', 'سعر الوحدة', 'تكلفة', 'مبلغ'
  ]
};

/**
 * مطابقة الأعمدة تلقائياً
 */
export function autoMapColumns(excelColumns: string[]): MappingResult {
  const mapping: Partial<ColumnMapping> = {};
  const suggestions: string[] = [];
  let mappedFields = 0;

  // تحويل أسماء الأعمدة إلى أحرف صغيرة وإزالة المسافات للمقارنة
  const normalizedColumns = excelColumns.map(col => ({
    original: col,
    normalized: col.toLowerCase().trim().replace(/\s+/g, ' ')
  }));

  // مطابقة كل حقل مطلوب
  for (const [fieldKey, patterns] of Object.entries(FIELD_PATTERNS)) {
    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const column of normalizedColumns) {
      for (const pattern of patterns) {
        const score = calculateSimilarity(column.normalized, pattern.toLowerCase());
        
        if (score > bestScore && score > 0.6) { // عتبة التشابه 60%
          bestScore = score;
          bestMatch = column.original;
        }
      }
    }

    if (bestMatch) {
      (mapping as any)[fieldKey] = bestMatch;
      mappedFields++;
      suggestions.push(`✅ ${getFieldLabel(fieldKey)}: "${bestMatch}" (${Math.round(bestScore * 100)}%)`);
    } else {
      suggestions.push(`❌ ${getFieldLabel(fieldKey)}: غير موجود`);
    }
  }

  const confidence = Math.round((mappedFields / Object.keys(FIELD_PATTERNS).length) * 100);

  return {
    columnMapping: mapping as ColumnMapping,
    confidence,
    mappedFields,
    totalFields: Object.keys(FIELD_PATTERNS).length,
    suggestions
  };
}

/**
 * حساب نسبة التشابه بين نصين
 */
function calculateSimilarity(str1: string, str2: string): number {
  // مطابقة مباشرة
  if (str1 === str2) return 1.0;
  
  // مطابقة جزئية
  if (str1.includes(str2) || str2.includes(str1)) return 0.8;
  
  // مطابقة الكلمات المفتاحية
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  
  let commonWords = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 && word1.length > 2) {
        commonWords++;
      }
    }
  }
  
  if (commonWords > 0) {
    return Math.min(0.7, commonWords / Math.max(words1.length, words2.length));
  }
  
  // مطابقة الأحرف المشتركة (لحالات الأخطاء الإملائية)
  const commonChars = countCommonChars(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  if (maxLength === 0) return 0;
  
  const charSimilarity = commonChars / maxLength;
  return charSimilarity > 0.5 ? charSimilarity * 0.6 : 0;
}

/**
 * عد الأحرف المشتركة
 */
function countCommonChars(str1: string, str2: string): number {
  const chars1 = [...str1];
  const chars2 = [...str2];
  let common = 0;
  
  for (const char of chars1) {
    const index = chars2.indexOf(char);
    if (index !== -1) {
      common++;
      chars2.splice(index, 1);
    }
  }
  
  return common;
}

/**
 * الحصول على تسمية الحقل بالعربية
 */
function getFieldLabel(fieldKey: string): string {
  const labels: Record<string, string> = {
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
  
  return labels[fieldKey] || fieldKey;
}

/**
 * تنسيق نتائج المطابقة للعرض
 */
export function formatMappingResults(result: MappingResult): string {
  let output = `\n🎯 نتائج المطابقة التلقائية:\n`;
  output += `📊 الثقة: ${result.confidence}% (${result.mappedFields}/${result.totalFields} حقل)\n\n`;
  
  output += `📋 مطابقة الأعمدة:\n`;
  for (const suggestion of result.suggestions) {
    output += `   ${suggestion}\n`;
  }
  
  return output;
}