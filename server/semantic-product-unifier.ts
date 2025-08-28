import { GoogleSheetsRealtimeData } from './google-sheets-realtime-data.js';

export interface ProductItem {
  itemNumber: string;        // P-XXXXXXX
  description: string;       // التوصيف الكامل
  partNumber: string;        // رقم الجزء (عمود B)
  lineItem: string;          // LINE ITEM (عمود C)
  rowIndex: number;          // رقم الصف
  
  // البيانات المستخرجة للتحليل
  extractedSpecs: ProductSpecs;
}

export interface ProductSpecs {
  // المعلومات الأساسية
  manufacturer: string;      // الشركة المصنعة
  model: string;            // الموديل
  partNumber: string;       // رقم الجزء المطبع
  voltage: string;          // الجهد
  current: string;          // التيار
  power: string;            // القدرة
  frequency: string;        // التردد
  
  // المواصفات التقنية
  specifications: string[];  // قائمة المواصفات
  application: string;       // الاستخدام
  
  // الكلمات المفتاحية
  keywords: string[];        // الكلمات المهمة
}

export interface SemanticGroup {
  masterItem: ProductItem;
  duplicates: ProductItem[];
  confidence: number;        // نسبة الثقة في التطابق
  matchReason: string;       // سبب التطابق
}

export interface SemanticUnificationResult {
  totalProcessed: number;
  groupsFound: number;
  itemsUnified: number;
  groups: SemanticGroup[];
  processingTime: number;
}

export class SemanticProductUnifier {
  private googleSheetsData: GoogleSheetsRealtimeData;
  private isRunning = false;
  private progress = 0;
  private currentProcessingItem: {description: string, partNumber: string, lineItem: string} | null = null;

  constructor() {
    this.googleSheetsData = new GoogleSheetsRealtimeData();
  }

  async unifyProductsBySemantics(): Promise<SemanticUnificationResult> {
    if (this.isRunning) {
      throw new Error('عملية التوحيد الدلالي قيد التشغيل بالفعل');
    }

    this.isRunning = true;
    this.progress = 0;
    const startTime = Date.now();

    try {
      console.log('🧠 بدء التحليل الدلالي للمنتجات...');

      // 1. جلب وتحليل جميع البيانات
      this.progress = 10;
      console.log('📥 جاري جلب البيانات...');
      
      const allItems = await this.loadAndAnalyzeItems();
      console.log(`📊 تم تحليل ${allItems.length} منتج`);

      // 2. تجميع المنتجات بالتحليل الدلالي
      this.progress = 30;
      console.log('🔍 جاري البحث عن المجموعات الدلالية...');
      
      const semanticGroups = await this.groupItemsBySemantics(allItems);
      this.progress = 50;
      console.log(`🔍 تم العثور على ${semanticGroups.length} مجموعة دلالية`);

      // 3. توحيد المعرفات
      this.progress = 60;
      console.log('⚡ جاري توحيد المعرفات...');
      
      let totalUnified = 0;
      
      for (let i = 0; i < semanticGroups.length; i++) {
        const group = semanticGroups[i];
        await this.unifySemanticGroup(group);
        totalUnified += group.duplicates.length;
        
        // تحديث التقدم أثناء التوحيد
        this.progress = 60 + ((i + 1) / semanticGroups.length) * 35;
        
        console.log(`✅ توحيد ${group.duplicates.length} منتج تحت ${group.masterItem.itemNumber} (${group.confidence}% ثقة)`);
      }

      this.progress = 100;
      console.log('🎉 تم إنهاء التوحيد الدلالي بنجاح!');
      const processingTime = Date.now() - startTime;

      const result: SemanticUnificationResult = {
        totalProcessed: allItems.length,
        groupsFound: semanticGroups.length,
        itemsUnified: totalUnified,
        groups: semanticGroups,
        processingTime
      };

      console.log(`🎯 انتهى التحليل الدلالي: ${totalUnified} منتج تم توحيده في ${Math.round(processingTime/1000)}s`);
      return result;

    } catch (error) {
      console.error('❌ خطأ في التحليل الدلالي:', error);
      throw error;
    } finally {
      this.isRunning = false;
      this.progress = 0;
      this.currentProcessingItem = null;
    }
  }

  private async loadAndAnalyzeItems(): Promise<ProductItem[]> {
    try {
      const rawData = await this.googleSheetsData.readDataSheet();
      console.log(`📋 تم جلب ${rawData.length} صف من Google Sheets`);
      
      const items: ProductItem[] = [];
      
      for (let i = 0; i < rawData.length; i++) {
        try {
          const row = rawData[i];
          const description = (row[4] || '').toString().trim();
          
          if (!description) continue;
          
          const item: ProductItem = {
            itemNumber: row[0] || `P-${String(i + 2).padStart(7, '0')}`,
            description,
            partNumber: (row[1] || '').toString().trim(),
            lineItem: (row[2] || '').toString().trim(),
            rowIndex: i + 2,
            extractedSpecs: this.extractProductSpecs(description, row[1] || '')
          };
          
          items.push(item);
          
          // تحديث تدريجي للتقدم
          if (i % 500 === 0) {
            this.progress = 10 + ((i / rawData.length) * 15); // من 10% إلى 25%
            console.log(`⏳ تحليل البيانات: ${i}/${rawData.length} (${this.progress.toFixed(1)}%)`);
          }
          
        } catch (itemError) {
          console.warn(`⚠️ خطأ في تحليل الصف ${i + 2}:`, itemError);
          continue; // تخطي هذا الصف والاستمرار
        }
      }
      
      this.progress = 25;
      console.log(`✅ تم تحليل ${items.length} منتج من أصل ${rawData.length} صف`);
      return items;
      
    } catch (error) {
      console.error('❌ فشل في جلب البيانات:', error);
      throw new Error('فشل في جلب البيانات من Google Sheets');
    }
  }

  private extractProductSpecs(description: string, partNumber: string = ''): ProductSpecs {
    const text = (description + ' ' + partNumber).toUpperCase();
    
    // استخراج الشركة المصنعة
    const manufacturer = this.extractManufacturer(text);
    
    // استخراج الموديل ورقم الجزء
    const model = this.extractModel(text);
    const extractedPartNumber = this.extractPartNumber(text);
    
    // استخراج المواصفات التقنية
    const voltage = this.extractVoltage(text);
    const current = this.extractCurrent(text);
    const power = this.extractPower(text);
    const frequency = this.extractFrequency(text);
    
    // استخراج المواصفات والاستخدام
    const specifications = this.extractSpecifications(text);
    const application = this.extractApplication(text);
    
    // الكلمات المفتاحية
    const keywords = this.extractKeywords(text);
    
    return {
      manufacturer,
      model,
      partNumber: extractedPartNumber,
      voltage,
      current,
      power,
      frequency,
      specifications,
      application,
      keywords
    };
  }

  private extractManufacturer(text: string): string {
    const manufacturers = [
      'SCHNEIDER', 'SCHNIEDER', 'TELEMECANIQUE',
      'ABB', 'SIEMENS', 'ALLEN BRADLEY', 'OMRON',
      'MITSUBISHI', 'FUJI', 'EATON', 'LOVATO'
    ];
    
    for (const mfg of manufacturers) {
      if (text.includes(mfg)) {
        return mfg === 'SCHNIEDER' ? 'SCHNEIDER' : mfg; // تصحيح الأخطاء الإملائية
      }
    }
    
    return '';
  }

  private extractModel(text: string): string {
    // نماذج شائعة
    const patterns = [
      /LC1D\s*[-_]?\s*\d+\s*[-_]?\s*[A-Z]\d*/g,
      /\b[A-Z]{2,4}\d+[A-Z]*\d*\b/g
    ];
    
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        return matches[0].replace(/\s+/g, '');
      }
    }
    
    return '';
  }

  private extractPartNumber(text: string): string {
    // البحث عن أرقام الجزء
    const patterns = [
      /P\/N\s*:?\s*([A-Z0-9\-\s]+)/g,
      /PART\s*NUMBER\s*:?\s*([A-Z0-9\-\s]+)/g,
      /REF\s*\.?\s*PN\s*\/?\s*([A-Z0-9\-\s]+)/g,
      /LC1D\s*[-_]?\s*\d+\s*[-_]?\s*[A-Z]\d*/g
    ];
    
    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (match) {
        return match[1] ? match[1].trim() : match[0].trim();
      }
    }
    
    return '';
  }

  private extractVoltage(text: string): string {
    const voltageMatch = text.match(/(\d+)\s*V\b/g);
    return voltageMatch ? voltageMatch.join(', ') : '';
  }

  private extractCurrent(text: string): string {
    const currentMatch = text.match(/(\d+)\s*A\b/g);
    return currentMatch ? currentMatch.join(', ') : '';
  }

  private extractPower(text: string): string {
    const powerMatch = text.match(/(\d+)\s*KW\b/g);
    return powerMatch ? powerMatch.join(', ') : '';
  }

  private extractFrequency(text: string): string {
    const freqMatch = text.match(/(\d+)\/(\d+)\s*HZ/g);
    return freqMatch ? freqMatch[0] : '';
  }

  private extractSpecifications(text: string): string[] {
    const specs: string[] = [];
    
    if (text.includes('CONTACTOR')) specs.push('CONTACTOR');
    if (text.includes('RELAY')) specs.push('RELAY');
    if (text.includes('BREAKER')) specs.push('BREAKER');
    if (text.includes('SWITCH')) specs.push('SWITCH');
    if (text.includes('FUSE')) specs.push('FUSE');
    
    return specs;
  }

  private extractApplication(text: string): string {
    if (text.includes('GRILL') || text.includes('FRYER')) return 'KITCHEN_EQUIPMENT';
    if (text.includes('MOTOR')) return 'MOTOR_CONTROL';
    if (text.includes('LIGHTING')) return 'LIGHTING';
    if (text.includes('HVAC')) return 'HVAC';
    
    return '';
  }

  private extractKeywords(text: string): string[] {
    return text.split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['THE', 'AND', 'FOR', 'WITH', 'من', 'في', 'إلى'].includes(word))
      .slice(0, 10); // أول 10 كلمات مهمة
  }

  private async groupItemsBySemantics(items: ProductItem[]): Promise<SemanticGroup[]> {
    const groups: SemanticGroup[] = [];
    const processed = new Set<string>();
    
    console.log(`🔍 بدء تحليل ${items.length} منتج للبحث عن التطابقات...`);

    for (let i = 0; i < items.length; i++) {
      const currentItem = items[i];
      
      // عرض البند الحالي الذي يتم تحليله
      if (i % 100 === 0) {
        this.currentProcessingItem = {
          description: currentItem.description,
          partNumber: currentItem.partNumber,
          lineItem: currentItem.lineItem
        };
        console.log(`🔍 تحليل البند ${i + 1}/${items.length}: ${currentItem.itemNumber} - ${currentItem.description.substring(0, 50)}...`);
        this.progress = 30 + ((i / items.length) * 15); // من 30% إلى 45%
      }
      
      if (processed.has(currentItem.itemNumber)) continue;

      const duplicates: ProductItem[] = [];
      
      for (let j = i + 1; j < items.length; j++) {
        const otherItem = items[j];
        
        if (processed.has(otherItem.itemNumber)) continue;

        const similarity = this.calculateSemanticSimilarity(currentItem, otherItem);
        
        if (similarity.score >= 0.7) { // عتبة منطقية للتطابق الدلالي
          duplicates.push(otherItem);
          processed.add(otherItem.itemNumber);
          console.log(`  ✅ عثر على تطابق: ${otherItem.itemNumber} مع ${currentItem.itemNumber} (${Math.round(similarity.score * 100)}%)`);
        }
      }

      if (duplicates.length > 0) {
        groups.push({
          masterItem: currentItem,
          duplicates,
          confidence: Math.round(this.calculateSemanticSimilarity(currentItem, duplicates[0]).score * 100),
          matchReason: this.calculateSemanticSimilarity(currentItem, duplicates[0]).reason
        });
        processed.add(currentItem.itemNumber);
        console.log(`📦 مجموعة جديدة: ${duplicates.length} بند مكرر تحت ${currentItem.itemNumber}`);
      }
    }
    
    console.log(`✅ انتهى التحليل: تم العثور على ${groups.length} مجموعة دلالية`);
    return groups;
  }

  private calculateSemanticSimilarity(item1: ProductItem, item2: ProductItem): {score: number, reason: string} {
    const specs1 = item1.extractedSpecs;
    const specs2 = item2.extractedSpecs;
    
    let score = 0;
    let reason = '';

    // 1. نفس الشركة المصنعة والموديل (أهمية عليا)
    if (specs1.manufacturer && specs2.manufacturer && specs1.manufacturer === specs2.manufacturer) {
      score += 0.3;
      
      if (specs1.model && specs2.model && 
          this.normalizePartNumber(specs1.model) === this.normalizePartNumber(specs2.model)) {
        score += 0.4;
        reason = `نفس الموديل: ${specs1.manufacturer} ${specs1.model}`;
      }
    }

    // 2. نفس رقم الجزء (مطبع)
    if (specs1.partNumber && specs2.partNumber && 
        this.normalizePartNumber(specs1.partNumber) === this.normalizePartNumber(specs2.partNumber)) {
      score += 0.5;
      reason = `نفس رقم الجزء: ${specs1.partNumber}`;
    }

    // 3. نفس المواصفات التقنية (جهد، تيار، قدرة)
    if (specs1.voltage && specs2.voltage && specs1.voltage === specs2.voltage) score += 0.1;
    if (specs1.current && specs2.current && specs1.current === specs2.current) score += 0.1;
    if (specs1.power && specs2.power && specs1.power === specs2.power) score += 0.1;

    // 4. نفس نوع المنتج
    const commonSpecs = specs1.specifications.filter(spec => specs2.specifications.includes(spec));
    if (commonSpecs.length > 0) {
      score += 0.2;
      if (!reason) reason = `نفس النوع: ${commonSpecs.join(', ')}`;
    }

    // 5. تطابق الكلمات المفتاحية
    const commonKeywords = specs1.keywords.filter(keyword => 
      specs2.keywords.some(k => this.normalizePartNumber(k) === this.normalizePartNumber(keyword))
    );
    
    if (commonKeywords.length >= 3) {
      score += 0.1;
    }

    // حالات خاصة: شنايدر LC1D 32M7
    if (this.isSchneiderLC1D32M7(item1, item2)) {
      score = 0.95;
      reason = 'منتج شنايدر LC1D 32M7 مؤكد';
    }

    return { score: Math.min(score, 1), reason: reason || 'تشابه عام' };
  }

  private normalizePartNumber(partNum: string): string {
    return partNum.toUpperCase()
      .replace(/[\s\-_\.]/g, '')  // إزالة المسافات والرموز
      .replace(/[^\w\d]/g, '')   // إزالة أي رموز أخرى
      .trim();
  }

  private isSchneiderLC1D32M7(item1: ProductItem, item2: ProductItem): boolean {
    const text1 = (item1.description + ' ' + item1.partNumber).toUpperCase();
    const text2 = (item2.description + ' ' + item2.partNumber).toUpperCase();
    
    // الحالات المختلفة لنفس المنتج
    const patterns = [
      /LC1D\s*[-_]?\s*32\s*[-_]?\s*M7/,
      /2102034/,
      /2102049/
    ];
    
    let hasPattern1 = false;
    let hasPattern2 = false;
    
    for (const pattern of patterns) {
      if (pattern.test(text1)) hasPattern1 = true;
      if (pattern.test(text2)) hasPattern2 = true;
    }
    
    // إذا كان كلاهما يحتوي على أي من هذه الأنماط، فهما نفس المنتج
    return hasPattern1 && hasPattern2;
  }

  private async unifySemanticGroup(group: SemanticGroup): Promise<void> {
    const masterItemNumber = group.masterItem.itemNumber;
    
    for (const duplicate of group.duplicates) {
      try {
        await this.googleSheetsData.updateItemId(duplicate.itemNumber, masterItemNumber);
        console.log(`   ✓ ${duplicate.itemNumber} → ${masterItemNumber} (${group.confidence}%)`);
        
        // انتظار قصير لتجنب تحميل الخادم
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`   ✗ فشل تحديث ${duplicate.itemNumber}:`, error);
      }
    }
  }

  getProgress(): number {
    return this.progress;
  }

  getCurrentProcessingItem(): {description: string, partNumber: string, lineItem: string} | null {
    return this.currentProcessingItem;
  }

  isOperationRunning(): boolean {
    return this.isRunning;
  }
}

export const semanticProductUnifier = new SemanticProductUnifier();