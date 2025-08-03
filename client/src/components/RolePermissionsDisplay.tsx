import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRolePermissionSummary, UserRole } from "@/lib/permissions";
import { Shield, CheckCircle, XCircle } from "lucide-react";

interface RolePermissionsDisplayProps {
  userRole: UserRole;
  title?: string;
}

const getRoleTitle = (role: UserRole): string => {
  const titles: Record<UserRole, string> = {
    manager: "مدير",
    it_admin: "مدير تقنية المعلومات",
    data_entry: "موظف إدخال البيانات",
    purchasing: "موظف المشتريات"
  };
  return titles[role];
};

const getRoleBadgeColor = (role: UserRole): string => {
  const colors: Record<UserRole, string> = {
    manager: "bg-purple-100 text-purple-800 border-purple-200",
    it_admin: "bg-blue-100 text-blue-800 border-blue-200",
    data_entry: "bg-green-100 text-green-800 border-green-200",
    purchasing: "bg-orange-100 text-orange-800 border-orange-200"
  };
  return colors[role];
};

export function RolePermissionsDisplay({ userRole, title = "صلاحيات الدور" }: RolePermissionsDisplayProps) {
  const permissions = getRolePermissionSummary(userRole);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-3 space-x-reverse">
          <Shield className="h-5 w-5" />
          <span>{title}</span>
        </CardTitle>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Badge className={getRoleBadgeColor(userRole)}>
            {getRoleTitle(userRole)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {permissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <XCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>لا توجد صلاحيات محددة لهذا الدور</p>
            </div>
          ) : (
            permissions.map((perm, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center space-x-2 space-x-reverse mb-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <h4 className="font-medium text-gray-800">{perm.resource}</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {perm.permissions.map((permission, permIndex) => (
                    <Badge
                      key={permIndex}
                      variant="secondary"
                      className="text-xs bg-gray-100 text-gray-700"
                    >
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
        
        {userRole === 'data_entry' && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-800 mb-2">ملاحظات هامة لموظف إدخال البيانات:</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• يمكن إنشاء وتعديل البيانات ولكن لا يمكن حذفها</li>
              <li>• لا يمكن تصدير أو استيراد البيانات</li>
              <li>• لا يمكن الوصول إلى إدارة المستخدمين أو إعدادات النظام</li>
              <li>• التقارير متاحة للعرض فقط دون تصدير</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}