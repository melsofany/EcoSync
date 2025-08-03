import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, UserCheck, Camera, X } from "lucide-react";
import ProfileImageUploader from "@/components/ProfileImageUploader";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSubmit: (userData: any) => void;
  isLoading: boolean;
}

export default function EditUserModal({ isOpen, onClose, user, onSubmit, isLoading }: EditUserModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    role: "",
    profileImage: "",
    isActive: true
  });

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "",
        profileImage: user.profileImage || "",
        isActive: user.isActive ?? true
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast({
        title: "خطأ في التحقق",
        description: "الاسم الكامل مطلوب",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.username.trim()) {
      toast({
        title: "خطأ في التحقق",
        description: "اسم المستخدم مطلوب",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast({
        title: "خطأ في التحقق",
        description: "البريد الإلكتروني مطلوب",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.phone.trim()) {
      toast({
        title: "خطأ في التحقق",
        description: "رقم الهاتف مطلوب",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.role) {
      toast({
        title: "خطأ في التحقق",
        description: "الدور مطلوب",
        variant: "destructive",
      });
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "خطأ في التحقق",
        description: "البريد الإلكتروني غير صحيح",
        variant: "destructive",
      });
      return false;
    }

    // Phone validation (basic format check)
    const phoneRegex = /^[0-9+\-\s()]{7,20}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      toast({
        title: "خطأ في التحقق",
        description: "رقم الهاتف غير صحيح. يجب أن يحتوي على أرقام فقط",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    // Remove password field since it's not being updated in edit mode
    const { ...updateData } = formData;
    onSubmit(updateData);
  };

  const handleClose = () => {
    setFormData({
      fullName: "",
      username: "",
      email: "",
      phone: "",
      role: "",
      profileImage: "",
      isActive: true
    });
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            تعديل المستخدم
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fullName" className="flex items-center space-x-2 space-x-reverse">
                <User className="h-4 w-4" />
                <span>الاسم الكامل *</span>
              </Label>
              <Input
                id="edit-fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                placeholder="أدخل الاسم الكامل"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-username">اسم المستخدم *</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email" className="flex items-center space-x-2 space-x-reverse">
                <Mail className="h-4 w-4" />
                <span>البريد الإلكتروني *</span>
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="example@company.com"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone" className="flex items-center space-x-2 space-x-reverse">
                <Phone className="h-4 w-4" />
                <span>رقم الهاتف *</span>
              </Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="05xxxxxxxx"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role" className="flex items-center space-x-2 space-x-reverse">
                <UserCheck className="h-4 w-4" />
                <span>الدور *</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange("role", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">مدير</SelectItem>
                  <SelectItem value="it_admin">مدير تقنية المعلومات</SelectItem>
                  <SelectItem value="data_entry">موظف إدخال بيانات</SelectItem>
                  <SelectItem value="purchasing">موظف مشتريات</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          {/* Profile Image Section */}
          <div className="space-y-2">
            <Label>الصورة الشخصية</Label>
            <div className="flex items-center gap-4">
              {/* Profile Image Preview */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden shadow-lg">
                {formData.profileImage ? (
                  <img 
                    src={formData.profileImage} 
                    alt="صورة المستخدم" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ display: formData.profileImage ? 'none' : 'flex' }}
                >
                  {formData.fullName 
                    ? formData.fullName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
                    : <Camera className="h-6 w-6" />
                  }
                </div>
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <ProfileImageUploader
                    currentImageUrl={formData.profileImage}
                    onImageUploaded={(imageUrl) => {
                      handleInputChange("profileImage", imageUrl);
                    }}
                  />
                  {formData.profileImage && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange("profileImage", "")}
                    >
                      <X className="h-4 w-4 mr-1" />
                      إزالة
                    </Button>
                  )}
                </div>
                
                <div className="text-xs text-gray-500">
                  يمكنك رفع صورة شخصية من جهازك (حد أقصى 5 ميجابايت)
                </div>
              </div>
            </div>
          </div>

          {/* User Status */}
          <div className="space-y-2">
            <Label htmlFor="edit-status">حالة المستخدم</Label>
            <Select
              value={formData.isActive ? "active" : "inactive"}
              onValueChange={(value) => handleInputChange("isActive", value === "active")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">محظور</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 space-x-reverse pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full loading-spinner ml-2"></div>
                  جاري التحديث...
                </>
              ) : (
                "تحديث المستخدم"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}