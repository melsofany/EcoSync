/**
 * نظام منع التكرار الجذري - يتدخل في نقطة إدخال البيانات
 * يمنع التكرار قبل حفظ البيانات في Google Sheets
 */

export interface PreventionRule {
  id: string;
  name: string;
  patterns: string[];
  alternateNumbers: string[];
  keyWords: string[];
  action: 'block' | 'redirect' | 'warn';
  targetId?: string; // المعرف المستهدف للتوجيه
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingId?: string;
  confidence: number;
  reason: string;
  suggestedAction: 'use_existing' | 'create_new' | 'review_required';
  matchedRule?: PreventionRule;
}

class RadicalDuplicatePrevention {
  private preventionRules: PreventionRule[] = [];
  
  constructor() {
    this.initializeHardcodedRules();
  }
  
  /**
   * تهيئة القواعد المبرمجة مسبقاً للحالات المعروفة
   */
  private initializeHardcodedRules() {
    // قاعدة خاصة لشنايدر LC1D 32M7
    this.preventionRules.push({
      id: 'schneider-lc1d32m7',
      name: 'شنايدر LC1D 32M7 كونتاكتور',
      patterns: [
        'LC1D32M7', 'LC1D 32M7', 'LC1D 32 M7', 'LC1D-32M7',
        'TELEMECANIQUE LC1D 32M7', 'SCHNEIDER LC1D32M7'
      ],
      alternateNumbers: ['2102049', '2102034'],
      keyWords: ['SCHNEIDER', 'TELEMECANIQUE', 'LC1D', '32A', 'CONTACTOR', 'كونتاكتور'],
      action: 'redirect',
      targetId: 'P-000394' // المعرف الرئيسي الموحد
    });
    
    // قواعد عامة لمنتجات شنايدر الأخرى
    this.preventionRules.push({
      id: 'schneider-general',
      name: 'منتجات شنايدر عامة',
      patterns: ['LC1D', 'TeSys', 'Acti9', 'Modicon'],
      alternateNumbers: [],
      keyWords: ['SCHNEIDER', 'TELEMECANIQUE'],
      action: 'warn'
    });
    
    console.log(`🛡️ تم تحميل ${this.preventionRules.length} قاعدة منع التكرار الجذري`);
    console.log(`🔧 قاعدة شنايدر LC1D 32M7: معرف مستهدف P-000394`);
  }
  
  /**
   * فحص البند الجديد ضد قواعد منع التكرار
   */
  async checkForDuplicates(
    partNumber: string,
    description: string,
    lineItem?: string,
    existingItems?: any[]
  ): Promise<DuplicateCheckResult> {
    
    const normalizedPartNumber = this.normalizePartNumber(partNumber);
    const normalizedDescription = description.toUpperCase();
    
    // فحص ضد القواعد المبرمجة مسبقاً
    for (const rule of this.preventionRules) {
      const match = this.checkAgainstRule(
        normalizedPartNumber,
        normalizedDescription,
        rule
      );
      
      if (match.isMatch) {
        console.log(`🚨 اكتشف تطابق مع القاعدة: ${rule.name}`);
        
        return {
          isDuplicate: true,
          existingId: rule.targetId,
          confidence: match.confidence,
          reason: `تطابق مع القاعدة: ${rule.name} - ${match.reason}`,
          suggestedAction: rule.action === 'redirect' ? 'use_existing' : 'review_required',
          matchedRule: rule
        };
      }
    }
    
    // فحص ضد البيانات الموجودة إذا توفرت
    if (existingItems && existingItems.length > 0) {
      const dynamicMatch = await this.checkAgainstExistingItems(
        normalizedPartNumber,
        normalizedDescription,
        existingItems
      );
      
      if (dynamicMatch.isDuplicate) {
        return dynamicMatch;
      }
    }
    
    return {
      isDuplicate: false,
      confidence: 0,
      reason: 'لا يوجد تطابق مع المنتجات الموجودة',
      suggestedAction: 'create_new'
    };
  }
  
  /**
   * فحص البند ضد قاعدة محددة
   */
  private checkAgainstRule(
    partNumber: string,
    description: string,
    rule: PreventionRule
  ): { isMatch: boolean; confidence: number; reason: string } {
    
    let matchScore = 0;
    let reasons: string[] = [];
    
    // فحص الأنماط
    for (const pattern of rule.patterns) {
      const normalizedPattern = this.normalizePartNumber(pattern);
      if (partNumber.includes(normalizedPattern) || 
          description.includes(pattern.toUpperCase())) {
        matchScore += 40;
        reasons.push(`تطابق النمط: ${pattern}`);
      }
    }
    
    // فحص الأرقام البديلة
    for (const altNumber of rule.alternateNumbers) {
      if (partNumber.includes(altNumber) || description.includes(altNumber)) {
        matchScore += 35;
        reasons.push(`رقم بديل: ${altNumber}`);
      }
    }
    
    // فحص الكلمات المفتاحية
    let keywordMatches = 0;
    for (const keyword of rule.keyWords) {
      if (description.includes(keyword.toUpperCase())) {
        keywordMatches++;
      }
    }
    
    if (keywordMatches > 0) {
      matchScore += (keywordMatches / rule.keyWords.length) * 25;
      reasons.push(`${keywordMatches} كلمة مفتاحية متطابقة`);
    }
    
    return {
      isMatch: matchScore >= 70, // عتبة المطابقة 70%
      confidence: Math.min(matchScore, 100),
      reason: reasons.join(', ')
    };
  }
  
  /**
   * فحص ضد البيانات الموجودة ديناميكياً
   */
  private async checkAgainstExistingItems(
    partNumber: string,
    description: string,
    existingItems: any[]
  ): Promise<DuplicateCheckResult> {
    
    // البحث عن تطابقات مباشرة
    for (const item of existingItems) {
      const existingPart = this.normalizePartNumber(item.partNumber || '');
      const existingDesc = (item.description || '').toUpperCase();
      
      // تطابق رقم الجزء المباشر
      if (partNumber === existingPart && partNumber.length > 4) {
        return {
          isDuplicate: true,
          existingId: item.id,
          confidence: 95,
          reason: 'تطابق مباشر في رقم الجزء',
          suggestedAction: 'use_existing'
        };
      }
      
      // تطابق الوصف مع تشابه عالي
      const similarity = this.calculateDescriptionSimilarity(description, existingDesc);
      if (similarity > 0.85) {
        return {
          isDuplicate: true,
          existingId: item.id,
          confidence: Math.round(similarity * 100),
          reason: `تشابه عالي في الوصف (${Math.round(similarity * 100)}%)`,
          suggestedAction: similarity > 0.95 ? 'use_existing' : 'review_required'
        };
      }
    }
    
    return {
      isDuplicate: false,
      confidence: 0,
      reason: 'لا يوجد تطابق ديناميكي',
      suggestedAction: 'create_new'
    };
  }
  
  /**
   * تطبيع رقم الجزء
   */
  private normalizePartNumber(partNumber: string): string {
    if (!partNumber) return '';
    
    return partNumber
      .toUpperCase()
      .replace(/[^\w\d]/g, '')
      .replace(/\s+/g, '')
      .trim();
  }
  
  /**
   * حساب التشابه بين الأوصاف
   */
  private calculateDescriptionSimilarity(desc1: string, desc2: string): number {
    const words1 = desc1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const words2 = desc2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = Math.max(words1.length, words2.length);
    
    return commonWords.length / totalWords;
  }
  
  /**
   * إضافة قاعدة جديدة
   */
  addPreventionRule(rule: PreventionRule) {
    this.preventionRules.push(rule);
    console.log(`➕ تمت إضافة قاعدة جديدة: ${rule.name}`);
  }
  
  /**
   * الحصول على جميع القواعد
   */
  getAllRules(): PreventionRule[] {
    return [...this.preventionRules];
  }
}

// تصدير النسخة الوحيدة
export const radicalDuplicatePrevention = new RadicalDuplicatePrevention();