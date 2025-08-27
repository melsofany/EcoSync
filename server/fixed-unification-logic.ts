// منطق التوحيد الصحيح - البدء من الصف الأول ومقارنته مع كل البنود

interface UnificationItem {
  rowIndex: number;
  lineItem: string;
  partNumber: string;
  description: string;
  currentId?: string;
}

interface UnificationGroup {
  masterId: string;
  items: UnificationItem[];
  masterPartNumber: string;
  masterDescription: string;
}

// الدالة الرئيسية للتجميع
export async function performCorrectUnification(
  items: UnificationItem[],
  areItemsSimilar: (item1: UnificationItem, item2: UnificationItem) => Promise<boolean>
): Promise<UnificationGroup[]> {
  const groups: UnificationGroup[] = [];
  const processedRowIndices = new Set<number>();
  let nextGroupId = 1;

  console.log(`🔍 بدء المعالجة الشاملة لـ ${items.length} بند...`);

  // معالجة كل صف بالترتيب من الأول للأخير
  for (let i = 0; i < items.length; i++) {
    // تخطي الصفوف التي تمت معالجتها بالفعل
    if (processedRowIndices.has(items[i].rowIndex)) {
      continue;
    }

    const masterItem = items[i];
    
    // إنشاء معرف جديد للمجموعة
    const groupId = `P-${nextGroupId.toString().padStart(7, '0')}`;
    nextGroupId++;
    
    // إنشاء مجموعة جديدة
    const group: UnificationGroup = {
      masterId: groupId,
      items: [masterItem],
      masterPartNumber: masterItem.partNumber,
      masterDescription: masterItem.description
    };

    // وضع علامة على هذا الصف كمُعالج
    processedRowIndices.add(masterItem.rowIndex);

    // البحث عن كل الصفوف المشابهة في البيانات بأكملها
    for (let j = i + 1; j < items.length; j++) {
      // تخطي الصفوف التي تمت معالجتها
      if (processedRowIndices.has(items[j].rowIndex)) {
        continue;
      }

      const compareItem = items[j];
      
      // المقارنة بناءً على المعايير الثلاثة
      const isSimilar = await areItemsSimilar(masterItem, compareItem);
      
      if (isSimilar) {
        // إضافة العنصر المشابه للمجموعة
        group.items.push(compareItem);
        processedRowIndices.add(compareItem.rowIndex);
        
        // تحديث الوصف الرئيسي إذا كان الوصف الجديد أفضل
        if (compareItem.description && compareItem.description.length > group.masterDescription.length) {
          group.masterDescription = compareItem.description;
        }
        
        console.log(`🔗 تم ربط الصف ${compareItem.rowIndex} مع الصف ${masterItem.rowIndex} في المجموعة ${groupId}`);
      }
    }

    // إضافة المجموعة للقائمة
    groups.push(group);

    // تسجيل معلومات المجموعة
    if (group.items.length > 1) {
      console.log(`📦 المجموعة ${group.masterId}: تحتوي على ${group.items.length} بند متشابه (الصفوف: ${group.items.map(item => item.rowIndex).join(', ')})`);
    } else {
      console.log(`📌 البند ${group.masterId}: بند فريد في الصف ${masterItem.rowIndex}`);
    }
  }

  const totalItems = items.length;
  const totalGroups = groups.length;
  const totalDuplicates = items.length - groups.length;
  
  console.log(`✅ تم إنشاء ${totalGroups} مجموعة فريدة من إجمالي ${totalItems} بند`);
  console.log(`📊 تم توحيد ${totalDuplicates} بند مكرر`);

  return groups;
}

// مثال على دالة المقارنة التي يجب أن تستخدم المعايير الثلاثة
export function compareItemsByThreeCriteria(item1: UnificationItem, item2: UnificationItem): boolean {
  // 1. مطابقة LINE ITEM (الأولوية الأعلى)
  if (item1.lineItem && item2.lineItem) {
    const clean1 = item1.lineItem.trim().toUpperCase().replace(/\s+/g, '');
    const clean2 = item2.lineItem.trim().toUpperCase().replace(/\s+/g, '');
    if (clean1 === clean2 && clean1.length > 5) {
      console.log(`✅ تطابق LINE ITEM: ${clean1}`);
      return true;
    }
  }
  
  // 2. مطابقة PART NUMBER
  if (item1.partNumber && item2.partNumber) {
    const clean1 = normalizePartNumber(item1.partNumber);
    const clean2 = normalizePartNumber(item2.partNumber);
    if (clean1 === clean2 && clean1.length > 3) {
      console.log(`✅ تطابق PART NUMBER: ${clean1}`);
      return true;
    }
  }
  
  // 3. مطابقة الوصف (فقط إذا كان متطابقاً جداً)
  if (!item1.lineItem && !item2.lineItem && !item1.partNumber && !item2.partNumber) {
    if (item1.description && item2.description) {
      const similarity = calculateSimilarity(item1.description, item2.description);
      if (similarity > 0.95) {
        console.log(`✅ تطابق الوصف بنسبة ${(similarity * 100).toFixed(0)}%`);
        return true;
      }
    }
  }
  
  return false;
}

function normalizePartNumber(partNumber: string): string {
  return partNumber
    .trim()
    .toUpperCase()
    .replace(/[\s\-_\.\/\\]/g, '')
    .replace(/[^\w\d]/g, '');
}

function calculateSimilarity(text1: string, text2: string): number {
  const normalized1 = text1.trim().toUpperCase().replace(/\s+/g, ' ');
  const normalized2 = text2.trim().toUpperCase().replace(/\s+/g, ' ');
  
  if (normalized1 === normalized2) return 1;
  
  const words1 = normalized1.split(' ').filter(w => w.length > 2);
  const words2 = normalized2.split(' ').filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  let commonWords = 0;
  for (const word of words1) {
    if (words2.includes(word)) commonWords++;
  }
  
  return commonWords / Math.max(words1.length, words2.length);
}