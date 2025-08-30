#!/usr/bin/env node
// نظام التوحيد الذكي المحسّن - الإصدار النهائي

import { google } from 'googleapis';
import fs from 'fs';
import { config } from 'dotenv';
import fetch from 'node-fetch';

// تحميل المتغيرات البيئية
config();

// ==================== التكوين ====================
const keyFile = JSON.parse(fs.readFileSync('./attached_assets/cortoba-supp-sys-93ea3e5bcad2_1755195927771.json', 'utf8'));
const spreadsheetId = '1GYlz87nWa7q0W8KD7QuqiR-GCzu3C2KRmCGnYOCKZEg';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const auth = new google.auth.GoogleAuth({
  credentials: keyFile,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const authClient = await auth.getClient();
const sheets = google.sheets({ version: 'v4', auth: authClient });

// ==================== قاعدة معرفة المنتجات المتشابهة ====================
const PRODUCT_EQUIVALENTS = {
  // كونتاكتور Schneider Electric LC1D32M7 - نفس المنتج بأرقام مختلفة
  'LC1D32M7': ['2102034', '2102049', 'LC1D32', 'LC1D32M7C', 'LC1D32BD', 'LC1D32M7'],
  '2102034': ['LC1D32M7', '2102049', 'LC1D32', 'LC1D32M7C', 'LC1D32BD'],
  '2102049': ['LC1D32M7', '2102034', 'LC1D32', 'LC1D32M7C', 'LC1D32BD'],
  'LC1D32': ['LC1D32M7', '2102034', '2102049', 'LC1D32M7C', 'LC1D32BD'],
  
  // يمكن إضافة المزيد من المنتجات هنا في المستقبل
};

// ==================== دوال المعالجة المسبقة للنصوص ====================
function normalize(text) {
  if (!text) return '';
  
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\u0600-\u06FF]/g, '')
    .trim();
}

function extractKeyFeatures(text) {
  if (!text) return '';
  
  const commonWords = ['p/n', 'part', 'number', 'ref', 'reference', 'for', 'and', 'the', 'with'];
  let result = normalize(text);
  
  commonWords.forEach(word => {
    result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  });
  
  return result.replace(/\s+/g, ' ').trim();
}

// ==================== دالة استخراج أرقام الأجزاء المحسنة ====================
function extractPartNumbers(description) {
  const patterns = [
    /(?:p\/n|part\s*number|ref|reference)[\s:]*([a-z0-9\s]+)/gi,
    /\b([a-z]{2,}\d+[a-z0-9]*)\b/gi,
    /\b(\d+[a-z][a-z0-9]*)\b/gi,
    /\b(lc1d\s*\d+\s*[a-z]\d*)\b/gi
  ];
  
  const numbers = new Set();
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(description.toLowerCase())) !== null) {
      if (match[1]) {
        const cleanNumber = match[1].replace(/\s+/g, '').toUpperCase().trim();
        if (cleanNumber.length >= 3) {
          numbers.add(cleanNumber);
        }
      }
    }
  });
  
  // إضافة الأرقام المكافئة من قاعدة المعرفة
  const finalNumbers = new Set([...numbers]);
  numbers.forEach(number => {
    if (PRODUCT_EQUIVALENTS[number]) {
      PRODUCT_EQUIVALENTS[number].forEach(equivalent => {
        finalNumbers.add(equivalent);
      });
    }
  });
  
  return Array.from(finalNumbers);
}

// ==================== إطار العمل الشامل للتوحيد الذكي ====================

// إطار عمل التوحيد الذكي - يعمل مع أي منتج حالياً ومستقبلاً
function areProductsEquivalent(description1, description2) {
  if (!description1 || !description2) return false;
  
  const normalized1 = normalize(description1);
  const normalized2 = normalize(description2);
  
  // خطوة 1: تحليل هوية المنتج الأساسية
  const identity1 = extractProductIdentity(description1);
  const identity2 = extractProductIdentity(description2);
  
  // خطوة 2: التحقق من التطابق التام بعد التطبيع
  if (identity1.cleanDescription === identity2.cleanDescription) {
    return true;
  }
  
  // خطوة 3: قواعد الاستبعاد الصارمة
  if (!passesExclusionRules(identity1, identity2)) {
    return false;
  }
  
  // خطوة 4: حساب درجة التطابق الشاملة
  const matchScore = calculateOverallMatchScore(identity1, identity2);
  
  // خطوة 5: تطبيق العتبة الديناميكية
  const threshold = getDynamicThreshold(identity1, identity2);
  
  return matchScore >= threshold;
}

// استخراج هوية المنتج الشاملة
function extractProductIdentity(description) {
  const normalized = normalize(description);
  
  return {
    // الهوية الأساسية
    brand: extractBrandSmart(normalized),
    category: extractCategorySmart(normalized),
    productType: extractProductTypeSmart(normalized),
    
    // المواصفات التقنية
    electricalSpecs: extractElectricalSpecs(normalized),
    physicalSpecs: extractPhysicalSpecs(normalized),
    functionalSpecs: extractFunctionalSpecs(normalized),
    
    // الخصائص الدلالية
    coreFunction: extractCoreFunction(normalized),
    applicationArea: extractApplicationArea(normalized),
    
    // النص المنظف
    cleanDescription: removeAllNoise(normalized),
    
    // مؤشرات الجودة
    confidence: calculateExtractionConfidence(normalized)
  };
}

// قواعد الاستبعاد الصارمة
function passesExclusionRules(identity1, identity2) {
  // قاعدة 1: العلامة التجارية يجب أن تكون متطابقة
  if (identity1.brand && identity2.brand && identity1.brand !== identity2.brand) {
    return false;
  }
  
  // قاعدة 2: الفئة الأساسية يجب أن تكون متطابقة
  if (identity1.category && identity2.category && identity1.category !== identity2.category) {
    return false;
  }
  
  // قاعدة 3: نوع المنتج يجب أن يكون متطابق
  if (identity1.productType && identity2.productType && identity1.productType !== identity2.productType) {
    return false;
  }
  
  // قاعدة 4: المواصفات الكهربائية الأساسية يجب أن تكون متطابقة
  if (!areElectricalSpecsCompatible(identity1.electricalSpecs, identity2.electricalSpecs)) {
    return false;
  }
  
  // قاعدة 5: المواصفات الفيزيائية الرئيسية يجب أن تكون متطابقة
  if (!arePhysicalSpecsCompatible(identity1.physicalSpecs, identity2.physicalSpecs)) {
    return false;
  }
  
  return true;
}

// حساب درجة التطابق الشاملة
function calculateOverallMatchScore(identity1, identity2) {
  let totalScore = 0;
  let maxScore = 0;
  
  // وزن 30% - التطابق الدلالي للوصف المنظف
  const semanticScore = calculateSemanticSimilarity(identity1.cleanDescription, identity2.cleanDescription);
  totalScore += semanticScore * 30;
  maxScore += 30;
  
  // وزن 25% - تطابق الوظيفة الأساسية
  const functionScore = identity1.coreFunction === identity2.coreFunction ? 25 : 0;
  totalScore += functionScore;
  maxScore += 25;
  
  // وزن 20% - تطابق المواصفات الوظيفية
  const functionalScore = compareFunctionalSpecs(identity1.functionalSpecs, identity2.functionalSpecs);
  totalScore += functionalScore * 20;
  maxScore += 20;
  
  // وزن 15% - تطابق مجال التطبيق
  const applicationScore = identity1.applicationArea === identity2.applicationArea ? 15 : 0;
  totalScore += applicationScore;
  maxScore += 15;
  
  // وزن 10% - جودة الاستخراج
  const confidenceScore = Math.min(identity1.confidence, identity2.confidence) * 10;
  totalScore += confidenceScore;
  maxScore += 10;
  
  return maxScore > 0 ? totalScore / maxScore : 0;
}

// عتبة ديناميكية حسب نوع المنتج وجودة البيانات
function getDynamicThreshold(identity1, identity2) {
  let baseThreshold = 0.75; // عتبة أساسية 75%
  
  // تعديل حسب نوع المنتج
  const productTypeAdjustments = {
    'electrical_component': -0.1, // مكونات كهربائية: عتبة أقل (65%)
    'electronic_device': 0.05,   // أجهزة إلكترونية: عتبة أعلى (80%)
    'appliance': 0.1,            // أجهزة منزلية: عتبة أعلى (85%)
    'industrial_equipment': -0.05 // معدات صناعية: عتبة متوسطة (70%)
  };
  
  const category1 = identity1.category || 'unknown';
  const category2 = identity2.category || 'unknown';
  
  if (category1 === category2 && productTypeAdjustments[category1]) {
    baseThreshold += productTypeAdjustments[category1];
  }
  
  // تعديل حسب جودة البيانات
  const avgConfidence = (identity1.confidence + identity2.confidence) / 2;
  if (avgConfidence < 0.5) {
    baseThreshold -= 0.1; // بيانات ضعيفة: عتبة أقل
  } else if (avgConfidence > 0.8) {
    baseThreshold += 0.05; // بيانات قوية: عتبة أعلى
  }
  
  // ضمان أن العتبة في نطاق معقول
  return Math.max(0.5, Math.min(0.9, baseThreshold));
}

// ==================== دوال الاستخراج الذكية الشاملة ====================

// استخراج العلامة التجارية الذكي
function extractBrandSmart(description) {
  const brandPatterns = {
    'schneider': /schneider|schnieder|telemecanique/gi,
    'samsung': /samsung/gi,
    'lg': /lg/gi,
    'toshiba': /toshiba/gi,
    'sony': /sony/gi,
    'tornado': /tornado/gi,
    'philips': /philips/gi,
    'siemens': /siemens/gi,
    'abb': /abb/gi,
    'omron': /omron/gi
  };
  
  for (const [brand, pattern] of Object.entries(brandPatterns)) {
    if (pattern.test(description)) {
      return brand;
    }
  }
  return null;
}

// استخراج الفئة الذكي
function extractCategorySmart(description) {
  const categoryPatterns = {
    'electrical_component': /contactor|relay|switch|breaker|fuse|transformer/gi,
    'electronic_device': /tv|television|monitor|display|projector/gi,
    'appliance': /refrigerator|washing machine|dishwasher|microwave|oven/gi,
    'kitchen_equipment': /grill|fryer|blender|mixer|cooker/gi,
    'industrial_equipment': /motor|pump|compressor|generator|welder/gi,
    'lighting': /led|lamp|bulb|fixture|spotlight/gi,
    'hvac': /air conditioner|heater|fan|ventilator|humidifier/gi
  };
  
  for (const [category, pattern] of Object.entries(categoryPatterns)) {
    if (pattern.test(description)) {
      return category;
    }
  }
  return null;
}

// استخراج نوع المنتج الذكي
function extractProductTypeSmart(description) {
  const typePatterns = {
    // مكونات كهربائية
    'contactor': /contactor/gi,
    'relay': /relay/gi,
    'switch': /switch/gi,
    'breaker': /circuit.*breaker|breaker/gi,
    
    // أجهزة إلكترونية
    'smart_tv': /smart.*tv|android.*tv/gi,
    'led_tv': /led.*tv/gi,
    'lcd_tv': /lcd.*tv/gi,
    'tv': /tv|television|تلفزيون/gi,
    
    // معدات مطبخ
    'electric_grill': /electric.*grill|grill.*electric/gi,
    'gas_grill': /gas.*grill|grill.*gas/gi,
    'fryer': /fryer|قلاية/gi,
    
    // أجهزة منزلية
    'refrigerator': /refrigerator|fridge|ثلاجة/gi,
    'washing_machine': /washing.*machine|غسالة/gi
  };
  
  for (const [type, pattern] of Object.entries(typePatterns)) {
    if (pattern.test(description)) {
      return type;
    }
  }
  return null;
}

// استخراج المواصفات الكهربائية
function extractElectricalSpecs(description) {
  const specs = {};
  
  // الجهد
  const voltageMatch = description.match(/(\d+)\s*v(?:olt)?/gi);
  if (voltageMatch) {
    specs.voltage = voltageMatch.map(v => parseInt(v.replace(/[^0-9]/g, '')));
  }
  
  // التيار
  const currentMatch = description.match(/(\d+)\s*a(?:mp)?/gi);
  if (currentMatch) {
    specs.current = currentMatch.map(c => parseInt(c.replace(/[^0-9]/g, '')));
  }
  
  // القدرة
  const powerMatch = description.match(/(\d+(?:\.\d+)?)\s*(?:kw|w)/gi);
  if (powerMatch) {
    specs.power = powerMatch.map(p => {
      const num = parseFloat(p.replace(/[^0-9.]/g, ''));
      return p.toLowerCase().includes('kw') ? num * 1000 : num;
    });
  }
  
  // التردد
  const freqMatch = description.match(/(\d+(?:[-/]\d+)?)\s*hz/gi);
  if (freqMatch) {
    specs.frequency = freqMatch.map(f => f.replace(/[^0-9-/]/g, ''));
  }
  
  return specs;
}

// استخراج المواصفات الفيزيائية
function extractPhysicalSpecs(description) {
  const specs = {};
  
  // الحجم (للتلفزيونات والشاشات)
  const sizeMatch = description.match(/(\d+)\s*(?:''|"|inch|بوصة)/gi);
  if (sizeMatch) {
    specs.screenSize = sizeMatch.map(s => parseInt(s.replace(/[^0-9]/g, '')));
  }
  
  // الأبعاد
  const dimensionMatch = description.match(/(\d+)\s*x\s*(\d+)\s*(?:x\s*(\d+))?\s*(?:cm|mm|m)/gi);
  if (dimensionMatch) {
    specs.dimensions = dimensionMatch;
  }
  
  // الوزن
  const weightMatch = description.match(/(\d+(?:\.\d+)?)\s*(?:kg|g|lb)/gi);
  if (weightMatch) {
    specs.weight = weightMatch;
  }
  
  return specs;
}

// استخراج المواصفات الوظيفية
function extractFunctionalSpecs(description) {
  const specs = {};
  
  // خصائص الذكاء
  specs.smart = /smart|android|wifi|bluetooth|internet/gi.test(description);
  
  // نوع التحكم
  if (/remote|ريموت/gi.test(description)) specs.control = 'remote';
  if (/manual|يدوي/gi.test(description)) specs.control = 'manual';
  if (/automatic|تلقائي/gi.test(description)) specs.control = 'automatic';
  
  // مصدر الطاقة
  if (/electric|كهربائي/gi.test(description)) specs.powerSource = 'electric';
  if (/gas|غاز/gi.test(description)) specs.powerSource = 'gas';
  if (/battery|بطارية/gi.test(description)) specs.powerSource = 'battery';
  
  // مستوى الكفاءة
  const efficiencyMatch = description.match(/energy.*star|efficiency.*class\s*([a-g])/gi);
  if (efficiencyMatch) specs.efficiency = efficiencyMatch;
  
  return specs;
}

// استخراج الوظيفة الأساسية
function extractCoreFunction(description) {
  const functionPatterns = {
    'switching': /switch|contactor|relay/gi,
    'protection': /breaker|fuse|protector/gi,
    'display': /tv|monitor|display|screen/gi,
    'cooking': /grill|fryer|oven|cooker/gi,
    'cooling': /refrigerator|freezer|air.*conditioner/gi,
    'cleaning': /washing.*machine|dishwasher|vacuum/gi,
    'lighting': /lamp|bulb|led|light/gi,
    'heating': /heater|boiler|warmer/gi
  };
  
  for (const [func, pattern] of Object.entries(functionPatterns)) {
    if (pattern.test(description)) {
      return func;
    }
  }
  return null;
}

// استخراج مجال التطبيق
function extractApplicationArea(description) {
  const applicationPatterns = {
    'industrial': /industrial|factory|manufacturing/gi,
    'commercial': /commercial|office|business/gi,
    'residential': /home|house|domestic|residential/gi,
    'kitchen': /kitchen|cooking|food/gi,
    'entertainment': /entertainment|media|gaming/gi,
    'automation': /automation|control|smart/gi
  };
  
  for (const [area, pattern] of Object.entries(applicationPatterns)) {
    if (pattern.test(description)) {
      return area;
    }
  }
  return null;
}

// إزالة جميع الضوضاء من النص
function removeAllNoise(description) {
  return description
    // إزالة أرقام القطع
    .replace(/p\/n\s*:?\s*[a-z0-9\s]+/gi, '')
    .replace(/ref\s*:?\s*[a-z0-9\s]+/gi, '')
    .replace(/model\s*:?\s*[a-z0-9\s]+/gi, '')
    .replace(/\b[a-z]{2,}\d+[a-z0-9]*\b/gi, '')
    .replace(/\b\d{7,}\b/gi, '')
    
    // إزالة كلمات عامة
    .replace(/\b(the|and|or|for|with|by|from|to|of|in|on|at)\b/gi, '')
    
    // تنظيف المسافات
    .replace(/\s+/g, ' ')
    .trim();
}

// حساب ثقة الاستخراج
function calculateExtractionConfidence(description) {
  let confidence = 0.5; // قيمة أساسية
  
  // زيادة الثقة للنصوص الطويلة والمفصلة
  if (description.length > 50) confidence += 0.1;
  if (description.length > 100) confidence += 0.1;
  
  // زيادة الثقة لوجود مواصفات تقنية
  if (/\d+v|\d+a|\d+kw|\d+hz/gi.test(description)) confidence += 0.15;
  
  // زيادة الثقة لوجود علامة تجارية معروفة
  if (/schneider|samsung|lg|toshiba|sony/gi.test(description)) confidence += 0.1;
  
  // تقليل الثقة للنصوص الغامضة
  if (description.length < 20) confidence -= 0.2;
  if (!/[a-z]/gi.test(description)) confidence -= 0.3;
  
  return Math.max(0.1, Math.min(1.0, confidence));
}

// ==================== دوال المقارنة والتوافق ====================

// مقارنة المواصفات الكهربائية
function areElectricalSpecsCompatible(specs1, specs2) {
  if (!specs1 && !specs2) return true;
  if (!specs1 || !specs2) return true; // إذا كان أحدهما فارغ، نعتبرهما متوافقين
  
  // مقارنة الجهد
  if (specs1.voltage && specs2.voltage) {
    const hasCommonVoltage = specs1.voltage.some(v => specs2.voltage.includes(v));
    if (!hasCommonVoltage) return false;
  }
  
  // مقارنة التيار (يجب أن يكون في نطاق معقول)
  if (specs1.current && specs2.current) {
    const avgCurrent1 = specs1.current.reduce((a, b) => a + b, 0) / specs1.current.length;
    const avgCurrent2 = specs2.current.reduce((a, b) => a + b, 0) / specs2.current.length;
    const diff = Math.abs(avgCurrent1 - avgCurrent2) / Math.max(avgCurrent1, avgCurrent2);
    if (diff > 0.2) return false; // اختلاف أكثر من 20% غير مقبول
  }
  
  // مقارنة القدرة
  if (specs1.power && specs2.power) {
    const avgPower1 = specs1.power.reduce((a, b) => a + b, 0) / specs1.power.length;
    const avgPower2 = specs2.power.reduce((a, b) => a + b, 0) / specs2.power.length;
    const diff = Math.abs(avgPower1 - avgPower2) / Math.max(avgPower1, avgPower2);
    if (diff > 0.15) return false; // اختلاف أكثر من 15% غير مقبول
  }
  
  return true;
}

// مقارنة المواصفات الفيزيائية
function arePhysicalSpecsCompatible(specs1, specs2) {
  if (!specs1 && !specs2) return true;
  if (!specs1 || !specs2) return true;
  
  // مقارنة حجم الشاشة (مهم جداً للتلفزيونات)
  if (specs1.screenSize && specs2.screenSize) {
    const hasCommonSize = specs1.screenSize.some(s => specs2.screenSize.includes(s));
    if (!hasCommonSize) return false;
  }
  
  return true;
}

// مقارنة المواصفات الوظيفية
function compareFunctionalSpecs(specs1, specs2) {
  if (!specs1 && !specs2) return 1.0;
  if (!specs1 || !specs2) return 0.7;
  
  let matches = 0;
  let total = 0;
  
  // مقارنة الذكاء
  if ('smart' in specs1 && 'smart' in specs2) {
    total++;
    if (specs1.smart === specs2.smart) matches++;
  }
  
  // مقارنة نوع التحكم
  if (specs1.control && specs2.control) {
    total++;
    if (specs1.control === specs2.control) matches++;
  }
  
  // مقارنة مصدر الطاقة
  if (specs1.powerSource && specs2.powerSource) {
    total++;
    if (specs1.powerSource === specs2.powerSource) matches++;
  }
  
  return total > 0 ? matches / total : 1.0;
}

// حساب التشابه الدلالي
function calculateSemanticSimilarity(desc1, desc2) {
  if (!desc1 || !desc2) return 0;
  
  const words1 = new Set(desc1.split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(desc2.split(/\s+/).filter(w => w.length > 2));
  
  if (words1.size === 0 && words2.size === 0) return 1.0;
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const commonWords = new Set([...words1].filter(word => words2.has(word)));
  const allWords = new Set([...words1, ...words2]);
  
  return commonWords.size / allWords.size;
}



// ==================== نظام إدارة المجموعات ====================
class ProductGroupManager {
  constructor() {
    this.groups = new Map();
    this.groupCounter = 1;
    this.productToGroupMap = new Map();
  }
  
  findGroupForProduct(description, partNumber, lineItem) {
    const key = description || partNumber || lineItem;
    if (!key) return null;
    
    // البحث في الخريطة باستخدام أرقام الأجزاء أولاً
    const partNumbers = extractPartNumbers(description || '');
    for (const pn of partNumbers) {
      if (this.productToGroupMap.has(pn)) {
        return this.productToGroupMap.get(pn);
      }
    }
    
    // البحث بالوصف الكامل
    if (this.productToGroupMap.has(key)) {
      return this.productToGroupMap.get(key);
    }
    
    return null;
  }
  
  createNewGroup(description, partNumber, lineItem) {
    const newGroupId = `P-${this.groupCounter.toString().padStart(7, '0')}`;
    this.groupCounter++;
    
    this.groups.set(newGroupId, {
      descriptions: new Set(),
      partNumbers: new Set(),
      lineItems: new Set(),
      rows: []
    });
    
    this.addToGroup(newGroupId, description, partNumber, lineItem, -1);
    return newGroupId;
  }
  
  addToGroup(groupId, description, partNumber, lineItem, rowIndex) {
    const group = this.groups.get(groupId);
    
    if (description) {
      group.descriptions.add(description);
      this.productToGroupMap.set(description, groupId);
    }
    
    if (partNumber) {
      group.partNumbers.add(partNumber);
      this.productToGroupMap.set(partNumber, groupId);
    }
    
    if (lineItem) {
      group.lineItems.add(lineItem);
      this.productToGroupMap.set(lineItem, groupId);
    }
    
    // إضافة أرقام الأجزاء المستخرجة إلى الخريطة
    const partNumbers = extractPartNumbers(description || '');
    partNumbers.forEach(pn => {
      this.productToGroupMap.set(pn, groupId);
    });
    
    if (rowIndex >= 0) {
      group.rows.push(rowIndex);
    }
  }
}

// ==================== حفظ الحالة للتوافق مع النظام ====================
function saveStatus(currentIndex, totalItems, isRunning = true) {
  const status = {
    isRunning,
    isPaused: false,
    currentIndex,
    totalItems,
    processedItems: currentIndex,
    unifiedItems: 0,
    startTime: new Date().toISOString(),
    errorCount: 0
  };
  
  fs.writeFileSync('./unification-status.json', JSON.stringify(status, null, 2));
}

// ==================== البرنامج الرئيسي ====================
async function unifyProducts() {
  console.log('🚀 بدء عملية توحيد المنتجات - الإصدار النهائي المحسن...\n');
  
  try {
    // قراءة البيانات من Google Sheets
    console.log('📖 جلب البيانات من Google Sheets...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DATA!A:E'
    });
    
    const rows = response.data.values || [];
    console.log(`✅ تم تحميل ${rows.length} صفوف\n`);
    
    if (rows.length < 2) {
      console.log('❌ لا توجد بيانات كافية للمعالجة');
      return;
    }
    
    // معالجة البيانات
    console.log('🔍 معالجة البيانات وإنشاء المجموعات...');
    const manager = new ProductGroupManager();
    const updates = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const currentId = row[0] || '';
      const lineItem = row[2] || '';
      const partNumber = row[3] || '';
      const description = row[4] || '';
      
      if (!lineItem && !partNumber && !description) {
        continue;
      }
      
      console.log(`\n🔍 معالجة الصف ${i+1}: "${(description || partNumber || lineItem).substring(0, 60)}..."`);
      
      // البحث عن مجموعة موجودة
      let groupId = manager.findGroupForProduct(description, partNumber, lineItem);
      
      // إذا لم يتم العثور على مجموعة، البحث بالمقارنة مع المجموعات الموجودة
      if (!groupId) {
        for (const [existingGroupId, group] of manager.groups.entries()) {
          for (const existingDesc of group.descriptions) {
            if (areProductsEquivalent(description, existingDesc)) {
              groupId = existingGroupId;
              console.log(`   🎯 تطابق مع المجموعة: ${groupId}`);
              break;
            }
          }
          if (groupId) break;
        }
      }
      
      // إذا لم يتم العثور على مجموعة، إنشاء مجموعة جديدة
      if (!groupId) {
        groupId = manager.createNewGroup(description, partNumber, lineItem);
        console.log(`   🆕 مجموعة جديدة: ${groupId}`);
      } else {
        console.log(`   ✅ تطابق مع المجموعة: ${groupId}`);
      }
      
      // إضافة الصف إلى المجموعة
      manager.addToGroup(groupId, description, partNumber, lineItem, i);
      
      // إضافة التحديث إلى القائمة
      updates.push({
        range: `DATA!A${i + 1}`,
        values: [[groupId]]
      });
      
      // عرض التقدم وحفظ الحالة كل 10 صفوف
      if (i % 10 === 0) {
        console.log(`\n⏳ التقدم: ${i}/${rows.length-1} (${Math.round(i * 100 / (rows.length-1))}%)`);
        console.log(`📊 عدد المجموعات: ${manager.groups.size}`);
        saveStatus(i, rows.length - 1, true);
        
        // تأخير قصير
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // تطبيق التحديثات على Google Sheets
    console.log('\n💾 حفظ التغييرات في Google Sheets...');
    const batchSize = 500;
    let updatedCount = 0;
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          data: batch,
          valueInputOption: 'RAW'
        }
      });
      
      updatedCount += batch.length;
      console.log(`   ✅ تم تحديث ${updatedCount}/${updates.length} صف`);
      
      // تأخير قصير بين الدفعات
      if (i + batchSize < updates.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // عرض الإحصائيات النهائية
    console.log('\n📊 الإحصائيات النهائية:');
    console.log(`   • إجمالي الصفوف: ${rows.length - 1}`);
    console.log(`   • المجموعات الفريدة: ${manager.groups.size}`);
    console.log(`   • نسبة التوفير: ${Math.round(((rows.length - 1 - manager.groups.size) / (rows.length - 1)) * 100)}%`);
    
    // عرض تفاصيل المجموعات المتطابقة
    let totalUnified = 0;
    let duplicateGroups = 0;
    
    for (const [groupId, group] of manager.groups.entries()) {
      if (group.rows.length > 1) {
        duplicateGroups++;
        totalUnified += group.rows.length;
        const firstDesc = [...group.descriptions][0];
        console.log(`   🔗 ${groupId}: ${group.rows.length} بند متطابق - "${firstDesc?.substring(0, 50)}..."`);
      }
    }
    
    console.log(`\n📈 ملخص التوحيد:`);
    console.log(`   • المنتجات المكررة: ${duplicateGroups}`);
    console.log(`   • البنود الموحدة: ${totalUnified}`);
    console.log(`   • معدل التوفير: ${Math.round((totalUnified - duplicateGroups) * 100 / (rows.length - 1))}%`);
    
    console.log('\n🎉 تم الانتهاء من عملية التوحيد بنجاح!');
    
    // حفظ الحالة النهائية
    saveStatus(rows.length - 1, rows.length - 1, false);
    
  } catch (error) {
    console.error('❌ حدث خطأ:', error.message);
    if (error.response?.data) {
      console.error('تفاصيل الخطأ:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// تشغيل البرنامج
console.log('=====================================');
console.log('   نظام التوحيد الذكي المحسن');
console.log('   الإصدار النهائي المطور');
console.log('=====================================\n');

console.log('🔧 استخدام نظام المقارنة المحسن مع قاعدة المعرفة');
console.log('📋 قاعدة معرفة المنتجات: LC1D32M7, 2102034, 2102049');

unifyProducts();