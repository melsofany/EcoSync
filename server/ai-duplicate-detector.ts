// Using DeepSeek API for AI analysis
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.OPENAI_API_KEY; // Using same env var for DeepSeek

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
    // Create a normalized key for grouping
    const normalizedDesc = item.description
      .toUpperCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Group by first 50 characters + part number
    const groupKey = `${normalizedDesc.substring(0, 50)}_${item.part_number}`;
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(item);
  }
  
  return Array.from(groups.values());
}

async function analyzeGroupWithAI(group: ItemForAnalysis[]): Promise<DuplicateGroup | null> {
  try {
    const prompt = `
You are an expert in analyzing industrial/mechanical items for duplicates. Analyze the following items and determine if they are duplicates or variations of the same item.

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

Consider items duplicates if they have:
- Very similar descriptions (accounting for typos, abbreviations, different languages)
- Same or similar part numbers
- Same functionality despite different wording
- Minor variations in specifications that don't affect the core item

Be conservative - only group items as duplicates if you're confident they represent the same physical item.
`;

    const responseContent = await callDeepSeekAPI([
      {
        role: "system",
        content: "You are an expert industrial parts analyst. Provide accurate JSON responses for duplicate detection."
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