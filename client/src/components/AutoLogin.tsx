import React from "react";

interface AutoLoginProps {
  children?: React.ReactNode;
}

// تم إلغاء التسجيل التلقائي لحل مشكلة الحلقة اللا نهائية
export default function AutoLogin({ children }: AutoLoginProps) {
  return <>{children}</>;
}

// إضافة تصدير باسم AutoLogin أيضاً للتوافق
export { AutoLogin as AutoLoginComponent };