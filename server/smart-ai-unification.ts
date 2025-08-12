import fs from 'fs';
import { readFileSync, writeFileSync } from 'fs';

// تشغيل نظام التوحيد الذكي باستخدام DeepSeek AI
class SmartAIUnification {
  private apiKey: string;
  private apiUrl: string = 'https://api.deepseek.com/v1/chat/completions';

  constructor() {
    this.apiKey = 'sk-0cf4004a1ce7403880ef677bb2fe92f9';
  }

  // استدعاء DeepSeek API
  async callDeepSeekAPI(messages: any[], temperature = 0.3) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('❌ خطأ في API:', error.message);
      return null;
    }
  }

  // تحليل مجموعة من الأصناف للتوحيد
  async analyzeItemsForUnification(items: any[]) {
    const prompt = `
أنت خبير في توحيد قطع الغيار والمعدات الصناعية. قم بتحليل هذه المجموعة من الأصناف وحدد أيها يمكن توحيده:

${items.map((item, index) => `
${index + 1}. LINE ITEM: ${item.lineItem}
   PART NO: ${item.partNo || 'فارغ'}
   الوصف: ${item.description}
   طلب التسعير: ${item.rfqNumber}
`).join('\n')}

معايير التوحيد:
1. نفس رقم القطعة (PART NO) = توحيد مؤكد
2. أوصاف متطابقة تماماً = توحيد مؤكد  
3. أوصاف متشابهة جداً لنفس المنتج = توحيد محتمل
4. نفس الوظيفة والمواصفات = توحيد محتمل

أعطني النتيجة بصيغة JSON:
{
  "canUnify": true/false,
  "confidence": 0-100,
  "unificationGroups": [
    {
      "masterItem": "رقم العنصر الرئيسي",
      "duplicates": ["رقم العنصر المكرر 1", "رقم العنصر المكرر 2"],
      "reason": "سبب التوحيد",
      "similarity": 0-100
    }
  ],
  "reasoning": "تفسير مفصل للقرار"
}`;

    const messages = [
      {
        role: 'system',
        content: 'أنت خبير في تحليل قطع الغيار والمعدات الصناعية. ردك يجب أن يكون بصيغة JSON صحيحة فقط.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return await this.callDeepSeekAPI(messages, 0.2);
  }

  // تشغيل التوحيد الشامل
  async runSmartUnification() {
    console.log('🚀 بدء التوحيد الذكي باستخدام DeepSeek AI...');

    // قراءة نتائج التحليل السابق
    const analysisPath = './attached_assets/ai_duplicate_analysis.json';
    if (!fs.existsSync(analysisPath)) {
      console.log('❌ لم يتم العثور على نتائج التحليل. قم بتشغيل التحليل أولاً.');
      return;
    }

    const analysisResults = JSON.parse(readFileSync(analysisPath, 'utf8'));
    const savedData = JSON.parse(readFileSync('./attached_assets/database_records.json', 'utf8'));
    
    console.log(`📊 معالجة ${analysisResults.partNoMatches} مجموعة من أرقام القطع المكررة...`);

    const unificationResults = {
      timestamp: new Date().toISOString(),
      processedGroups: 0,
      unifiedItems: 0,
      unificationActions: []
    };

    // معالجة مجموعات PART NO المكررة
    for (const [partNo, items] of analysisResults.partNoGroups.slice(0, 10)) {
      if (items.length > 1) {
        console.log(`\n🔍 تحليل PART NO: ${partNo} (${items.length} عنصر)`);
        
        const aiAnalysis = await this.analyzeItemsForUnification(items);
        
        if (aiAnalysis && aiAnalysis.canUnify && aiAnalysis.confidence > 80) {
          console.log(`✅ توحيد مؤكد - ثقة: ${aiAnalysis.confidence}%`);
          console.log(`📝 السبب: ${aiAnalysis.reasoning}`);
          
          // تسجيل عملية التوحيد
          unificationResults.unificationActions.push({
            type: 'part_number_match',
            partNo: partNo,
            masterItem: items[0].lineItem,
            duplicates: items.slice(1).map(item => item.lineItem),
            confidence: aiAnalysis.confidence,
            reason: aiAnalysis.reasoning
          });
          
          unificationResults.unifiedItems += items.length - 1;
        } else if (aiAnalysis) {
          console.log(`⚠️ توحيد غير مؤكد - ثقة: ${aiAnalysis.confidence}%`);
          console.log(`📝 السبب: ${aiAnalysis.reasoning}`);
        }
        
        unificationResults.processedGroups++;
        
        // تأخير لتجنب تجاوز حدود API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // معالجة مجموعات الأوصاف المتشابهة (عينة)
    console.log(`\n📝 معالجة عينة من الأوصاف المتشابهة...`);
    
    for (const [descKey, items] of analysisResults.descriptionGroups.slice(0, 5)) {
      if (items.length > 1) {
        console.log(`\n🔍 تحليل الوصف: ${items[0].description?.substring(0, 60)}...`);
        
        const aiAnalysis = await this.analyzeItemsForUnification(items);
        
        if (aiAnalysis && aiAnalysis.canUnify && aiAnalysis.confidence > 85) {
          console.log(`✅ توحيد مؤكد - ثقة: ${aiAnalysis.confidence}%`);
          
          unificationResults.unificationActions.push({
            type: 'description_match',
            description: items[0].description?.substring(0, 100),
            masterItem: items[0].lineItem,
            duplicates: items.slice(1).map(item => item.lineItem),
            confidence: aiAnalysis.confidence,
            reason: aiAnalysis.reasoning
          });
          
          unificationResults.unifiedItems += items.length - 1;
        }
        
        unificationResults.processedGroups++;
        
        // تأخير لتجنب تجاوز حدود API
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    // حفظ نتائج التوحيد
    writeFileSync('./attached_assets/smart_unification_results.json', JSON.stringify(unificationResults, null, 2));
    
    console.log('\n🎯 ملخص التوحيد الذكي:');
    console.log(`📊 المجموعات المعالجة: ${unificationResults.processedGroups}`);
    console.log(`🔗 الأصناف الموحدة: ${unificationResults.unifiedItems}`);
    console.log(`📋 عمليات التوحيد: ${unificationResults.unificationActions.length}`);
    console.log(`✅ تم حفظ النتائج في smart_unification_results.json`);
    
    return unificationResults;
  }

  // تطبيق التوحيد على البيانات
  async applyUnification() {
    console.log('🔄 تطبيق نتائج التوحيد على البيانات...');
    
    const unificationPath = './attached_assets/smart_unification_results.json';
    if (!fs.existsSync(unificationPath)) {
      console.log('❌ لم يتم العثور على نتائج التوحيد.');
      return;
    }

    const unificationResults = JSON.parse(readFileSync(unificationPath, 'utf8'));
    const savedData = JSON.parse(readFileSync('./attached_assets/database_records.json', 'utf8'));
    
    let unifiedData = [...savedData];
    let removedItems = 0;
    
    // تطبيق عمليات التوحيد
    for (const action of unificationResults.unificationActions) {
      console.log(`🔗 توحيد: ${action.masterItem} + ${action.duplicates.length} عنصر مكرر`);
      
      // إزالة العناصر المكررة من البيانات
      unifiedData = unifiedData.filter(item => {
        const shouldRemove = action.duplicates.includes(item.lineItem);
        if (shouldRemove) {
          removedItems++;
          console.log(`   - إزالة: ${item.lineItem}`);
        }
        return !shouldRemove;
      });
    }
    
    // حفظ البيانات الموحدة
    writeFileSync('./attached_assets/database_records_unified.json', JSON.stringify(unifiedData, null, 2));
    
    console.log(`\n✅ تم التوحيد بنجاح:`);
    console.log(`📊 البيانات الأصلية: ${savedData.length} عنصر`);
    console.log(`🗑️ العناصر المحذوفة: ${removedItems} عنصر`);
    console.log(`📦 البيانات الموحدة: ${unifiedData.length} عنصر`);
    console.log(`💾 تم الحفظ في: database_records_unified.json`);
    
    return {
      originalCount: savedData.length,
      removedCount: removedItems,
      unifiedCount: unifiedData.length,
      filePath: './attached_assets/database_records_unified.json'
    };
  }
}

export default SmartAIUnification;

// تشغيل مباشر إذا تم استدعاء الملف
if (import.meta.url === `file://${process.argv[1]}`) {
  const unification = new SmartAIUnification();
  unification.runSmartUnification().then(() => {
    console.log('🎯 اكتمل التحليل الذكي!');
  }).catch(error => {
    console.error('❌ خطأ في التحليل:', error.message);
  });
}