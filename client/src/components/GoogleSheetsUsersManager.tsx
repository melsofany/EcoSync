import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  EyeOff,
  Shield,
  Calendar,
  Mail,
  Building
} from "lucide-react";

interface GoogleSheetsUser {
  username: string;
  fullName: string;
  email: string;
  role: string;
  plainPassword: string;
  hashedPassword: string;
  department: string;
  status: string;
  lastLogin: string;
  createdAt: string;
  permissions: string;
}

export default function GoogleSheetsUsersManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPasswords, setShowPasswords] = useState(false);

  const { data: users, isLoading, error } = useQuery({
    queryKey: ["/api/users/google-sheets"],
    retry: 1
  });

  const syncMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/users/sync-google-sheets"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/google-sheets"] });
      toast({
        title: "تم مزامنة المستخدمين",
        description: "تم مزامنة المستخدمين مع قاعدة البيانات بنجاح"
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في المزامنة",
        description: error.message || "فشل في مزامنة المستخدمين",
        variant: "destructive"
      });
    }
  });

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      'manager': { label: 'مدير', color: 'bg-blue-500' },
      'it_admin': { label: 'مدير تقنية', color: 'bg-green-500' },
      'data_entry': { label: 'إدخال بيانات', color: 'bg-orange-500' },
      'purchasing': { label: 'مشتريات', color: 'bg-purple-500' },
      'accounting': { label: 'محاسبة', color: 'bg-yellow-500' }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || { label: role, color: 'bg-gray-500' };
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === 'نشط' ? 'default' : 'destructive'}>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin ml-2" />
        <span>جاري تحميل المستخدمين...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">
          ❌ خطأ في تحميل المستخدمين من Google Sheets
        </div>
        <Button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/users/google-sheets"] })}
          className="bg-blue-500 hover:bg-blue-600"
        >
          <RefreshCw className="h-4 w-4 ml-2" />
          إعادة تحميل
        </Button>
      </div>
    );
  }

  const usersArray = Array.isArray(users) ? users : [];

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Users className="h-5 w-5 text-green-600" />
            <span className="font-semibold">مستخدمو Google Sheets</span>
            <Badge variant="outline">{usersArray.length} مستخدم</Badge>
          </div>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPasswords(!showPasswords)}
          >
            {showPasswords ? (
              <>
                <EyeOff className="h-4 w-4 ml-2" />
                إخفاء كلمات المرور
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 ml-2" />
                عرض كلمات المرور
              </>
            )}
          </Button>

          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <RefreshCw className="h-4 w-4 ml-2" />
            )}
            مزامنة
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستخدم</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>القسم</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>آخر دخول</TableHead>
                {showPasswords && <TableHead>كلمة المرور</TableHead>}
                <TableHead>الصلاحيات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersArray.map((user: GoogleSheetsUser, index: number) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{user.fullName}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <span className="ml-2">@{user.username}</span>
                      </div>
                      <div className="text-xs text-gray-400 flex items-center">
                        <Mail className="h-3 w-3 ml-1" />
                        {user.email}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Shield className="h-4 w-4 text-gray-400" />
                      {getRoleBadge(user.role)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-400 ml-2" />
                      {user.department}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(user.status)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 ml-2" />
                      {user.lastLogin}
                    </div>
                  </TableCell>

                  {showPasswords && (
                    <TableCell>
                      <div className="font-mono text-sm bg-gray-100 p-2 rounded border">
                        {user.plainPassword}
                      </div>
                    </TableCell>
                  )}
                  
                  <TableCell>
                    <div className="text-xs text-gray-600 max-w-xs">
                      {user.permissions}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {usersArray.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>لا يوجد مستخدمين في Google Sheets</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{usersArray.length}</div>
                <div className="text-sm text-gray-500">إجمالي المستخدمين</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {usersArray.filter((u: GoogleSheetsUser) => u.status === 'نشط').length}
                </div>
                <div className="text-sm text-gray-500">المستخدمين النشطين</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Building className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {new Set(usersArray.map((u: GoogleSheetsUser) => u.department)).size}
                </div>
                <div className="text-sm text-gray-500">الأقسام</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Shield className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">
                  {new Set(usersArray.map((u: GoogleSheetsUser) => u.role)).size}
                </div>
                <div className="text-sm text-gray-500">الأدوار</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}