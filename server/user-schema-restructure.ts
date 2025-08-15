import { userSheetsManager } from './user-sheets-manager.js';

// إعادة هيكلة ورقة USERS لتناسب النظام بشكل أفضل
export async function restructureUserSheet() {
  try {
    console.log('🔧 بدء إعادة هيكلة ورقة USERS...');

    // إنشاء ورقة جديدة بالعناوين المحسّنة
    const result = await userSheetsManager.createUserSheet();

    if (result) {
      console.log('✅ تم إعادة هيكلة ورقة USERS بنجاح');
      console.log('📊 العناوين الجديدة:');
      console.log('   A: ID - معرف المستخدم الفريد');
      console.log('   B: USERNAME - اسم المستخدم (للتسجيل)');
      console.log('   C: PASSWORD - كلمة المرور المشفرة');
      console.log('   D: FULL_NAME - الاسم الكامل');
      console.log('   E: EMAIL - البريد الإلكتروني');
      console.log('   F: PHONE - رقم الهاتف');
      console.log('   G: PROFILE_IMAGE - رابط الصورة الشخصية');
      console.log('   H: ROLE - الدور (manager, it_admin, data_entry, purchasing, accounting)');
      console.log('   I: PERMISSIONS - الصلاحيات (JSON)');
      console.log('   J: IS_ACTIVE - نشط (TRUE/FALSE)');
      console.log('   K: IS_ONLINE - متصل الآن (TRUE/FALSE)');
      console.log('   L: LAST_LOGIN - آخر تسجيل دخول');
      console.log('   M: LAST_ACTIVITY - آخر نشاط');
      console.log('   N: IP_ADDRESS - عنوان IP الأخير');
      console.log('   O: CREATED_AT - تاريخ الإنشاء');
      console.log('   P: UPDATED_AT - تاريخ آخر تحديث');

      return {
        success: true,
        message: 'تم إعادة هيكلة ورقة USERS بنجاح',
        columns: {
          'A': 'ID',
          'B': 'USERNAME', 
          'C': 'PASSWORD',
          'D': 'FULL_NAME',
          'E': 'EMAIL',
          'F': 'PHONE',
          'G': 'PROFILE_IMAGE',
          'H': 'ROLE',
          'I': 'PERMISSIONS',
          'J': 'IS_ACTIVE',
          'K': 'IS_ONLINE',
          'L': 'LAST_LOGIN',
          'M': 'LAST_ACTIVITY',
          'N': 'IP_ADDRESS',
          'O': 'CREATED_AT',
          'P': 'UPDATED_AT'
        }
      };
    }

    throw new Error('فشل في إعادة الهيكلة');
  } catch (error) {
    console.error('❌ خطأ في إعادة هيكلة ورقة المستخدمين:', error);
    return {
      success: false,
      message: 'فشل في إعادة هيكلة ورقة USERS',
      error: (error as Error).message
    };
  }
}