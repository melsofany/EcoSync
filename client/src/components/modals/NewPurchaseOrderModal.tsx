import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, Calendar, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const purchaseOrderSchema = z.object({
  quotationId: z.string().min(1, "طلب التسعير مطلوب"),
  totalValue: z.string().min(1, "القيمة الإجمالية مطلوبة"),
  status: z.string().default("pending"),
});

type PurchaseOrderForm = z.infer<typeof purchaseOrderSchema>;

interface NewPurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewPurchaseOrderModal({ isOpen, onClose }: NewPurchaseOrderModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quotations } = useQuery({
    queryKey: ["/api/quotations"],
    enabled: isOpen,
  });

  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
    enabled: isOpen,
  });

  const form = useForm<PurchaseOrderForm>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      quotationId: "",
      totalValue: "",
      status: "pending",
    },
  });

  const createPurchaseOrderMutation = useMutation({
    mutationFn: async (data: PurchaseOrderForm) => {
      const response = await apiRequest("POST", "/api/purchase-orders", {
        ...data,
        totalValue: parseFloat(data.totalValue),
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({
        title: "تم إنشاء أمر الشراء",
        description: `تم إنشاء أمر الشراء ${data.poNumber} بنجاح`,
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء أمر الشراء",
        description: error.message || "حدث خطأ أثناء إنشاء أمر الشراء",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PurchaseOrderForm) => {
    createPurchaseOrderMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const selectedQuotation = quotations?.find(
    (q: any) => q.id === form.watch("quotationId")
  );

  const getClientName = (clientId: string) => {
    const client = clients?.find((c: any) => c.id === clientId);
    return client?.name || "غير محدد";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  // Filter completed quotations for purchase orders
  const availableQuotations = quotations?.filter(
    (q: any) => q.status === "completed"
  ) || [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>أمر شراء جديد</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>رقم أمر الشراء (تلقائي)</Label>
              <Input
                value="سيتم توليده تلقائياً"
                disabled
                className="bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                سيتم توليد رقم أمر شراء فريد تلقائياً (PO-2024-XXXX)
              </p>
            </div>

            <div>
              <Label>تاريخ أمر الشراء</Label>
              <div className="flex items-center space-x-2 space-x-reverse p-2 border rounded-lg bg-gray-50">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {new Date().toLocaleDateString('ar-EG')}
                </span>
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="quotationId">طلب التسعير المرتبط *</Label>
              <Select
                value={form.watch("quotationId")}
                onValueChange={(value) => form.setValue("quotationId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر طلب التسعير" />
                </SelectTrigger>
                <SelectContent>
                  {availableQuotations.length === 0 ? (
                    <SelectItem value="" disabled>
                      لا توجد طلبات تسعير مكتملة
                    </SelectItem>
                  ) : (
                    availableQuotations.map((quotation: any) => (
                      <SelectItem key={quotation.id} value={quotation.id}>
                        {quotation.requestNumber} - {getClientName(quotation.clientId)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.quotationId && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.quotationId.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="totalValue">القيمة الإجمالية (ج.م) *</Label>
              <Input
                id="totalValue"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register("totalValue")}
              />
              {form.formState.errors.totalValue && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.totalValue.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="status">حالة الأمر</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">في الانتظار</SelectItem>
                  <SelectItem value="confirmed">مؤكد</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quotation Details */}
          {selectedQuotation && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 space-x-reverse mb-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-800">تفاصيل طلب التسعير</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">رقم الطلب:</span>
                    <span className="font-medium mr-2">{selectedQuotation.requestNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">العميل:</span>
                    <span className="font-medium mr-2">{getClientName(selectedQuotation.clientId)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">تاريخ الطلب:</span>
                    <span className="font-medium mr-2">{formatDate(selectedQuotation.requestDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">الموظف المسؤول:</span>
                    <span className="font-medium mr-2">{selectedQuotation.responsibleEmployee || "غير محدد"}</span>
                  </div>
                </div>
                {selectedQuotation.notes && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <span className="text-gray-600 text-sm">ملاحظات:</span>
                    <p className="text-sm mt-1">{selectedQuotation.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-3 space-x-reverse pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createPurchaseOrderMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={createPurchaseOrderMutation.isPending || availableQuotations.length === 0}
            >
              {createPurchaseOrderMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full loading-spinner ml-2"></div>
                  جاري الإنشاء...
                </>
              ) : (
                "إنشاء أمر الشراء"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
