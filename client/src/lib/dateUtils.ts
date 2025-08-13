export function formatDateToEnglish(dateString: string | Date): string {
  if (!dateString) return "غير محدد";
  
  let date: Date;
  
  if (typeof dateString === 'string') {
    // تنظيف البيانات المشوهة
    const cleanDateString = dateString.replace(/[^\d/-]/g, '').trim();
    if (!cleanDateString) return "غير محدد";
    
    // محاولة تحليل التاريخ
    // إذا كان التاريخ يحتوي على أخطاء مثل "0630/2025" أو "6/630/2025"
    if (cleanDateString.includes('630') || cleanDateString.includes('06/30') || cleanDateString.includes('30/06')) {
      // تصحيح إلى 30/06
      const correctedDate = cleanDateString.replace(/0?630|06\/30|30\/06/, '30/06');
      date = new Date(correctedDate);
    } else {
      date = new Date(cleanDateString);
    }
  } else {
    date = dateString;
  }
  
  if (isNaN(date.getTime())) return "غير محدد";
  
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  // تنسيق YYYY/MM/DD
  return `${year}/${month}/${day}`;
}

export function formatDateToArabic(dateString: string | Date): string {
  if (!dateString) return "غير محدد";
  
  let date: Date;
  
  if (typeof dateString === 'string') {
    date = new Date(dateString);
  } else {
    date = dateString;
  }
  
  if (isNaN(date.getTime())) return "غير محدد";
  
  return date.toLocaleDateString('ar-EG');
}