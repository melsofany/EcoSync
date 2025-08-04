import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserAvatar } from "@/components/UserAvatar";
import { UserDisplayName } from "@/components/UserDisplayName";
import PermissionsEditor from "@/components/PermissionsEditor";
import { UserPermissions, getDefaultPermissions } from "@shared/permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, FileText } from "lucide-react";

interface EditUserPermissionsModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditUserPermissionsModal({ user, isOpen, onClose }: EditUserPermissionsModalProps) {
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    role: user?.role || "data_entry",
    isActive: user?.isActive ?? true,
  });
  const [permissions, setPermissions] = useState<UserPermissions>(() => {
    if (user?.permissions) {
      try {
        return JSON.parse(user.permissions);
      } catch {
        return getDefaultPermissions(user?.role || "data_entry");
      }
    }
    return getDefaultPermissions(user?.role || "data_entry");
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const editUserMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/users/${user.id}`, {
        ...data,
        permissions: JSON.stringify(permissions)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات المستخدم والصلاحيات بنجاح",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "حدث خطأ أثناء تحديث المستخدم",
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (newRole: string) => {
    setFormData(prev => ({ ...prev, role: newRole }));
    // تحديث الصلاحيات الافتراضية عند تغيير الدور
    setPermissions(getDefaultPermissions(newRole));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editUserMutation.mutate(formData);
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      manager: "مدير",
      it_admin: "مدير تقنية المعلومات",
      data_entry: "موظف إدخال بيانات",
      purchasing: "موظف مشتريات",
      accounting: "موظف حسابات",
    };
    return roles[role] || role;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            تعديل المستخدم والصلاحيات
          </DialogTitle>
        </DialogHeader>

        {user && (
          <div className="space-y-6">
            {/* User Info Header */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <UserDisplayName 
                user={user}
                showUsername={true}
                showEmail={true}
                showPhone={true}
                avatarSize="lg"
                layout="horizontal"
                className="w-full"
              />
            </div>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  البيانات الأساسية
                </TabsTrigger>
                <TabsTrigger value="permissions" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  الصلاحيات
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">الاسم الكامل</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">الدور الوظيفي</Label>
                      <Select value={formData.role} onValueChange={handleRoleChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">مدير</SelectItem>
                          <SelectItem value="it_admin">مدير تقنية المعلومات</SelectItem>
                          <SelectItem value="data_entry">موظف إدخال بيانات</SelectItem>
                          <SelectItem value="purchasing">موظف مشتريات</SelectItem>
                          <SelectItem value="accounting">موظف حسابات</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        value={formData.phone || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">حالة الحساب</Label>
                    <Select 
                      value={formData.isActive ? "active" : "inactive"} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value === "active" }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="inactive">غير نشط</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={editUserMutation.isPending}
                      className="flex-1"
                    >
                      {editUserMutation.isPending ? "جاري التحديث..." : "تحديث البيانات"}
                    </Button>
                    <Button type="button" variant="outline" onClick={onClose}>
                      إلغاء
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="permissions" className="mt-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">معلومات الدور الحالي</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      الدور الحالي: <strong>{getRoleLabel(formData.role)}</strong>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      يمكنك تخصيص الصلاحيات حسب احتياجات المستخدم، أو استخدام الصلاحيات الافتراضية للدور
                    </p>
                  </div>

                  <PermissionsEditor
                    userRole={formData.role}
                    currentPermissions={permissions}
                    onPermissionsChange={setPermissions}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={() => editUserMutation.mutate(formData)}
                      disabled={editUserMutation.isPending}
                      className="flex-1"
                    >
                      {editUserMutation.isPending ? "جاري التحديث..." : "حفظ الصلاحيات"}
                    </Button>
                    <Button type="button" variant="outline" onClick={onClose}>
                      إلغاء
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}