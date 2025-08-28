// نظام محسن لمنع التكرار وتوحيد المعرفات
// Enhanced Duplicate Prevention and ID Unification System

import { format } from 'date-fns';

interface ProductSignature {
  manufacturer: string;
  model: string;
  specifications: string[];
  voltage?: string;
  current?: string;
  power?: string;
  type: string;
}

interface ItemData {
  id: string;
  itemNumber: string;
  partNumber: string;
  description: string;
  lineItem: string;
  category: string;
}

class EnhancedDuplicatePreventionSystem {
  private static instance: EnhancedDuplicatePreventionSystem;
  private productSignatures = new Map<string, ItemData>();
  private partNumberAliases = new Map<string, string>(); // maps alternative part numbers to master part number
  private brandAliases = new Map<string, string>(); // maps brand variations to standard name
  
  private constructor() {
    this.initializeBrandAliases();
    this.initializeKnownPartNumberAliases();
  }

  public static getInstance(): EnhancedDuplicatePreventionSystem {
    if (!this.instance) {
      this.instance = new EnhancedDuplicatePreventionSystem();
    }
    return this.instance;
  }

  private initializeBrandAliases() {
    // توحيد أسماء العلامات التجارية المختلفة
    this.brandAliases.set('SCHNEIDER', 'SCHNEIDER');
    this.brandAliases.set('SCHNIEDER', 'SCHNEIDER');
    this.brandAliases.set('TELEMECANIQUE', 'SCHNEIDER');
    this.brandAliases.set('SQUARE D', 'SCHNEIDER');
    
    this.brandAliases.set('SIEMENS', 'SIEMENS');
    this.brandAliases.set('ABB', 'ABB');
    this.brandAliases.set('ALLEN BRADLEY', 'ALLEN BRADLEY');
    this.brandAliases.set('ROCKWELL', 'ALLEN BRADLEY');
  }

  private initializeKnownPartNumberAliases() {
    // أرقام القطع المعروفة التي تشير لنفس المنتج
    // LC1D 32M7 يمكن أن يكون له أرقام مرجعية مختلفة
    this.partNumberAliases.set('2102049', 'LC1D32M7');
    this.partNumberAliases.set('2102034', 'LC1D32M7');
    this.partNumberAliases.set('LC1D 32 M7', 'LC1D32M7');
    this.partNumberAliases.set('LC1D32M7', 'LC1D32M7');
    this.partNumberAliases.set('LC1D 32M7', 'LC1D32M7');
  }

  // استخراج التوقيع الفني للمنتج
  private extractProductSignature(item: ItemData): ProductSignature {
    const description = item.description.toUpperCase();
    const partNumber = item.partNumber?.toUpperCase() || '';
    
    // استخراج الشركة المصنعة
    let manufacturer = 'UNKNOWN';
    for (const [alias, standard] of this.brandAliases) {
      if (description.includes(alias) || partNumber.includes(alias)) {
        manufacturer = standard;
        break;
      }
    }

    // استخراج نوع المنتج
    let type = 'UNKNOWN';
    if (description.includes('CONTACTOR')) type = 'CONTACTOR';
    else if (description.includes('RELAY')) type = 'RELAY';
    else if (description.includes('SWITCH')) type = 'SWITCH';
    else if (description.includes('BREAKER')) type = 'BREAKER';
    else if (description.includes('MOTOR')) type = 'MOTOR';

    // استخراج المواصفات الفنية
    const specifications: string[] = [];
    
    // استخراج الجهد
    const voltageMatch = description.match(/(\d+)V/);
    const voltage = voltageMatch ? voltageMatch[1] + 'V' : undefined;
    if (voltage) specifications.push(`VOLTAGE_${voltage}`);

    // استخراج التيار
    const currentMatch = description.match(/(\d+)A/);
    const current = currentMatch ? currentMatch[1] + 'A' : undefined;
    if (current) specifications.push(`CURRENT_${current}`);

    // استخراج القدرة
    const powerMatch = description.match(/(\d+)\s*KW/);
    const power = powerMatch ? powerMatch[1] + 'KW' : undefined;
    if (power) specifications.push(`POWER_${power}`);

    // استخراج التردد
    const frequencyMatch = description.match(/(\d+)HZ/);
    if (frequencyMatch) specifications.push(`FREQUENCY_${frequencyMatch[1]}HZ`);

    // تنظيف وتوحيد رقم الموديل
    let model = this.normalizePartNumber(partNumber);
    if (!model && item.lineItem) {
      model = this.normalizePartNumber(item.lineItem);
    }

    return {
      manufacturer,
      model,
      specifications: specifications.sort(),
      voltage,
      current,
      power,
      type
    };
  }

  // تنظيف وتوحيد أرقام القطع
  private normalizePartNumber(partNumber: string): string {
    if (!partNumber) return '';
    
    // إزالة المسافات والرموز الخاصة
    const normalized = partNumber
      .toUpperCase()
      .replace(/[\s\-_\.]/g, '')
      .trim();

    // التحقق من الأرقام المعروفة المترادفة
    for (const [alias, master] of this.partNumberAliases) {
      const normalizedAlias = alias.replace(/[\s\-_\.]/g, '').toUpperCase();
      if (normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized)) {
        return master;
      }
    }

    return normalized;
  }

  // إنشاء مفتاح فريد للمنتج بناءً على التوقيع الفني
  private createProductKey(signature: ProductSignature): string {
    const keyParts = [
      signature.manufacturer,
      signature.model,
      signature.type,
      ...signature.specifications
    ].filter(part => part && part !== 'UNKNOWN');

    return keyParts.join('_');
  }

  // فحص ما إذا كان البند مكرر
  public checkForDuplicate(newItem: ItemData): { isDuplicate: boolean; existingItem?: ItemData; confidence: number; reason: string } {
    console.log(`🔍 فحص التكرار للبند: ${newItem.itemNumber} - ${newItem.partNumber}`);
    
    const newSignature = this.extractProductSignature(newItem);
    const newKey = this.createProductKey(newSignature);
    
    console.log(`📋 التوقيع الفني: ${newKey}`);

    // البحث عن مطابقة مباشرة
    const existingItem = this.productSignatures.get(newKey);
    if (existingItem) {
      return {
        isDuplicate: true,
        existingItem,
        confidence: 1.0,
        reason: `مطابقة فنية كاملة: ${newKey}`
      };
    }

    // البحث عن مطابقات جزئية عالية الثقة
    for (const [key, item] of this.productSignatures) {
      const similarity = this.calculateSignatureSimilarity(newKey, key);
      if (similarity >= 0.9) {
        return {
          isDuplicate: true,
          existingItem: item,
          confidence: similarity,
          reason: `تشابه فني عالي (${(similarity * 100).toFixed(1)}%): ${key}`
        };
      }
    }

    return {
      isDuplicate: false,
      confidence: 0,
      reason: 'منتج فريد - لا توجد مطابقات'
    };
  }

  // حساب التشابه بين توقيعين فنيين
  private calculateSignatureSimilarity(key1: string, key2: string): number {
    const parts1 = new Set(key1.split('_'));
    const parts2 = new Set(key2.split('_'));
    
    const intersection = new Set([...parts1].filter(x => parts2.has(x)));
    const union = new Set([...parts1, ...parts2]);
    
    return intersection.size / union.size;
  }

  // تسجيل بند جديد في النظام
  public registerNewItem(item: ItemData): void {
    const signature = this.extractProductSignature(item);
    const key = this.createProductKey(signature);
    
    console.log(`✅ تسجيل بند جديد: ${item.itemNumber} بالتوقيع: ${key}`);
    this.productSignatures.set(key, item);
  }

  // تحديث معرف بند موجود (في حالة التوحيد)
  public updateItemId(oldKey: string, newItem: ItemData): void {
    this.productSignatures.delete(oldKey);
    this.registerNewItem(newItem);
  }

  // الحصول على إحصائيات النظام
  public getStatistics() {
    return {
      totalUniqueProducts: this.productSignatures.size,
      knownAliases: this.partNumberAliases.size,
      brandAliases: this.brandAliases.size,
      registeredAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
    };
  }

  // مسح ذاكرة التخزين المؤقت (للاختبار)
  public clearCache(): void {
    this.productSignatures.clear();
    console.log('🗑️ تم مسح ذاكرة التخزين المؤقت للمنتجات');
  }

  // تحميل البنود الموجودة من قاعدة البيانات
  public async loadExistingItems(items: ItemData[]): Promise<void> {
    console.log(`📚 تحميل ${items.length} بند موجود إلى نظام منع التكرار...`);
    
    for (const item of items) {
      try {
        this.registerNewItem(item);
      } catch (error) {
        console.error(`❌ خطأ في تحميل البند ${item.itemNumber}:`, error);
      }
    }
    
    console.log(`✅ تم تحميل ${this.productSignatures.size} منتج فريد`);
  }

  // البحث عن جميع التكرارات في قائمة البنود
  public findAllDuplicates(items: ItemData[]): Array<{
    masterItem: ItemData;
    duplicates: ItemData[];
    confidence: number;
    productKey: string;
  }> {
    console.log(`🔍 البحث عن التكرارات في ${items.length} بند...`);
    
    const duplicateGroups: Array<{
      masterItem: ItemData;
      duplicates: ItemData[];
      confidence: number;
      productKey: string;
    }> = [];

    const processedKeys = new Set<string>();
    const itemsByKey = new Map<string, ItemData[]>();

    // تجميع البنود حسب التوقيع الفني
    for (const item of items) {
      const signature = this.extractProductSignature(item);
      const key = this.createProductKey(signature);
      
      if (!itemsByKey.has(key)) {
        itemsByKey.set(key, []);
      }
      itemsByKey.get(key)!.push(item);
    }

    // العثور على المجموعات التي تحتوي على أكثر من بند واحد
    for (const [key, groupItems] of itemsByKey) {
      if (groupItems.length > 1 && !processedKeys.has(key)) {
        // ترتيب البنود حسب الأولوية (الأقدم أولاً)
        const sortedItems = groupItems.sort((a, b) => 
          parseInt(a.itemNumber.replace('P-', '')) - parseInt(b.itemNumber.replace('P-', ''))
        );

        duplicateGroups.push({
          masterItem: sortedItems[0], // البند الأول يصبح المعرف الرئيسي
          duplicates: sortedItems.slice(1), // باقي البنود تعتبر مكررة
          confidence: 1.0,
          productKey: key
        });

        processedKeys.add(key);
      }
    }

    console.log(`🎯 تم العثور على ${duplicateGroups.length} مجموعة تكرار`);
    return duplicateGroups;
  }
}

export { EnhancedDuplicatePreventionSystem, ProductSignature, ItemData };