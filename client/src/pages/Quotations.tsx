import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { hasRole } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import NewQuotationModal from "@/components/modals/NewQuotationModal";
import EnhancedQuotationModal from "@/components/modals/EnhancedQuotationModal";

export default function Quotations() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewQuotationModalOpen, setIsNewQuotationModalOpen] = useState(false);
  const [isEnhancedQuotationModalOpen, setIsEnhancedQuotationModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    requestNumber: "",
    clientName: "",
    status: "",
    date: "",
  });

  const { data: quotations, isLoading } = useQuery({
    queryKey: ["/api/quotations"],
  });

  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
  });

  // Delete quotation mutation
  const deleteQuotationMutation = useMutation({
    mutationFn: async (quotationId: string) => {
      await apiRequest("DELETE", `/api/quotations/${quotationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      toast({
        title: "تم حذف طلب التسعير",
        description: "تم حذف طلب التسعير بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف طلب التسعير",
        description: error.message || "حدث خطأ أثناء حذف طلب التسعير",
        variant: "destructive",
      });
    },
  });

  // Edit quotation function
  const handleEditQuotation = (quotationId: string) => {
    setLocation(`/quotations/${quotationId}/edit`);
  };

  // Delete quotation function
  const handleDeleteQuotation = async (quotationId: string) => {
    deleteQuotationMutation.mutate(quotationId);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "في الانتظار", variant: "secondary" as const },
      processing: { label: "قيد المعالجة", variant: "default" as const },
      completed: { label: "مكتمل", variant: "default" as const },
      cancelled: { label: "ملغي", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge variant={config.variant} className={
        status === "completed" ? "bg-green-100 text-green-800 hover:bg-green-100" :
        status === "processing" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" : ""
      }>
        {config.label}
      </Badge>
    );
  };

  const filteredQuotations = quotations && Array.isArray(quotations) ? quotations.filter((quotation: any) => {
    return (
      (!filters.requestNumber || quotation.requestNumber.includes(filters.requestNumber)) &&
      (!filters.status || filters.status === "all" || quotation.status === filters.status) &&
      (!filters.date || quotation.requestDate?.startsWith(filters.date))
    );
  }) : [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  const getClientName = (clientId: string) => {
    const client = clients && Array.isArray(clients) ? clients.find((c: any) => c.id === clientId) : null;
    return client?.name || "غير محدد";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full loading-spinner mx-auto mb-2"></div>
          <p className="text-gray-600">جاري تحميل طلبات التسعير...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة طلبات التسعير</h2>
          <p className="text-gray-600">إضافة وإدارة طلبات التسعير الواردة</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsNewQuotationModalOpen(true)} variant="outline">
            <Plus className="h-4 w-4 ml-2" />
            طلب بسيط
          </Button>
          <Button onClick={() => setIsEnhancedQuotationModalOpen(true)}>
            <Plus className="h-4 w-4 ml-2" />
            طلب تسعير متكامل
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="requestNumber">رقم الطلب</Label>
              <Input
                id="requestNumber"
                placeholder="REQ00000001"
                value={filters.requestNumber}
                onChange={(e) => setFilters({ ...filters, requestNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="clientName">اسم العميل</Label>
              <Input
                id="clientName"
                placeholder="اسم العميل"
                value={filters.clientName}
                onChange={(e) => setFilters({ ...filters, clientName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="status">حالة الطلب</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">في الانتظار</SelectItem>
                  <SelectItem value="processing">قيد المعالجة</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">التاريخ</Label>
              <Input
                id="date"
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotations Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الطلب</TableHead>
                  <TableHead className="text-right">اسم العميل</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">تاريخ الانتهاء</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الموظف المسؤول</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      لا توجد طلبات تسعير
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotations.map((quotation: any) => (
                    <TableRow key={quotation.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{quotation.requestNumber}</TableCell>
                      <TableCell>{getClientName(quotation.clientId)}</TableCell>
                      <TableCell>{formatDate(quotation.requestDate)}</TableCell>
                      <TableCell>
                        {quotation.expiryDate ? formatDate(quotation.expiryDate) : "غير محدد"}
                      </TableCell>
                      <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                      <TableCell>{quotation.responsibleEmployee || "غير محدد"}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setLocation(`/quotations/${quotation.id}`)}
                            title="عرض التفاصيل"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {user && hasRole(user, ["manager", "data_entry"]) && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditQuotation(quotation.id)}
                              title="تعديل"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {user && hasRole(user, ["manager"]) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-800"
                                  title="حذف"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    هل أنت متأكد من حذف طلب التسعير رقم {quotation.requestNumber}؟
                                    هذا الإجراء لا يمكن التراجع عنه.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteQuotation(quotation.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    حذف
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredQuotations.length > 0 && (
            <div className="border-t px-6 py-3 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                عرض <span className="font-medium">1</span> إلى{" "}
                <span className="font-medium">{Math.min(10, filteredQuotations.length)}</span> من{" "}
                <span className="font-medium">{filteredQuotations.length}</span> طلب
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

      <NewQuotationModal
        isOpen={isNewQuotationModalOpen}
        onClose={() => setIsNewQuotationModalOpen(false)}
      />
      
      <EnhancedQuotationModal
        isOpen={isEnhancedQuotationModalOpen}
        onClose={() => setIsEnhancedQuotationModalOpen(false)}
      />
    </div>
  );
}
