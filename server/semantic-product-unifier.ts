import { GoogleSheetsRealtimeData } from './google-sheets-realtime-data.js';

// واجهة المعنى الدلالي للمنتج
interface ProductSemantics {
  isValid: boolean;
  
  // المعلومات الأساسية
  brand: string;           // العلامة التجارية
  model: string;           // الموديل
  partNumber: string;      // رقم القطعة
  category: string;        // نوع المنتج
  
  // المواصفات التقنية
  voltage: string;         // الجهد
  current: string;         // التيار
  power: string;           // القدرة
  frequency: string;       // التردد
  capacity: string;        // السعة
  
  // الاستخدام
  application: string[];   // الاستخدام
  
  // الكلمات المفتاحية
  keywords: string[];      // الكلمات المهمة
}

export interface ProductItem {
  itemNumber: string;        // P-XXXXXXX
  description: string;       // التوصيف الكامل
  partNumber: string;        // رقم القطعة
  lineItem: string;          // LINE ITEM
  uom: string;               // وحدة القياس
  rfq: string;               // RFQ
  extractedSpecs: any;       // المواصفات المستخرجة
}

export interface UnificationGroup {
  masterId: string;
  masterDescription: string;
  items: ProductItem[];
  similarity: number;
  reason: string;
}

export interface UnificationResult {
  success: boolean;
  totalItems: number;
  groupsFound: number;
  groups: UnificationGroup[];
  message?: string;
}

export class SemanticProductUnifier {
  private dataService: GoogleSheetsRealtimeData;

  constructor(dataService: GoogleSheetsRealtimeData) {
    this.dataService = dataService;
  }

  async unifyItems(): Promise<UnificationResult> {
    try {
      console.log('🔄 بدء عملية التوحيد الدلالي الذكي...');
      
      // قراءة البيانات
      const items = await this.dataService.getAllItems();
      console.log(`📊 تم تحميل ${items.length} بند للتحليل`);

      if (items.length === 0) {
        return {
          success: false,
          totalItems: 0,
          groupsFound: 0,
          groups: [],
          message: 'لا توجد بيانات للتوحيد'
        };
      }

      // تحويل البيانات إلى التنسيق المطلوب
      const productItems: ProductItem[] = items.map(item => ({
        itemNumber: item.itemNumber || item.id,
        description: item.description || '',
        partNumber: item.partNumber || '',
        lineItem: item.lineItem || '',
        uom: item.uom || '',
        rfq: item.rfqNumber || '',
        extractedSpecs: {}
      }));

      console.log(`🔍 عينة من البيانات للتحليل:`);
      for (let i = 0; i < Math.min(5, productItems.length); i++) {
        const item = productItems[i];
        console.log(`  ${i + 1}. ${item.itemNumber}: ${item.description.substring(0, 60)}...`);
      }

      // تجميع البنود المتشابهة
      const groups = this.findSemanticGroups(productItems);
      console.log(`✅ تم العثور على ${groups.length} مجموعة متطابقة`);

      return {
        success: true,
        totalItems: items.length,
        groupsFound: groups.length,
        groups: groups
      };

    } catch (error) {
      console.error('❌ خطأ في التوحيد:', error);
      return {
        success: false,
        totalItems: 0,
        groupsFound: 0,
        groups: [],
        message: `خطأ في التوحيد: ${(error as Error).message}`
      };
    }
  }

  private findSemanticGroups(items: ProductItem[]): UnificationGroup[] {
    const groups: UnificationGroup[] = [];
    const processedItems = new Set<string>();

    for (let i = 0; i < items.length; i++) {
      const item1 = items[i];
      
      if (processedItems.has(item1.itemNumber)) {
        continue;
      }

      const groupItems: ProductItem[] = [item1];
      processedItems.add(item1.itemNumber);

      // البحث عن العناصر المتطابقة
      for (let j = i + 1; j < items.length; j++) {
        const item2 = items[j];
        
        if (processedItems.has(item2.itemNumber)) {
          continue;
        }

        const similarity = this.calculateSemanticSimilarity(item1, item2);
        
        // تقليل عتبة التطابق لإيجاد مجموعات أكثر
        if (similarity.score >= 0.6) {
          console.log(`🔍 تطابق محتمل: ${item1.itemNumber} مع ${item2.itemNumber} - درجة: ${similarity.score.toFixed(2)} - السبب: ${similarity.reason}`);
          groupItems.push(item2);
          processedItems.add(item2.itemNumber);
        } else if (similarity.score >= 0.4) {
          console.log(`⚠️ تطابق ضعيف: ${item1.itemNumber} مع ${item2.itemNumber} - درجة: ${similarity.score.toFixed(2)} - السبب: ${similarity.reason}`);
        }
      }

      // إنشاء مجموعة إذا كان هناك أكثر من عنصر
      if (groupItems.length > 1) {
        groups.push({
          masterId: item1.itemNumber,
          masterDescription: item1.description,
          items: groupItems,
          similarity: 0.9,
          reason: 'تطابق دلالي ذكي'
        });
      }
    }

    return groups;
  }

  private calculateSemanticSimilarity(item1: ProductItem, item2: ProductItem): {score: number, reason: string} {
    // تجنب مقارنة البند مع نفسه
    if (item1.itemNumber === item2.itemNumber) {
      return { score: 0, reason: 'نفس البند - مرفوض' };
    }
    
    // التحليل الدلالي الذكي للمنتجات
    const semantics1 = this.extractProductSemantics(item1.description, item1.partNumber);
    const semantics2 = this.extractProductSemantics(item2.description, item2.partNumber);
    
    if (!semantics1.isValid || !semantics2.isValid) {
      return { score: 0, reason: 'بيانات غير كافية للمقارنة' };
    }
    
    // حساب التطابق الدلالي
    const similarity = this.calculateSemanticMatch(semantics1, semantics2);
    
    return similarity;
  }

  private extractProductSemantics(description: string, partNumber: string = ''): ProductSemantics {
    const text = (description + ' ' + partNumber).toUpperCase();
    
    const semantics: ProductSemantics = {
      isValid: false,
      brand: this.extractBrand(text),
      model: this.extractModel(text),
      partNumber: this.extractPartNumber(text, partNumber),
      category: this.extractCategory(text),
      voltage: this.extractVoltage(text),
      current: this.extractCurrent(text),
      power: this.extractPower(text),
      frequency: this.extractFrequency(text),
      capacity: this.extractCapacity(text),
      application: this.extractApplication(text),
      keywords: this.extractKeywords(text)
    };
    
    // تحديد صحة البيانات
    semantics.isValid = !!(semantics.brand && semantics.category) || 
                       !!(semantics.partNumber && semantics.category) ||
                       !!(semantics.model && semantics.category);
    
    return semantics;
  }

  private calculateSemanticMatch(sem1: ProductSemantics, sem2: ProductSemantics): {score: number, reason: string} {
    let score = 0;
    let matchReasons: string[] = [];
    
    // مطابقة رقم القطعة (وزن 40%)
    if (sem1.partNumber && sem2.partNumber && this.normalizePartNumber(sem1.partNumber) === this.normalizePartNumber(sem2.partNumber)) {
      score += 0.4;
      matchReasons.push('رقم قطعة متطابق');
    }
    
    // مطابقة العلامة التجارية + الموديل (وزن 35%)
    if (sem1.brand && sem2.brand && this.normalizeBrand(sem1.brand) === this.normalizeBrand(sem2.brand)) {
      if (sem1.model && sem2.model && this.normalizeModel(sem1.model) === this.normalizeModel(sem2.model)) {
        score += 0.35;
        matchReasons.push(`${sem1.brand} ${sem1.model}`);
      } else if (!sem1.model || !sem2.model) {
        score += 0.2; // مطابقة علامة فقط
        matchReasons.push(`علامة ${sem1.brand}`);
      }
    }
    
    // مطابقة الفئة + المواصفات (وزن 25%)
    if (sem1.category && sem2.category && sem1.category === sem2.category) {
      let specMatches = 0;
      if (sem1.voltage && sem2.voltage && sem1.voltage === sem2.voltage) specMatches++;
      if (sem1.current && sem2.current && sem1.current === sem2.current) specMatches++;
      if (sem1.power && sem2.power && sem1.power === sem2.power) specMatches++;
      if (sem1.frequency && sem2.frequency && sem1.frequency === sem2.frequency) specMatches++;
      
      if (specMatches >= 2) {
        score += 0.25;
        matchReasons.push(`${sem1.category} بمواصفات متطابقة`);
      } else if (specMatches >= 1) {
        score += 0.15;
        matchReasons.push(`${sem1.category} بمواصفات جزئية`);
      } else {
        score += 0.05; // مطابقة فئة فقط
        matchReasons.push(`نفس الفئة: ${sem1.category}`);
      }
    }
    
    // تحسين: مطابقة الكلمات المفتاحية المشتركة
    if (sem1.keywords.length > 0 && sem2.keywords.length > 0) {
      const commonKeywords = sem1.keywords.filter(k1 => 
        sem2.keywords.some(k2 => this.normalizeKeyword(k1) === this.normalizeKeyword(k2))
      );
      
      if (commonKeywords.length >= 3) {
        score += 0.15;
        matchReasons.push(`كلمات مشتركة: ${commonKeywords.slice(0, 2).join(', ')}`);
      } else if (commonKeywords.length >= 2) {
        score += 0.1;
        matchReasons.push(`كلمات مشتركة: ${commonKeywords.join(', ')}`);
      }
    }
    
    const reason = matchReasons.length > 0 ? matchReasons.join(' + ') : 'لا توجد تطابقات دلالية';
    return { score, reason };
  }
  
  private normalizeKeyword(keyword: string): string {
    return keyword.replace(/[^\w]/g, '').toUpperCase();
  }
  
  // دوال استخراج المعلومات 
  private extractBrand(text: string): string {
    const brands = [
      'SCHNEIDER', 'SCHNIEDER', 'TELEMECANIQUE',
      'ABB', 'SIEMENS', 'OMRON', 'ALLEN BRADLEY',
      'LEGRAND', 'HAGER', 'LOVATO', 'CHINT',
      'شنايدر', 'سيمنس', 'أبي'
    ];
    
    for (const brand of brands) {
      if (text.includes(brand)) {
        return brand;
      }
    }
    return '';
  }
  
  private extractModel(text: string): string {
    // استخراج الموديل من النص
    const modelPatterns = [
      /LC1D\s*\d+\s*[A-Z]\d*/g,    // LC1D 32 M7
      /[A-Z]+\d+[A-Z]*\d*/g        // نماذج عامة
    ];
    
    for (const pattern of modelPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        return matches[0].replace(/\s+/g, '');
      }
    }
    return '';
  }
  
  private extractPartNumber(text: string, providedPartNumber: string): string {
    if (providedPartNumber && providedPartNumber.trim() !== '') {
      return providedPartNumber.trim();
    }
    
    // استخراج رقم القطعة من النص
    const partNumberPatterns = [
      /P\/N\s*:?\s*([A-Z0-9\-\s]+)/i,
      /PART\s*NO\.?\s*:?\s*([A-Z0-9\-\s]+)/i,
      /REF\.?\s*PN\/\s*([A-Z0-9\-\s]+)/i
    ];
    
    for (const pattern of partNumberPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim().split(' ')[0]; // أول جزء
      }
    }
    return '';
  }
  
  private extractCategory(text: string): string {
    const categories = [
      'CONTACTOR', 'RELAY', 'BREAKER', 'SWITCH', 'FUSE',
      'MOTOR', 'TRANSFORMER', 'CAPACITOR', 'RESISTOR',
      'كونتاكتور', 'ريلاي', 'قاطع'
    ];
    
    for (const category of categories) {
      if (text.includes(category)) {
        return category;
      }
    }
    return '';
  }
  
  private extractVoltage(text: string): string {
    const voltageMatch = text.match(/(\d+)\s*V(?!A)/g);
    return voltageMatch ? voltageMatch[0] : '';
  }
  
  private extractCurrent(text: string): string {
    const currentMatch = text.match(/(\d+)\s*A(?:MP)?/g);
    return currentMatch ? currentMatch[0] : '';
  }
  
  private extractPower(text: string): string {
    const powerMatch = text.match(/(\d+)\s*KW/g);
    return powerMatch ? powerMatch[0] : '';
  }
  
  private extractFrequency(text: string): string {
    const frequencyMatch = text.match(/(\d+)\s*HZ/g);
    return frequencyMatch ? frequencyMatch[0] : '';
  }
  
  private extractCapacity(text: string): string {
    const capacityMatch = text.match(/(\d+)\s*AMP/g);
    return capacityMatch ? capacityMatch[0] : '';
  }
  
  private extractApplication(text: string): string[] {
    const applications = [];
    if (text.includes('GRILL')) applications.push('GRILL');
    if (text.includes('FRYER')) applications.push('FRYER');
    if (text.includes('MOTOR')) applications.push('MOTOR');
    if (text.includes('ELECTRIC')) applications.push('ELECTRIC');
    return applications;
  }
  
  private extractKeywords(text: string): string[] {
    return text.split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['THE', 'AND', 'FOR', 'WITH'].includes(word))
      .slice(0, 10);
  }
  
  // دوال التطبيع
  private normalizePartNumber(partNumber: string): string {
    return partNumber.replace(/[\s\-\_]/g, '').toUpperCase();
  }
  
  private normalizeBrand(brand: string): string {
    const brandMap: {[key: string]: string} = {
      'SCHNIEDER': 'SCHNEIDER',
      'TELEMECANIQUE': 'SCHNEIDER'
    };
    return brandMap[brand] || brand;
  }
  
  private normalizeModel(model: string): string {
    return model.replace(/[\s\-]/g, '').toUpperCase();
  }
}