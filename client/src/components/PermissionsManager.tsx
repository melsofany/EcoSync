import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AVAILABLE_PERMISSIONS, 
  UserPermissions, 
  getUserPermissions,
  DEFAULT_ROLE_PERMISSIONS 
} from "../../../shared/permissions";
import { Shield, CheckCircle, XCircle, RotateCcw } from "lucide-react";

interface PermissionsManagerProps {
  user: any;
  onPermissionsChange: (permissions: UserPermissions) => void;
  disabled?: boolean;
}

export default function PermissionsManager({ 
  user, 
  onPermissionsChange, 
  disabled = false 
}: PermissionsManagerProps) {
  const [permissions, setPermissions] = useState<UserPermissions>(getUserPermissions(user));
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const userPermissions = getUserPermissions(user);
    setPermissions(userPermissions);
    setHasChanges(false);
  }, [user]);

  const handlePermissionChange = (permissionPath: string, value: boolean) => {
    const newPermissions = { ...permissions };
    const keys = permissionPath.split('.');
    
    let current: any = newPermissions;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setPermissions(newPermissions);
    setHasChanges(true);
    onPermissionsChange(newPermissions);
  };

  const resetToDefaults = () => {
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[user.role];
    if (defaultPermissions) {
      setPermissions(defaultPermissions as UserPermissions);
      setHasChanges(true);
      onPermissionsChange(defaultPermissions as UserPermissions);
    }
  };

  const getPermissionValue = (permissionPath: string): boolean => {
    const keys = permissionPath.split('.');
    let current: any = permissions;
    
    for (const key of keys) {
      if (current[key] === undefined) {
        return false;
      }
      current = current[key];
    }
    
    return current === true;
  };

  // تجميع الصلاحيات حسب الفئة
  const permissionsByCategory = AVAILABLE_PERMISSIONS.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_PERMISSIONS>);

  const getRoleLabel = (role: string) => {
    const roles = {
      manager: "مدير",
      it_admin: "مدير تقنية المعلومات",
      data_entry: "موظف إدخال بيانات",
      purchasing: "موظف مشتريات",
      accounting: "موظف حسابات",
    };
    return roles[role as keyof typeof roles] || role;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Shield className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle className="text-lg">إدارة صلاحيات {user.fullName}</CardTitle>
              <div className="flex items-center space-x-2 space-x-reverse mt-1">
                <Badge variant="outline" className="text-xs">
                  {getRoleLabel(user.role)}
                </Badge>
                {hasChanges && (
                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                    يوجد تغييرات غير محفوظة
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            disabled={disabled}
            className="flex items-center space-x-2 space-x-reverse"
          >
            <RotateCcw className="h-4 w-4" />
            <span>إعادة تعيين للافتراضي</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-96 w-full">
          <div className="space-y-6">
            {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <h3 className="font-semibold text-gray-900">{category}</h3>
                  <Separator className="flex-1" />
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {categoryPermissions.map((permission) => {
                    const isChecked = getPermissionValue(permission.id);
                    
                    return (
                      <div
                        key={permission.id}
                        className="flex items-start space-x-3 space-x-reverse p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                      >
                        <Checkbox
                          id={permission.id}
                          checked={isChecked}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(permission.id, checked as boolean)
                          }
                          disabled={disabled}
                          className="mt-1"
                        />
                        
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <label
                              htmlFor={permission.id}
                              className="text-sm font-medium text-gray-900 cursor-pointer"
                            >
                              {permission.name}
                            </label>
                            {isChecked ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600">
                            {permission.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {hasChanges && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center space-x-2 space-x-reverse text-amber-800">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">
                يوجد تغييرات غير محفوظة في الصلاحيات
              </span>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              اضغط على "حفظ التغييرات" لتطبيق الصلاحيات الجديدة
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}