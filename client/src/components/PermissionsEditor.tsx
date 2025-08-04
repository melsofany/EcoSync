import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Shield, Users, Database, FileText, Package, Building, ShoppingCart, DollarSign, BarChart3, Settings } from "lucide-react";
import { 
  PERMISSIONS, 
  CATEGORY_NAMES, 
  getPermissionsByCategory, 
  UserPermissions, 
  getDefaultPermissions,
  hasPermission 
} from "@shared/permissions";
import { cn } from "@/lib/utils";

interface PermissionsEditorProps {
  userRole: string;
  currentPermissions: string | UserPermissions;
  onPermissionsChange: (permissions: UserPermissions) => void;
  disabled?: boolean;
}

const CATEGORY_ICONS: Record<string, any> = {
  dashboard: BarChart3,
  quotations: FileText,
  items: Package,
  clients: Building,
  suppliers: Building,
  purchase_orders: ShoppingCart,
  pricing: DollarSign,
  reports: BarChart3,
  users: Users,
  system: Settings,
};

export default function PermissionsEditor({ 
  userRole, 
  currentPermissions, 
  onPermissionsChange, 
  disabled = false 
}: PermissionsEditorProps) {
  const [permissions, setPermissions] = useState<UserPermissions>(() => {
    if (typeof currentPermissions === 'string') {
      try {
        return JSON.parse(currentPermissions);
      } catch {
        return getDefaultPermissions(userRole);
      }
    }
    return currentPermissions || getDefaultPermissions(userRole);
  });

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const permissionsByCategory = getPermissionsByCategory();

  useEffect(() => {
    onPermissionsChange(permissions);
  }, [permissions, onPermissionsChange]);

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (disabled) return;
    
    setPermissions(prev => ({
      ...prev,
      [permissionId]: checked
    }));
  };

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const selectAllInCategory = (category: string, checked: boolean) => {
    if (disabled) return;
    
    const categoryPermissions = permissionsByCategory[category];
    const updates: Partial<UserPermissions> = {};
    
    categoryPermissions.forEach(perm => {
      updates[perm.id as keyof UserPermissions] = checked;
    });
    
    setPermissions(prev => ({
      ...prev,
      ...updates
    }));
  };

  const getCategoryStats = (category: string) => {
    const categoryPermissions = permissionsByCategory[category];
    const enabledCount = categoryPermissions.filter(perm => 
      permissions[perm.id as keyof UserPermissions]
    ).length;
    
    return {
      enabled: enabledCount,
      total: categoryPermissions.length,
      allEnabled: enabledCount === categoryPermissions.length,
      someEnabled: enabledCount > 0 && enabledCount < categoryPermissions.length
    };
  };

  const resetToDefault = () => {
    if (disabled) return;
    setPermissions(getDefaultPermissions(userRole));
  };

  const enableAll = () => {
    if (disabled) return;
    const allEnabled: UserPermissions = {} as UserPermissions;
    PERMISSIONS.forEach(perm => {
      allEnabled[perm.id as keyof UserPermissions] = true;
    });
    setPermissions(allEnabled);
  };

  const disableAll = () => {
    if (disabled) return;
    const allDisabled: UserPermissions = {} as UserPermissions;
    PERMISSIONS.forEach(perm => {
      allDisabled[perm.id as keyof UserPermissions] = false;
    });
    setPermissions(allDisabled);
  };

  return (
    <div className="space-y-4">
      {/* Header with Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">صلاحيات المستخدم</h3>
        </div>
        
        {!disabled && (
          <div className="flex gap-2">
            <button
              onClick={resetToDefault}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              الافتراضي للدور
            </button>
            <button
              onClick={enableAll}
              className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors"
            >
              تفعيل الكل
            </button>
            <button
              onClick={disableAll}
              className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
            >
              إلغاء الكل
            </button>
          </div>
        )}
      </div>

      {/* Permissions by Category */}
      <div className="space-y-3">
        {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => {
          const stats = getCategoryStats(category);
          const Icon = CATEGORY_ICONS[category] || Settings;
          const isOpen = openCategories[category];

          return (
            <Card key={category} className="overflow-hidden">
              <Collapsible open={isOpen} onOpenChange={() => toggleCategory(category)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )}
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {CATEGORY_NAMES[category]}
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            {stats.enabled} من {stats.total} مفعلة
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={stats.allEnabled ? "default" : stats.someEnabled ? "secondary" : "outline"}>
                          {stats.enabled}/{stats.total}
                        </Badge>
                        
                        {!disabled && (
                          <Checkbox
                            checked={stats.allEnabled}
                            onCheckedChange={(checked) => selectAllInCategory(category, !!checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4">
                    <div className="grid gap-3">
                      {categoryPermissions.map((permission) => {
                        const isEnabled = permissions[permission.id as keyof UserPermissions];
                        
                        return (
                          <div
                            key={permission.id}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                              isEnabled ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200",
                              disabled && "opacity-60"
                            )}
                          >
                            <Checkbox
                              checked={isEnabled}
                              onCheckedChange={(checked) => handlePermissionChange(permission.id, !!checked)}
                              disabled={disabled}
                              className="mt-0.5"
                            />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className={cn(
                                  "font-medium text-sm",
                                  isEnabled ? "text-blue-900" : "text-gray-700"
                                )}>
                                  {permission.name}
                                </h4>
                                {isEnabled && (
                                  <Badge variant="secondary" className="text-xs">
                                    مفعل
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <Shield className="h-4 w-4" />
            <span className="font-medium text-sm">
              إجمالي الصلاحيات المفعلة: {Object.values(permissions).filter(Boolean).length} من {PERMISSIONS.length}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}