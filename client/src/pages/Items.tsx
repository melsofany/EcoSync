import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Eye, Edit, Trash2, Check, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import NewItemModal from "@/components/modals/NewItemModal";

// Edit form schema
const editItemSchema = z.object({
  partNumber: z.string().optional(),
  lineItem: z.string().optional(),
  description: z.string().min(1, "وصف الصنف مطلوب"),
  unit: z.string().min(1, "الوحدة مطلوبة"),
  category: z.string().optional(),
});

type EditItemForm = z.infer<typeof editItemSchema>;

// Edit Item Form Component
function EditItemForm({ item, onClose, onSuccess }: { item: any, onClose: () => void, onSuccess: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditItemForm>({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
      partNumber: item.partNumber || "",
      lineItem: item.lineItem || "",
      description: item.description || "",
      unit: item.unit || "",
      category: item.category || "",
    },
  });

  const units = [
    "Each", "Piece", "Meter", "Carton", "Feet", "Kit", "Packet", "Reel", "Set"
  ];

  const categories = [
    { value: "electrical", label: "كهربائية" },
    { value: "mechanical", label: "ميكانيكية" },
    { value: "civil", label: "مدنية" },
    { value: "plumbing", label: "صحية" },
    { value: "hvac", label: "تكييف وتهوية" },
  ];

  const updateItemMutation = useMutation({
    mutationFn: async (data: EditItemForm) => {
      const response = await apiRequest("PATCH", `/api/items/${item.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث الصنف",
        description: "تم تحديث بيانات الصنف بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحديث الصنف",
        description: error.message || "حدث خطأ أثناء تحديث الصنف",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditItemForm) => {
    updateItemMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="partNumber">رقم القطعة</Label>
          <Input
            id="partNumber"
            {...form.register("partNumber")}
            placeholder="أدخل رقم القطعة"
          />
        </div>
        <div>
          <Label htmlFor="lineItem">رقم السطر</Label>
          <Input
            id="lineItem"
            {...form.register("lineItem")}
            placeholder="أدخل رقم السطر"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">وصف الصنف *</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          placeholder="أدخل وصف مفصل للصنف"
          rows={3}
        />
        {form.formState.errors.description && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="unit">الوحدة *</Label>
          <Select
            value={form.watch("unit")}
            onValueChange={(value) => form.setValue("unit", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الوحدة" />
            </SelectTrigger>
            <SelectContent>
              {units.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.unit && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.unit.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="category">الفئة</Label>
          <Select
            value={form.watch("category")}
            onValueChange={(value) => form.setValue("category", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الفئة" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={updateItemMutation.isPending}
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          disabled={updateItemMutation.isPending}
        >
          {updateItemMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
        </Button>
      </div>
    </form>
  );
}

export default function Items() {
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
    setSelectedItem(item);
    setShowItemDetails(true);
  };

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
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
      console.error('Delete item error:', error);
      toast({
        title: "خطأ في حذف الصنف",
        description: error.message?.includes('foreign key') 
          ? "لا يمكن حذف هذا الصنف لأنه مرتبط بعروض أسعار موجودة" 
          : error.message || "حدث خطأ أثناء حذف الصنف",
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
                <Check className="h-6 w-6 text-purple-600" />
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
              <Check className="h-4 w-4 text-blue-500 ml-2" />
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

      {/* Item Details Modal */}
      {selectedItem && (
        <Dialog open={showItemDetails} onOpenChange={setShowItemDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تفاصيل الصنف</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">رقم الصنف</Label>
                  <p className="text-lg font-semibold">{selectedItem.itemNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">رقم القطعة</Label>
                  <p className="text-lg">{selectedItem.partNumber || "غير محدد"}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">الوصف</Label>
                <p className="text-lg">{selectedItem.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">الوحدة</Label>
                  <p className="text-lg">{selectedItem.unit}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">الفئة</Label>
                  <p className="text-lg">{selectedItem.category || "غير محدد"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">حالة AI</Label>
                  <div className="mt-1">
                    {getAIStatusBadge(selectedItem.aiStatus)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">تاريخ الإضافة</Label>
                  <p className="text-lg">{formatDate(selectedItem.createdAt)}</p>
                </div>
              </div>

              {selectedItem.lineItem && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">رقم السطر</Label>
                  <p className="text-lg">{selectedItem.lineItem}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t">
              <Button variant="outline" onClick={() => setShowItemDetails(false)}>
                إغلاق
              </Button>
              <Button onClick={() => {
                setShowItemDetails(false);
                handleEditItem(selectedItem);
              }}>
                <Edit className="h-4 w-4 ml-2" />
                تعديل
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Item Modal */}
      {selectedItem && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تعديل الصنف</DialogTitle>
            </DialogHeader>
            <EditItemForm 
              item={selectedItem}
              onClose={() => {
                setIsEditModalOpen(false);
                setSelectedItem(null);
              }}
              onSuccess={() => {
                setIsEditModalOpen(false);
                setSelectedItem(null);
                queryClient.invalidateQueries({ queryKey: ["/api/items"] });
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
