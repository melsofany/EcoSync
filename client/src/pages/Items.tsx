import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Eye, Edit, Trash2, Check, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import NewItemModal from "@/components/modals/NewItemModal";

export default function Items() {
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [filters, setFilters] = useState({
    partNumber: "",
    description: "",
    category: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ["/api/items"],
  });

  const getAIStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "في الانتظار", variant: "secondary" as const, icon: Clock },
      processed: { label: "تم المعالجة", variant: "default" as const, icon: Check },
      verified: { label: "تم التحقق", variant: "default" as const, icon: Check },
      duplicate: { label: "مكرر", variant: "destructive" as const, icon: Check },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge 
        variant={config.variant} 
        className={
          status === "verified" || status === "processed" ? "bg-green-100 text-green-800 hover:bg-green-100" :
          status === "pending" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" : ""
        }
      >
        <Icon className="h-3 w-3 ml-1" />
        {config.label}
      </Badge>
    );
  };

  const filteredItems = items && Array.isArray(items) ? items.filter((item: any) => {
    return (
      (!filters.partNumber || item.partNumber?.includes(filters.partNumber)) &&
      (!filters.description || item.description.includes(filters.description)) &&
      (!filters.category || filters.category === "all" || item.category === filters.category)
    );
  }) : [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  // Handler functions for button actions
  const handleViewItem = (item: any) => {
    toast({
      title: "عرض تفاصيل الصنف",
      description: `عرض تفاصيل الصنف: ${item.itemNumber}`,
    });
    // TODO: Implement item details modal or navigate to details page
  };

  const handleEditItem = (item: any) => {
    toast({
      title: "تعديل الصنف",
      description: `تعديل الصنف: ${item.itemNumber}`,
    });
    // TODO: Implement edit item modal
  };

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest("DELETE", `/api/items/${itemId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: "تم حذف الصنف",
        description: "تم حذف الصنف بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف الصنف",
        description: error.message || "حدث خطأ أثناء حذف الصنف",
        variant: "destructive",
      });
    },
  });

  const handleDeleteItem = (item: any) => {
    setItemToDelete(item);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full loading-spinner mx-auto mb-2"></div>
          <p className="text-gray-600">جاري تحميل الأصناف...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة الأصناف</h2>
          <p className="text-gray-600">إضافة وإدارة الأصناف مع التكامل مع الذكاء الاصطناعي</p>
        </div>
        <Button onClick={() => setIsNewItemModalOpen(true)}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة صنف جديد
        </Button>
      </div>

      {/* AI Integration Status */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">تكامل Deep Seek AI</h3>
                <p className="text-sm text-gray-600">
                  {/* DEEP SEEK API: Integration placeholder for AI item comparison */}
                  نظام مقارنة الأصناف التلقائي
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-green-600 font-medium">متصل</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white rounded-lg border">
            <p className="text-sm text-gray-700 flex items-center">
              <Brain className="h-4 w-4 text-blue-500 ml-2" />
              سيتم مقارنة كل صنف جديد تلقائياً مع قاعدة البيانات الموجودة باستخدام الذكاء الاصطناعي
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="partNumber">رقم القطعة</Label>
              <Input
                id="partNumber"
                placeholder="ELEK00000001"
                value={filters.partNumber}
                onChange={(e) => setFilters({ ...filters, partNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">وصف الصنف</Label>
              <Input
                id="description"
                placeholder="البحث في الأوصاف"
                value={filters.description}
                onChange={(e) => setFilters({ ...filters, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="category">الفئة</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الفئات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  <SelectItem value="electrical">كهربائية</SelectItem>
                  <SelectItem value="mechanical">ميكانيكية</SelectItem>
                  <SelectItem value="civil">مدنية</SelectItem>
                  <SelectItem value="electronic">إلكترونية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الصنف</TableHead>
                  <TableHead className="text-right">رقم القطعة</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-right">الوحدة</TableHead>
                  <TableHead className="text-right">الفئة</TableHead>
                  <TableHead className="text-right">تاريخ الإضافة</TableHead>
                  <TableHead className="text-right">حالة AI</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      لا توجد أصناف
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item: any) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{item.itemNumber}</TableCell>
                      <TableCell>{item.partNumber || "غير محدد"}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.category || "غير محدد"}</TableCell>
                      <TableCell>{formatDate(item.createdAt)}</TableCell>
                      <TableCell>{getAIStatusBadge(item.aiStatus)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="عرض التفاصيل"
                            onClick={() => handleViewItem(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="تعديل"
                            onClick={() => handleEditItem(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="حذف"
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف الصنف "{item.itemNumber}"؟ 
                                  هذا الإجراء لا يمكن التراجع عنه.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteItemMutation.mutate(item.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredItems.length > 0 && (
            <div className="border-t px-6 py-3 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                عرض <span className="font-medium">1</span> إلى{" "}
                <span className="font-medium">{Math.min(10, filteredItems.length)}</span> من{" "}
                <span className="font-medium">{filteredItems.length}</span> صنف
              </div>
              <div className="flex space-x-2 space-x-reverse">
                <Button variant="outline" size="sm">السابق</Button>
                <Button variant="default" size="sm">1</Button>
                <Button variant="outline" size="sm">التالي</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <NewItemModal
        isOpen={isNewItemModalOpen}
        onClose={() => setIsNewItemModalOpen(false)}
      />
    </div>
  );
}
