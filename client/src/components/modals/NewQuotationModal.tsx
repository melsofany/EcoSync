import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X } from "lucide-react";

const quotationSchema = z.object({
  clientId: z.string().min(1, "اختيار العميل مطلوب"),
  responsibleEmployee: z.string().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
});

type QuotationForm = z.infer<typeof quotationSchema>;

interface NewQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewQuotationModal({ isOpen, onClose }: NewQuotationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
    enabled: isOpen,
  });

  const form = useForm<QuotationForm>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      clientId: "",
      responsibleEmployee: "",
      expiryDate: "",
      notes: "",
    },
  });

  const createQuotationMutation = useMutation({
    mutationFn: async (data: QuotationForm) => {
      const response = await apiRequest("POST", "/api/quotations", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      toast({
        title: "تم إنشاء طلب التسعير",
        description: `تم إنشاء طلب التسعير ${data.requestNumber} بنجاح`,
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء طلب التسعير",
        description: error.message || "حدث خطأ أثناء إنشاء طلب التسعير",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuotationForm) => {
    createQuotationMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>طلب تسعير جديد</DialogTitle>
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
              <Label>رقم الطلب (تلقائي)</Label>
              <Input
                value="سيتم توليده تلقائياً"
                disabled
                className="bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                سيتم توليد رقم طلب فريد تلقائياً عند الحفظ
              </p>
            </div>

            <div>
              <Label htmlFor="clientId">اسم العميل *</Label>
              <Select
                value={form.watch("clientId")}
                onValueChange={(value) => form.setValue("clientId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر العميل" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client: any) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.clientId && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.clientId.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="responsibleEmployee">الموظف المسؤول</Label>
              <Input
                id="responsibleEmployee"
                placeholder="اسم الموظف المسؤول"
                {...form.register("responsibleEmployee")}
              />
            </div>

            <div>
              <Label htmlFor="expiryDate">تاريخ انتهاء الصلاحية</Label>
              <Input
                id="expiryDate"
                type="date"
                {...form.register("expiryDate")}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              placeholder="أي ملاحظات إضافية..."
              rows={4}
              {...form.register("notes")}
            />
          </div>

          <div className="flex justify-end space-x-3 space-x-reverse pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createQuotationMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={createQuotationMutation.isPending}
            >
              {createQuotationMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full loading-spinner ml-2"></div>
                  جاري الإنشاء...
                </>
              ) : (
                "إنشاء الطلب"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
