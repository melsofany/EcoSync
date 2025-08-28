/**
 * نظام المطابقة المزدوج
 * 1. مطابقة دقيقة: Part Number + التوصيف
 * 2. تحليل دلالي: فقط عند التشابه في التوصيف مع اختلاف Part Number
 */

export interface MatchResult {
  similar: boolean;
  score: number;
  reason: string;
  method: 'exact' | 'part_in_desc' | 'semantic' | 'fallback';
}

export class DualMatchingSystem {
  private deepSeekApiKey: string;

  constructor(deepSeekApiKey?: string) {
    this.deepSeekApiKey = deepSeekApiKey || process.env.DEEPSEEK_API_KEY || '';
  }

  /**
   * المطابقة المزدوجة الرئيسية
   */
  async compareItems(desc1: string, desc2: string, partNo1: string = '', partNo2: string = ''): Promise<MatchResult> {
    try {
      // الخطوة 1: المطابقة الدقيقة (Part Number + التوصيف)
      const exactMatch = this.checkExactMatch(desc1, desc2, partNo1, partNo2);
      if (exactMatch.similar) {
        return exactMatch;
      }

      // الخطوة 2: فحص وجود Part Number في التوصيف
      const partInDesc = this.checkPartNumberInDescription(desc1, desc2, partNo1, partNo2);
      if (partInDesc.similar) {
        return partInDesc;
      }

      // الخطوة 3: التحليل الدلالي (فقط للتوصيفات المتشابهة)
      const semanticSimilarity = this.calculateSemanticSimilarity(desc1, desc2);
      
      // استخدام AI فقط إذا كان التشابه عالي (70%+) ولكن أرقام القطع مختلفة
      if (semanticSimilarity >= 0.7 && partNo1 !== partNo2) {
        return await this.semanticAnalysis(desc1, desc2, partNo1, partNo2);
      }

      // إذا لم يكن متشابه بما فيه الكفاية، لا حاجة للـ AI
      return {
        similar: false,
        score: semanticSimilarity,
        reason: `غير متشابه (${Math.round(semanticSimilarity * 100)}% تشابه)`,
        method: 'fallback'
      };

    } catch (error) {
      console.error('خطأ في المطابقة المزدوجة:', error);
      return this.basicComparison(desc1, desc2);
    }
  }

  /**
   * فحص المطابقة الدقيقة
   * إذا كان Part Number والتوصيف متطابقين تماماً
   */
  private checkExactMatch(desc1: string, desc2: string, partNo1: string, partNo2: string): MatchResult {
    const normalizedPartNo1 = this.normalizePartNumber(partNo1);
    const normalizedPartNo2 = this.normalizePartNumber(partNo2);
    const normalizedDesc1 = this.normalizeText(desc1);
    const normalizedDesc2 = this.normalizeText(desc2);

    // مطابقة دقيقة: نفس Part Number ونفس التوصيف
    if (normalizedPartNo1 && normalizedPartNo2 && 
        normalizedPartNo1 === normalizedPartNo2 && 
        normalizedDesc1 === normalizedDesc2) {
      return {
        similar: true,
        score: 1.0,
        reason: `مطابقة دقيقة: رقم ${partNo1} + نفس التوصيف`,
        method: 'exact'
      };
    }

    return { 
      similar: false, 
      score: 0, 
      reason: 'لا توجد مطابقة دقيقة',
      method: 'exact'
    };
  }

  /**
   * فحص وجود Part Number في التوصيف
   * مثال: "كونتاكتور شنايدر 32أمبير كود LC1d32m7" مع "P/N : LC1D 32M7 , SCHNIEDER CONTACTOR"
   */
  private checkPartNumberInDescription(desc1: string, desc2: string, partNo1: string, partNo2: string): MatchResult {
    const normalizedPartNo1 = this.normalizePartNumber(partNo1);
    const normalizedPartNo2 = this.normalizePartNumber(partNo2);
    const normalizedDesc1 = this.normalizeText(desc1).toUpperCase();
    const normalizedDesc2 = this.normalizeText(desc2).toUpperCase();

    // فحص إذا كان Part Number موجود في التوصيف الآخر
    if (normalizedPartNo1 && normalizedDesc2.includes(normalizedPartNo1)) {
      return {
        similar: true,
        score: 0.95,
        reason: `رقم القطعة ${partNo1} موجود في التوصيف الثاني`,
        method: 'part_in_desc'
      };
    }

    if (normalizedPartNo2 && normalizedDesc1.includes(normalizedPartNo2)) {
      return {
        similar: true,
        score: 0.95,
        reason: `رقم القطعة ${partNo2} موجود في التوصيف الأول`,
        method: 'part_in_desc'
      };
    }

    return { 
      similar: false, 
      score: 0, 
      reason: 'لا يوجد تطابق في أرقام القطع',
      method: 'part_in_desc'
    };
  }

  /**
   * التحليل الدلالي باستخدام AI
   * يستخدم فقط للتوصيفات المتشابهة مع أرقام قطع مختلفة
   */
  private async semanticAnalysis(desc1: string, desc2: string, partNo1: string, partNo2: string): Promise<MatchResult> {
    // إذا لم يكن لدينا API key، استخدم التحليل الأساسي
    if (!this.deepSeekApiKey) {
      return this.advancedComparison(desc1, desc2, partNo1, partNo2);
    }

    try {
      const prompt = `قارن بين هذين البندين وحدد إذا كانا نفس المنتج الفعلي:

البند 1: "${desc1}" (رقم: ${partNo1})
البند 2: "${desc2}" (رقم: ${partNo2})

مثال صحيح للمطابقة:
"كونتاكتور شنايدر 32أمبير كود LC1d32m7" يطابق "P/N : LC1D 32M7 , SCHNIEDER CONTACTOR"

ركز على:
- نفس المنتج والشركة المصنعة
- نفس المواصفات الأساسية
- تجاهل الاختلافات في الكتابة

أجب بـ JSON فقط: {"similar": true/false, "score": 0.0-1.0, "reason": "السبب"}`;

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.deepSeekApiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 100
        })
      });

      if (!response.ok) {
        if (response.status === 402) {
          console.log('⚠️ انتهى رصيد DeepSeek API، استخدام التحليل المتقدم');
          return this.advancedComparison(desc1, desc2, partNo1, partNo2);
        }
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '{}';
      
      try {
        const result = JSON.parse(content);
        return {
          similar: result.similar || false,
          score: result.score || 0,
          reason: result.reason || 'تحليل AI دلالي',
          method: 'semantic'
        };
      } catch {
        const similar = content.toLowerCase().includes('true');
        return {
          similar,
          score: similar ? 0.8 : 0.3,
          reason: 'تحليل AI تلقائي',
          method: 'semantic'
        };
      }

    } catch (error) {
      console.log('⚠️ تم استخدام التحليل المتقدم بدلاً من AI');
      return this.advancedComparison(desc1, desc2, partNo1, partNo2);
    }
  }

  /**
   * حساب التشابه الدلالي الأساسي
   */
  private calculateSemanticSimilarity(desc1: string, desc2: string): number {
    const words1 = new Set(this.normalizeText(desc1).split(' ').filter(w => w.length > 2));
    const words2 = new Set(this.normalizeText(desc2).split(' ').filter(w => w.length > 2));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * مقارنة متقدمة بدون AI
   */
  private advancedComparison(desc1: string, desc2: string, partNo1: string, partNo2: string): MatchResult {
    const keywords1 = this.extractKeywords(desc1);
    const keywords2 = this.extractKeywords(desc2);
    
    const commonKeywords = keywords1.filter(k => keywords2.includes(k));
    const similarity = commonKeywords.length / Math.max(keywords1.length, keywords2.length);
    
    return {
      similar: similarity >= 0.7,
      score: similarity,
      reason: `تحليل متقدم: ${Math.round(similarity * 100)}% تشابه في الكلمات المفتاحية`,
      method: 'semantic'
    };
  }

  /**
   * مقارنة أساسية
   */
  private basicComparison(desc1: string, desc2: string): MatchResult {
    const cleanDesc1 = this.normalizeText(desc1);
    const cleanDesc2 = this.normalizeText(desc2);
    
    if (cleanDesc1 === cleanDesc2) {
      return {
        similar: true,
        score: 1.0,
        reason: 'نفس التوصيف تماماً',
        method: 'fallback'
      };
    }
    
    const words1 = cleanDesc1.split(' ');
    const words2 = cleanDesc2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    const similarity = commonWords.length / Math.max(words1.length, words2.length);
    
    return {
      similar: similarity >= 0.8,
      score: similarity,
      reason: `مقارنة أساسية: ${Math.round(similarity * 100)}% تشابه`,
      method: 'fallback'
    };
  }

  /**
   * تطبيع رقم القطعة
   */
  private normalizePartNumber(partNo: string): string {
    if (!partNo) return '';
    return partNo.toString()
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '')
      .replace(/[^A-Z0-9]/g, '');
  }

  /**
   * تطبيع النص
   */
  private normalizeText(text: string): string {
    if (!text) return '';
    return text.toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\u0600-\u06FF]/g, '');
  }

  /**
   * استخراج الكلمات المفتاحية
   */
  private extractKeywords(description: string): string[] {
    const normalized = this.normalizeText(description);
    const stopWords = ['FOR', 'WITH', 'AND', 'THE', 'REF', 'PN', 'CODE', 'لل', 'مع', 'في', 'من', 'كود'];
    
    const words = normalized.split(' ')
      .filter(word => word.length > 2)
      .filter(word => !stopWords.includes(word.toUpperCase()));
    
    return [...new Set(words)];
  }
}