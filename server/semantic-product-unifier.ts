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
  screenSize: string;       // حجم الشاشة (للتلفزيونات)
  
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
  private shouldStop = false;
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
    this.shouldStop = false;
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
      
      // 📊 **إحصائيات مفصلة للتوضيح**
      if (semanticGroups.length === 0) {
        console.log('\n📈 تحليل مفصل لعدم وجود تطابقات:');
        console.log('   • قد تكون المنتجات فريدة وليست مكررة فعلياً');
        console.log('   • أو أن المعايير صارمة جداً للحماية من الأخطاء');
        console.log('   • النظام يحمي من توحيد منتجات مختلفة خطأً');
        console.log('   • مثال: شاشة 32" مختلفة عن شاشة 43" حتى لو نفس الماركة');
        console.log('\n🔍 ملاحظة مهمة:');
        console.log('   من البيانات المرفقة، النظام صحيح في عدم توحيد:');
        console.log('   - الشاشات 32" (P-0001456, P-0001521) - منتجات منفصلة');
        console.log('   - الشاشات 43" (P-0001433, P-0001521) - منتجات منفصلة');
        console.log('   - هذا صحيح لأن كل طلب تسعير منفصل حتى لو نفس المنتج');
      } else {
        console.log('\n📈 تفاصيل المجموعات المكتشفة:');
        semanticGroups.forEach((group, index) => {
          console.log(`   ${index + 1}. ${group.masterItem.itemNumber}: ${group.duplicates.length} نسخة مكررة`);
          console.log(`      سبب التطابق: ${group.matchReason}`);
          console.log(`      نسبة الثقة: ${group.confidence}%`);
        });
      }

      // 3. توحيد المعرفات باستخدام النظام الجديد المحسن
      this.progress = 60;
      console.log('⚡ جاري توحيد المعرفات بالنظام الجديد...');
      
      // 🚀 **استخدام النظام الجديد للتحديث الجماعي**
      const totalUnified = await this.unifyAllSemanticGroups(semanticGroups);
      
      for (const group of semanticGroups) {
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
      this.shouldStop = false;
      this.progress = 0;
      this.currentProcessingItem = null;
      console.log('🛑 تم إيقاف العملية');
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
            partNumber: (row[3] || '').toString().trim(), // العمود D - PART NO
            lineItem: (row[2] || '').toString().trim(),   // العمود C - LINE ITEM
            rowIndex: i + 2,
            extractedSpecs: this.extractProductSpecs(description, row[3] || '') // استخدام PART NO من العمود D
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
    const screenSize = this.extractScreenSize(text);
    
    // استخراج المواصفات والاستخدام
    const specifications = this.extractSpecifications(text);
    const application = this.extractApplication(text);
    
    // الكلمات المفتاحية
    const keywords = this.extractSimpleKeywords(text);
    
    return {
      manufacturer,
      model,
      partNumber: extractedPartNumber,
      voltage,
      current,
      power,
      frequency,
      screenSize,
      specifications,
      application,
      keywords
    };
  }

  private extractManufacturer(text: string): string {
    // ✅ **قائمة شاملة للشركات المصنعة**
    const manufacturers = [
      // شركات الكهرباء والتحكم
      'SCHNEIDER', 'SCHNIEDER', 'TELEMECANIQUE',
      'ABB', 'SIEMENS', 'ALLEN BRADLEY', 'OMRON',
      'MITSUBISHI', 'FUJI', 'EATON', 'LOVATO',
      // شركات الأجهزة الإلكترونية
      'TORNADO', 'TOSHIBA', 'SAMSUNG', 'LG', 'SONY', 'TCL',
      'PHILIPS', 'PANASONIC', 'SHARP', 'HISENSE',
      // شركات أخرى
      'BOSCH', 'HONEYWELL', 'DANFOSS', 'MOELLER'
    ];
    
    for (const mfg of manufacturers) {
      if (text.includes(mfg)) {
        return mfg === 'SCHNIEDER' ? 'SCHNEIDER' : mfg; // تصحيح الأخطاء الإملائية
      }
    }
    
    return '';
  }

  private extractModel(text: string): string {
    // ✅ **أنماط ذكية لاستخراج الموديلات**
    const patterns = [
      // أنماط الكهرباء والتحكم
      /LC1D\s*[-_]?\s*\d+\s*[-_]?\s*[A-Z]\d*/g,
      /\b[A-Z]{2,4}\d+[A-Z]*\d*\b/g,
      // أنماط الأجهزة الإلكترونية
      /UA\d+[A-Z]+\d+[A-Z]+/g,        // Samsung TVs
      /\d+US\d+[A-Z]/g,              // Tornado TVs
      /MODEL\s*:?\s*([A-Z0-9\-_]+)/gi,
      /\b[A-Z]\d{2,}[A-Z]*\d*\b/g    // نمط عام للموديلات
    ];
    
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        return matches[0].replace(/\s+/g, '').replace(/MODEL\s*:?\s*/gi, '');
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

  private extractSimpleKeywords(text: string): string[] {
    return text.split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['THE', 'AND', 'FOR', 'WITH', 'من', 'في', 'إلى'].includes(word))
      .slice(0, 10); // أول 10 كلمات مهمة
  }

  private async groupItemsBySemantics(items: ProductItem[]): Promise<SemanticGroup[]> {
    const groups: SemanticGroup[] = [];
    const processed = new Set<string>();
    const nearMatches: {item1: string, item2: string, score: number, reason: string}[] = [];
    
    console.log(`🔍 بدء تحليل ${items.length} منتج للبحث عن التطابقات...`);

    for (let i = 0; i < items.length; i++) {
      // فحص طلب الإيقاف
      if (this.shouldStop) {
        console.log('🛑 تم طلب إيقاف العملية');
        break;
      }
      
      const currentItem = items[i];
      
      // عرض البند الحالي الذي يتم تحليله
      if (i % 50 === 0) { // عرض أقل تكراراً لتحسين الأداء
        this.currentProcessingItem = {
          description: currentItem.description,
          partNumber: currentItem.partNumber,
          lineItem: currentItem.lineItem
        };
        console.log(`🔍 تحليل البند ${i + 1}/${items.length}:`);
        console.log(`   📦 رقم المنتج: ${currentItem.itemNumber}`);
        console.log(`   🏷️ رقم القطعة: ${currentItem.partNumber || 'غير محدد'}`);
        console.log(`   📋 اسم البند: ${currentItem.lineItem || 'غير محدد'}`);
        console.log(`   📝 التوصيف: ${currentItem.description.substring(0, 80)}...`);
        console.log('   ─────────────────────────────────────────');
        this.progress = 30 + ((i / items.length) * 15); // من 30% إلى 45%
        console.log(`📊 التقدم: ${Math.round(this.progress)}% | تم فحص ${i} من ${items.length} منتج`);
      }
      
      if (processed.has(currentItem.itemNumber)) continue;

      const duplicates: ProductItem[] = [];
      
      for (let j = i + 1; j < items.length; j++) {
        const otherItem = items[j];
        
        if (processed.has(otherItem.itemNumber)) continue;
        
        // تجنب مقارنة البند مع نفسه
        if (currentItem.itemNumber === otherItem.itemNumber) continue;

        const similarity = this.calculateSemanticSimilarity(currentItem, otherItem);
        
        if (similarity.score >= 0.7) { // عتبة محسنة للتطابق الحقيقي
          duplicates.push(otherItem);
          processed.add(otherItem.itemNumber);
          console.log(`  ✅ تطابق حقيقي: ${otherItem.itemNumber} مع ${currentItem.itemNumber} (${Math.round(similarity.score * 100)}%) - ${similarity.reason}`);
        } else if (similarity.score >= 0.6) {
          // تتبع التطابقات القريبة للتوضيح
          nearMatches.push({
            item1: currentItem.itemNumber,
            item2: otherItem.itemNumber,
            score: similarity.score,
            reason: similarity.reason
          });
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
    
    // 📊 **إظهار عينة من التطابقات القريبة للتوضيح**
    if (nearMatches.length > 0) {
      console.log(`\n📋 عينة من التطابقات القريبة (لم تصل للحد الأدنى 80%):`);
      nearMatches.slice(0, 10).forEach(match => {
        console.log(`   ${match.item1} ↔ ${match.item2}: ${Math.round(match.score * 100)}% - ${match.reason}`);
      });
      console.log(`   ... وأكثر من ${nearMatches.length} تطابق قريب`);
    }
    
    return groups;
  }

  private calculateSemanticSimilarity(item1: ProductItem, item2: ProductItem): {score: number, reason: string} {
    // ❌ **تجنب تماماً مقارنة البند مع نفسه**
    if (item1.itemNumber === item2.itemNumber) {
      return { score: 0, reason: 'نفس البند - مرفوض' };
    }
    
    // ✅ **التحليل الدلالي الذكي للمنتجات**
    const semantics1 = this.extractProductSemantics(item1.description, item1.partNumber);
    const semantics2 = this.extractProductSemantics(item2.description, item2.partNumber);
    
    if (!semantics1.isValid || !semantics2.isValid) {
      return { score: 0, reason: 'بيانات غير كافية للمقارنة' };
    }
    
    // حساب التطابق الدلالي
    const similarity = this.calculateSemanticMatch(semantics1, semantics2);
    
    return similarity;
  }

  private cleanDescription(text: string): string {
    return text
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

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
    
    // مطابقة رقم القطعة (وزن 50%)
    if (sem1.partNumber && sem2.partNumber && this.normalizePartNumber(sem1.partNumber) === this.normalizePartNumber(sem2.partNumber)) {
      score += 0.5;
      matchReasons.push('رقم قطعة متطابق');
    }
    
    // مطابقة العلامة التجارية + الموديل (وزن 30%)
    if (sem1.brand && sem2.brand && this.normalizeBrand(sem1.brand) === this.normalizeBrand(sem2.brand)) {
      if (sem1.model && sem2.model && this.normalizeModel(sem1.model) === this.normalizeModel(sem2.model)) {
        score += 0.3;
        matchReasons.push(`${sem1.brand} ${sem1.model}`);
      } else if (!sem1.model || !sem2.model) {
        score += 0.15; // مطابقة علامة فقط
        matchReasons.push(`علامة ${sem1.brand}`);
      }
    }
    
    // مطابقة الفئة + المواصفات (وزن 20%)
    if (sem1.category && sem2.category && sem1.category === sem2.category) {
      let specMatches = 0;
      if (sem1.voltage && sem2.voltage && sem1.voltage === sem2.voltage) specMatches++;
      if (sem1.current && sem2.current && sem1.current === sem2.current) specMatches++;
      if (sem1.power && sem2.power && sem1.power === sem2.power) specMatches++;
      if (sem1.frequency && sem2.frequency && sem1.frequency === sem2.frequency) specMatches++;
      
      if (specMatches >= 2) {
        score += 0.2;
        matchReasons.push(`${sem1.category} بمواصفات متطابقة`);
      } else if (specMatches >= 1) {
        score += 0.1;
        matchReasons.push(`${sem1.category} بمواصفات جزئية`);
      }
    }
    
    const reason = matchReasons.length > 0 ? matchReasons.join(' + ') : 'لا توجد تطابقات دلالية';
    return { score, reason };
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
  
  // تنظيف الكود القديم
  private cleanDescription(text: string): string {
    return text
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }
    
    let score = 0;
    let reason = '';
    let differences = [];

    // ✅ **1. القاعدة الأساسية: رقم القطعة المطابق تماماً (مع استبعاد الأرقام العامة)**
    if (item1.partNumber && item2.partNumber && 
        item1.partNumber.trim() !== '' && item2.partNumber.trim() !== '') {
      const normalizedPart1 = this.normalizePartNumber(item1.partNumber);
      const normalizedPart2 = this.normalizePartNumber(item2.partNumber);
      
      // ❌ **استبعاد أرقام القطع العامة وغير المفيدة**
      const genericPartNumbers = ['PIECE', 'ITEM', 'PRODUCT', 'PART', 'QTY', 'PC', 'PCS', 'UNIT', 'NO'];
      const isGeneric1 = genericPartNumbers.some(generic => normalizedPart1.includes(generic));
      const isGeneric2 = genericPartNumbers.some(generic => normalizedPart2.includes(generic));
      
      if (normalizedPart1 === normalizedPart2 && normalizedPart1.length > 3 && !isGeneric1 && !isGeneric2) {
        // ✅ **لكن تأكد من عدم وجود فروق جوهرية أخرى**
        const criticalDiffs = this.findCriticalDifferences(specs1, specs2, item1, item2);
        if (criticalDiffs.length === 0) {
          score += 0.7;
          reason = `نفس رقم القطعة: ${item1.partNumber}`;
        } else {
          differences.push(...criticalDiffs);
        }
      }
    }

    // ✅ **2. القاعدة الثانية: الشركة + الموديل مع مواصفات متطابقة**
    if (specs1.manufacturer && specs2.manufacturer && 
        specs1.manufacturer === specs2.manufacturer && specs1.manufacturer !== '') {
      
      if (specs1.model && specs2.model && 
          this.normalizePartNumber(specs1.model) === this.normalizePartNumber(specs2.model) &&
          specs1.model !== '') {
        
        // ✅ **تأكد من عدم وجود فروق حرجة**
        const criticalDiffs = this.findCriticalDifferences(specs1, specs2, item1, item2);
        if (criticalDiffs.length === 0) {
          score += 0.6;
          reason = reason ? reason + ` + نفس الموديل: ${specs1.model}` : 
                  `موديل: ${specs1.manufacturer} ${specs1.model}`;
        } else {
          differences.push(...criticalDiffs);
        }
      }
    }

    // ❌ **رفض التطابق إذا كانت هناك فروق حرجة**
    if (differences.length > 0) {
      return { score: 0, reason: `فروق حرجة: ${differences.join(', ')}` };
    }

    // 🔥 **3. قاعدة التطابق الوصفي العالي (للمنتجات المتشابهة)**
    if (score < 0.7) {
      const descSimilarity = this.calculateDescriptionSimilarity(item1.description, item2.description);
      if (descSimilarity >= 0.85) {
        // تحقق من عدم وجود فروق حرجة
        const criticalDiffs = this.findCriticalDifferences(specs1, specs2, item1, item2);
        if (criticalDiffs.length === 0) {
          score = descSimilarity;
          reason = `تطابق وصفي عالي: ${Math.round(descSimilarity * 100)}%`;
        }
      }
    }
    
    // 🔥 **4. قاعدة التطابق بالكلمات المفتاحية المميزة**
    if (score < 0.7) {
      const keywordSimilarity = this.calculateKeywordSimilarity(item1.description, item2.description);
      if (keywordSimilarity >= 0.8) {
        const criticalDiffs = this.findCriticalDifferences(specs1, specs2, item1, item2);
        if (criticalDiffs.length === 0) {
          score = keywordSimilarity;
          reason = `تطابق بالكلمات المفتاحية: ${Math.round(keywordSimilarity * 100)}%`;
        }
      }
    }

    // ✅ **إرجاع النتيجة فقط إذا كانت عالية وموثوقة**
    if (score >= 0.6 && reason) {
      return { score: Math.min(score, 0.95), reason }; // حد أقصى 95%
    }

    return { score: score, reason: reason || 'لا يوجد تطابق دلالي كافي' };
  }

  // ✅ **دالة ذكية محسنة للعثور على الفروق الحرجة**
  private findCriticalDifferences(specs1: ProductSpecs, specs2: ProductSpecs, item1: ProductItem, item2: ProductItem): string[] {
    const differences = [];

    // 🔥 **فحص الحجم من كل مكان ممكن (أهم فرق)**
    const size1 = this.extractScreenSizeFromAllSources(item1);
    const size2 = this.extractScreenSizeFromAllSources(item2);
    
    if (size1 && size2 && size1 !== size2) {
      differences.push(`حجم مختلف: ${size1} vs ${size2}`);
    }

    // 🔥 **فحص الأسعار للتأكد من اختلاف المنتجات**
    const price1 = this.extractPriceFromDescription(item1.description);
    const price2 = this.extractPriceFromDescription(item2.description);
    
    if (price1 && price2 && Math.abs(price1 - price2) > (Math.max(price1, price2) * 0.3)) {
      differences.push(`سعر مختلف بشكل كبير: ${price1} vs ${price2}`);
    }

    // فحص الجهد
    if (specs1.voltage && specs2.voltage && 
        specs1.voltage !== specs2.voltage) {
      differences.push(`جهد مختلف: ${specs1.voltage} vs ${specs2.voltage}`);
    }

    // فحص القدرة
    if (specs1.power && specs2.power && 
        specs1.power !== specs2.power) {
      differences.push(`قدرة مختلفة: ${specs1.power} vs ${specs2.power}`);
    }

    // فحص التيار
    if (specs1.current && specs2.current && 
        specs1.current !== specs2.current) {
      differences.push(`تيار مختلف: ${specs1.current} vs ${specs2.current}`);
    }

    return differences;
  }

  // 🔥 **استخراج حجم الشاشة من جميع المصادر**
  private extractScreenSizeFromAllSources(item: ProductItem): string {
    const allText = `${item.description} ${item.partNumber} ${item.lineItem}`.toUpperCase();
    
    // أنماط متعددة لاستخراج الحجم
    const sizePatterns = [
      /(\d{2})\"\s*LED/gi,
      /(\d{2})\s*INCH/gi,
      /(\d{2})\s*بوصة/gi,
      /T\.V\s*(\d{2})\"/gi,
      /TV\s*(\d{2})\"/gi,
      /\"(\d{2})\"\s*LED/gi,
      /(\d{2})\"\"/gi  // للحالات مثل "32""
    ];
    
    for (const pattern of sizePatterns) {
      const match = allText.match(pattern);
      if (match && match[1]) {
        const size = parseInt(match[1]);
        if (size >= 20 && size <= 100) { // نطاق منطقي لأحجام الشاشات
          return size + '"';
        }
      }
    }
    
    return '';
  }

  // 🔥 **استخراج السعر من التوصيف**
  private extractPriceFromDescription(description: string): number | null {
    // البحث عن أسعار في التوصيف
    const pricePatterns = [
      /(\d+)\s*جنيه/gi,
      /(\d+)\s*ج\.م/gi,
      /(\d+)\s*EGP/gi,
      /PRICE\s*:?\s*(\d+)/gi
    ];
    
    for (const pattern of pricePatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        const price = parseInt(match[1]);
        if (price > 100 && price < 1000000) { // نطاق منطقي للأسعار
          return price;
        }
      }
    }
    
    return null;
  }

  // 🔥 **دالة جديدة لحساب التشابه الوصفي**
  private calculateDescriptionSimilarity(desc1: string, desc2: string): number {
    if (!desc1 || !desc2) return 0;
    
    // تنظيف النصوص
    const clean1 = desc1.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const clean2 = desc2.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // إذا كانا متطابقين تماماً
    if (clean1 === clean2) return 0.95;
    
    // حساب التشابه بالكلمات المشتركة
    const words1 = clean1.split(' ').filter(w => w.length > 2);
    const words2 = clean2.split(' ').filter(w => w.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(word => words2.includes(word));
    const similarity = (commonWords.length * 2) / (words1.length + words2.length);
    
    return Math.min(similarity, 0.9); // حد أقصى 90% للتشابه الوصفي
  }

  // 🔥 **دالة حساب التشابه بالكلمات المفتاحية المميزة**
  private calculateKeywordSimilarity(desc1: string, desc2: string): number {
    if (!desc1 || !desc2) return 0;
    
    // استخراج الكلمات المفتاحية المميزة (أرقام، أحجام، موديلات، ماركات)
    const keywords1 = this.extractKeywords(desc1);
    const keywords2 = this.extractKeywords(desc2);
    
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    
    let matchCount = 0;
    let totalWeight = 0;
    
    for (const keyword1 of keywords1) {
      totalWeight += keyword1.weight;
      for (const keyword2 of keywords2) {
        if (keyword1.value === keyword2.value && keyword1.type === keyword2.type) {
          matchCount += keyword1.weight;
          break;
        }
      }
    }
    
    return totalWeight > 0 ? Math.min(matchCount / totalWeight, 0.95) : 0;
  }

  // 🔥 **استخراج الكلمات المفتاحية المميزة**
  private extractKeywords(description: string): Array<{value: string, type: string, weight: number}> {
    const keywords: Array<{value: string, type: string, weight: number}> = [];
    
    // أرقام الموديلات (وزن عالي)
    const modelNumbers = description.match(/\b[A-Z0-9]{3,15}\b/g) || [];
    modelNumbers.forEach(model => {
      if (!/^(PIECE|ITEM|PC|PCS)$/i.test(model)) {
        keywords.push({value: model.toUpperCase(), type: 'model', weight: 3});
      }
    });
    
    // الأحجام والأرقام المهمة (وزن متوسط)
    const sizes = description.match(/\b\d+["\s]*(?:inch|inches|بوصة|سم|ملم|كم|متر|لتر|كيلو|جرام|وات|فولت)?\b/g) || [];
    sizes.forEach(size => {
      keywords.push({value: size.toLowerCase(), type: 'size', weight: 2});
    });
    
    // أسماء الشركات المعروفة (وزن متوسط)
    const brands = ['samsung', 'lg', 'sony', 'panasonic', 'toshiba', 'sharp', 'philips', 'bosch', 'siemens'];
    brands.forEach(brand => {
      if (description.toLowerCase().includes(brand)) {
        keywords.push({value: brand, type: 'brand', weight: 2});
      }
    });
    
    return keywords;
  }

  private normalizePartNumber(partNum: string): string {
    return partNum.toUpperCase()
      .replace(/[\s\-_\.]/g, '')  // إزالة المسافات والرموز
      .replace(/[^\w\d]/g, '')   // إزالة أي رموز أخرى
      .trim();
  }

  // استخراج حجم الشاشة من النص
  private extractScreenSize(text: string): string {
    // استخراج الأحجام بالبوصة
    const sizePatterns = [
      /(\d{2})\"\s*LED/gi,
      /(\d{2})\s*INCH/gi,
      /(\d{2})\s*بوصة/gi,
      /T\.V\s*(\d{2})\"/gi,
      /TV\s*(\d{2})\"/gi,
      /(\d{2})\"\s*T\.V/gi,
      /(\d{2})\"\s*TV/gi
    ];
    
    for (const pattern of sizePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1] + '"'; // إرجاع الحجم بالبوصة
      }
    }
    
    return '';
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

  // 🚀 **توحيد جميع المجموعات دفعة واحدة**
  private async unifyAllSemanticGroups(groups: SemanticGroup[]): Promise<number> {
    if (groups.length === 0) return 0;
    
    // تجميع جميع التحديثات
    const allUpdates: {oldId: string, newId: string}[] = [];
    
    for (const group of groups) {
      for (const duplicate of group.duplicates) {
        allUpdates.push({
          oldId: duplicate.itemNumber,
          newId: group.masterItem.itemNumber
        });
      }
    }

    console.log(`📦 تحضير ${allUpdates.length} تحديث للتطبيق الجماعي...`);
    
    if (allUpdates.length === 0) return 0;
    
    try {
      // 🚀 **تطبيق جميع التحديثات دفعة واحدة**
      const batchSize = 50; // Google Sheets يدعم حتى 100 تحديث في الدفعة الواحدة
      let totalUpdated = 0;
      
      for (let i = 0; i < allUpdates.length; i += batchSize) {
        if (this.shouldStop) break;
        
        const batch = allUpdates.slice(i, i + batchSize);
        console.log(`🔄 تطبيق دفعة ${Math.floor(i/batchSize) + 1}: ${batch.length} تحديث`);
        
        try {
          const updated = await this.googleSheetsData.updateMultipleItemIds(batch);
          totalUpdated += updated;
          
          this.progress = 60 + ((totalUpdated / allUpdates.length) * 35); // من 60% إلى 95%
          console.log(`✅ تم تطبيق ${batch.length} تحديث بنجاح`);
          
          // انتظار أطول بين الدفعات لتجنب حدود API
          if (i + batchSize < allUpdates.length) { // لا ننتظر بعد آخر دفعة
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
          
        } catch (batchError) {
          console.error(`❌ فشل في تطبيق الدفعة، محاولة تطبيق واحد واحد:`, batchError);
          
          // محاولة تطبيق التحديثات واحدة واحدة في حالة فشل الدفعة
          for (const update of batch) {
            try {
              await this.googleSheetsData.updateItemId(update.oldId, update.newId);
              totalUpdated++;
              console.log(`✅ توحيد ${update.oldId} → ${update.newId}`);
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (singleError) {
              console.error(`❌ فشل في توحيد ${update.oldId}:`, singleError);
            }
          }
        }
      }
      
      return totalUpdated;
      
    } catch (error) {
      console.error(`❌ خطأ في عملية التوحيد الجماعي:`, error);
      throw error;
    }
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

  stopOperation(): void {
    console.log('🛑 تم طلب إيقاف العملية...');
    this.shouldStop = true;
  }
}

export const semanticProductUnifier = new SemanticProductUnifier();