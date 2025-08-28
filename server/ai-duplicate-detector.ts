// Using DeepSeek API for AI analysis
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY; // Using DeepSeek API key

async function callDeepSeekAPI(messages: any[], temperature = 0.3) {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
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
  return data.choices[0]?.message?.content || '{}';
}

export interface ItemForAnalysis {
  id: string;
  serial_number: number;
  description: string;
  part_number: string;
  line_item: string;
  category: string;
}

export interface DuplicateGroup {
  masterItem: ItemForAnalysis;
  duplicates: ItemForAnalysis[];
  similarity: number;
  reason: string;
}

export interface AIAnalysisResult {
  totalItems: number;
  uniqueItems: number;
  duplicateGroups: DuplicateGroup[];
  confidence: number;
}

export async function analyzeItemsForDuplicates(items: ItemForAnalysis[]): Promise<AIAnalysisResult> {
  try {
    console.log(`بدء تحليل ${items.length} صنف للتكرارات باستخدام الذكاء الاصطناعي...`);
    
    // Group items by similar descriptions for initial filtering
    const itemGroups = groupSimilarItems(items);
    console.log(`تم تجميع البنود إلى ${itemGroups.length} مجموعة أولية`);
    
    const duplicateGroups: DuplicateGroup[] = [];
    
    // Analyze each group with AI
    for (const group of itemGroups) {
      if (group.length > 1) {
        const aiResult = await analyzeGroupWithAI(group);
        if (aiResult) {
          duplicateGroups.push(aiResult);
        }
      }
    }
    
    const uniqueItems = items.length - duplicateGroups.reduce((sum, group) => sum + group.duplicates.length, 0);
    
    return {
      totalItems: items.length,
      uniqueItems,
      duplicateGroups,
      confidence: 0.85 // Overall confidence based on AI analysis
    };
    
  } catch (error) {
    console.error('خطأ في تحليل التكرارات:', error);
    throw new Error('فشل في تحليل التكرارات باستخدام الذكاء الاصطناعي');
  }
}

function groupSimilarItems(items: ItemForAnalysis[]): ItemForAnalysis[][] {
  const groups: Map<string, ItemForAnalysis[]> = new Map();
  
  for (const item of items) {
    // Create a normalized key for semantic grouping
    const normalizedDesc = item.description
      .toUpperCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const normalizedLineItem = (item.line_item || '')
      .toUpperCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '')
      .trim();
    
    // استخراج الكلمات المفتاحية من الوصف للتجميع الدلالي
    const keywords = extractSemanticKeywords(normalizedDesc);
    const brandKeyword = extractBrandKeyword(normalizedDesc);
    const typeKeyword = extractTypeKeyword(normalizedDesc);
    
    // تجميع بناءً على المعايير الدلالية
    let groupKey = '';
    
    if (normalizedLineItem) {
      // أعلى أولوية: LINE ITEM
      groupKey = `lineitem_${normalizedLineItem}`;
    } else if (brandKeyword && typeKeyword) {
      // تجميع بناءً على العلامة التجارية ونوع المنتج
      groupKey = `semantic_${brandKeyword}_${typeKeyword}`;
    } else if (keywords.length > 0) {
      // تجميع بناءً على الكلمات المفتاحية
      groupKey = `keywords_${keywords.slice(0, 3).join('_')}`;
    } else {
      // الحل الاحتياطي: باستخدام جزء من الوصف مع رقم الجزء
      groupKey = `fallback_${normalizedDesc.substring(0, 30)}_${item.part_number || 'nopart'}`;
    }
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(item);
  }
  
  return Array.from(groups.values());
}

// استخراج الكلمات المفتاحية للمعنى
function extractSemanticKeywords(description: string): string[] {
  const keywords = [];
  const desc = description.toLowerCase();
  
  // كلمات مفتاحية تقنية مهمة
  const technicalKeywords = [
    'contactor', 'relay', 'switch', 'motor', 'pump', 'valve', 'sensor',
    'controller', 'inverter', 'transformer', 'breaker', 'fuse', 'cable',
    'connector', 'terminal', 'housing', 'filter', 'bearing', 'seal'
  ];
  
  for (const keyword of technicalKeywords) {
    if (desc.includes(keyword)) {
      keywords.push(keyword);
    }
  }
  
  return keywords;
}

// استخراج العلامة التجارية
function extractBrandKeyword(description: string): string | null {
  const desc = description.toLowerCase();
  const brands = [
    'schneider', 'siemens', 'abb', 'allen bradley', 'omron', 'mitsubishi',
    'fanuc', 'yaskawa', 'delta', 'panasonic', 'keyence', 'sick', 'pepperl',
    'turck', 'ifm', 'balluff', 'banner', 'telemecanique', 'square d'
  ];
  
  for (const brand of brands) {
    if (desc.includes(brand)) {
      return brand.replace(/\s+/g, '');
    }
  }
  
  return null;
}

// استخراج نوع المنتج
function extractTypeKeyword(description: string): string | null {
  const desc = description.toLowerCase();
  const types = [
    'contactor', 'relay', 'switch', 'motor starter', 'circuit breaker',
    'disconnect switch', 'push button', 'selector switch', 'pilot light',
    'terminal block', 'power supply', 'drive', 'soft starter'
  ];
  
  for (const type of types) {
    if (desc.includes(type)) {
      return type.replace(/\s+/g, '');
    }
  }
  
  return null;
}

async function analyzeGroupWithAI(group: ItemForAnalysis[]): Promise<DuplicateGroup | null> {
  try {
    const prompt = `
You are an expert industrial engineer specializing in functional equivalence analysis. Your goal is to identify items that serve the same function with identical specifications, even if they have different part numbers. Focus on FUNCTION and TECHNICAL SPECS rather than part number differences.

Items to analyze:
${group.map((item, index) => `
${index + 1}. Serial: ${item.serial_number}
   Description: ${item.description}
   Part Number: ${item.part_number}
   Line Item: ${item.line_item}
   Category: ${item.category}
`).join('')}

Return your analysis in JSON format with this structure:
{
  "isDuplicateGroup": boolean,
  "masterItemIndex": number (0-based index of the item that should be considered the master),
  "duplicateIndexes": [array of 0-based indexes of duplicate items],
  "similarity": number (0-1, how similar the items are),
  "reason": "string explaining why these are considered duplicates or not"
}

ENHANCED MATCHING CRITERIA FOR FUNCTIONAL EQUIVALENCE (in priority order):

1. LINE ITEM EXACT MATCH - If items have identical LINE ITEM codes, they are definitely duplicates (100% match)

2. FUNCTIONAL EQUIVALENCE - Items performing the same function with same specs should get same P-number:
   - Same manufacturer + same model series + same specifications = 95% match
   - Example: LC1D 32M7 and 2102049 are both Schneider 32A contactors = 90% match
   - Same voltage, amperage, power ratings, and application = 85% match

3. TECHNICAL SPECIFICATIONS PRIORITY:
   - Voltage rating (220V, 240V, etc.)
   - Current/Amperage rating (32A, 50A, etc.)
   - Power rating (15KW, 20KW, etc.)
   - Application purpose (contactor, relay, switch, etc.)
   - Brand/Manufacturer compatibility

4. PART NUMBER VARIATIONS:
   - Different part numbers for same product from same manufacturer = 90% match
   - Manufacturer's internal part number vs. catalog number = 90% match
   - Regional variations of same product = 85% match

5. DESCRIPTION SIMILARITY:
   - Same technical specs in different languages/formats = 80% match
   - Abbreviated vs. full descriptions of same item = 75% match

KEY PRINCIPLE: Focus on WHAT the item DOES and its TECHNICAL SPECIFICATIONS rather than just part number matching. Two items with different part numbers but identical function and specs should be considered the same item.

IMPORTANT: Be more generous in matching items with same functionality - we want to consolidate functionally identical items under the same P-number even if part numbers differ.
`;

    const responseContent = await callDeepSeekAPI([
      {
        role: "system",
        content: "You are an expert industrial parts analyst specializing in identifying duplicate items based on LINE ITEM, PART NUMBER, and DESCRIPTION. Always consider items with identical LINE ITEM as duplicates. Provide accurate JSON responses for duplicate detection."
      },
      {
        role: "user", 
        content: prompt
      }
    ], 0.3);

    const analysis = JSON.parse(responseContent);
    
    if (analysis.isDuplicateGroup && analysis.duplicateIndexes?.length > 0) {
      const masterItem = group[analysis.masterItemIndex] || group[0];
      const duplicates = analysis.duplicateIndexes.map((index: number) => group[index]).filter(Boolean);
      
      return {
        masterItem,
        duplicates,
        similarity: analysis.similarity || 0.8,
        reason: analysis.reason || 'AI detected similarity'
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('خطأ في تحليل مجموعة باستخدام AI:', error);
    return null;
  }
}

export async function validateItemDescription(description: string, category: string): Promise<{
  isValid: boolean;
  suggestion?: string;
  confidence: number;
}> {
  try {
    const prompt = `
Analyze this industrial item description for completeness and clarity:

Description: "${description}"
Category: "${category}"

Return JSON with:
{
  "isValid": boolean (true if description is clear and complete),
  "suggestion": "string (improved description if needed, null if not needed)",
  "confidence": number (0-1, confidence in the analysis)
}

A good description should:
- Clearly identify the item
- Include key specifications
- Be free of obvious typos
- Include relevant technical details
`;

    const responseContent = await callDeepSeekAPI([
      {
        role: "system",
        content: "You are an expert in industrial item descriptions. Provide accurate JSON responses."
      },
      {
        role: "user",
        content: prompt
      }
    ], 0.3);

    const result = JSON.parse(responseContent);
    
    return {
      isValid: result.isValid || false,
      suggestion: result.suggestion || undefined,
      confidence: result.confidence || 0.7
    };
    
  } catch (error) {
    console.error('خطأ في تحليل وصف الصنف:', error);
    return {
      isValid: true,
      confidence: 0.5
    };
  }
}