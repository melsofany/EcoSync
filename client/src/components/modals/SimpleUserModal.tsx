import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SimpleUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimpleUserModal({ isOpen, onClose }: SimpleUserModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
    phone: "",
    role: "",
    isActive: true
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/users", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "تم إنشاء المستخدم",
        description: `تم إنشاء المستخدم ${data.username} بنجاح`,
      });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء المستخدم",
        description: error.message || "حدث خطأ أثناء إنشاء المستخدم",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      fullName: "",
      email: "",
      phone: "",
      role: "",
      isActive: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password || !formData.fullName || !formData.role) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate(formData);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">إضافة مستخدم جديد</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-1">اسم المستخدم *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="اسم المستخدم للدخول"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1">كلمة المرور *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="كلمة مرور قوية"
                required
              />
            </div>

            {/* Full Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">الاسم الكامل *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="الاسم الكامل للموظف"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="example@company.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="01xxxxxxxxx"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium mb-1">الدور والصلاحيات *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">اختر دور المستخدم</option>
                <option value="manager">مدير</option>
                <option value="it_admin">مدير تقنية المعلومات</option>
                <option value="data_entry">موظف إدخال بيانات</option>
                <option value="purchasing">موظف مشتريات</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-1">حالة المستخدم</label>
              <select
                value={formData.isActive ? "active" : "inactive"}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === "active" }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
          </div>

          {/* Role Description */}
          {formData.role && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">صلاحيات هذا الدور:</h4>
              <div className="text-sm text-blue-700">
                {formData.role === "manager" && (
                  <ul className="space-y-1">
                    <li>• جميع الصلاحيات في النظام</li>
                    <li>• إدارة المستخدمين والأدوار</li>
                    <li>• عرض التقارير المالية والإدارية</li>
                    <li>• الوصول لجميع البيانات</li>
                  </ul>
                )}
                {formData.role === "it_admin" && (
                  <ul className="space-y-1">
                    <li>• إدارة المستخدمين وحظرهم</li>
                    <li>• إعدادات النظام والأمان</li>
                    <li>• النسخ الاحتياطية</li>
                    <li>• مراقبة أداء النظام</li>
                  </ul>
                )}
                {formData.role === "data_entry" && (
                  <ul className="space-y-1">
                    <li>• إدخال طلبات التسعير</li>
                    <li>• إدارة الأصناف</li>
                    <li>• التقارير الأساسية</li>
                    <li>• إنشاء أوامر الشراء</li>
                  </ul>
                )}
                {formData.role === "purchasing" && (
                  <ul className="space-y-1">
                    <li>• عرض أوامر الشراء وحالتها</li>
                    <li>• عرض التقارير والإحصائيات</li>
                    <li>• لا يمكن رؤية الأسعار</li>
                    <li>• متابعة حالة الطلبات</li>
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={createUserMutation.isPending}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={createUserMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {createUserMutation.isPending ? "جاري الإنشاء..." : "إنشاء المستخدم"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}