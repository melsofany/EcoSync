import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Form schema for supplier pricing
const supplierPricingSchema = z.object({
  itemId: z.string().min(1, "يجب اختيار صنف"),
  supplierId: z.string().min(1, "يجب اختيار مورد"),
  unitPrice: z.string().min(1, "السعر مطلوب"),
  currency: z.string().default("EGP"),
  priceReceivedDate: z.string().min(1, "تاريخ ورود السعر مطلوب"),
  validityPeriod: z.coerce.number().optional(),
  minimumOrderQuantity: z.coerce.number().optional(),
  deliveryTime: z.coerce.number().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

type SupplierPricingForm = z.infer<typeof supplierPricingSchema>;

interface NewSupplierPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItemId?: string;
}

export default function NewSupplierPricingModal({
  isOpen,
  onClose,
  selectedItemId,
}: NewSupplierPricingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available data
  const { data: itemsRequiringPricing = [] } = useQuery<any[]>({
    queryKey: ["/api/items-requiring-pricing"],
  });

  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/suppliers"],
  });

  const form = useForm<SupplierPricingForm>({
    resolver: zodResolver(supplierPricingSchema),
    defaultValues: {
      currency: "EGP",
      itemId: selectedItemId || "",
    },
  });

  // Create pricing mutation
  const createPricingMutation = useMutation({
    mutationFn: async (data: SupplierPricingForm) => {
      const response = await apiRequest("POST", "/api/supplier-pricing", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إضافة السعر",
        description: "تم إضافة سعر المورد بنجاح",
      });
      onClose();
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/items-requiring-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-pricing"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إضافة السعر",
        description: error.message || "حدث خطأ أثناء إضافة السعر",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SupplierPricingForm) => {
    createPricingMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>إضافة سعر مورد جديد</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="itemId">الصنف *</Label>
              <Select
                value={form.watch("itemId")}
                onValueChange={(value) => form.setValue("itemId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصنف" />
                </SelectTrigger>
                <SelectContent>
                  {itemsRequiringPricing.map((item: any) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.itemNumber} - {item.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.itemId && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.itemId.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="supplierId">المورد *</Label>
              <Select
                value={form.watch("supplierId")}
                onValueChange={(value) => form.setValue("supplierId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المورد" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier: any) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.supplierId && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.supplierId.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="unitPrice">السعر *</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                {...form.register("unitPrice")}
                placeholder="أدخل السعر"
              />
              {form.formState.errors.unitPrice && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.unitPrice.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="currency">العملة</Label>
              <Select
                value={form.watch("currency")}
                onValueChange={(value) => form.setValue("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EGP">جنيه مصري</SelectItem>
                  <SelectItem value="USD">دولار أمريكي</SelectItem>
                  <SelectItem value="EUR">يورو</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priceReceivedDate">تاريخ ورود السعر *</Label>
              <Input
                id="priceReceivedDate"
                type="date"
                {...form.register("priceReceivedDate")}
              />
              {form.formState.errors.priceReceivedDate && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.priceReceivedDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="validityPeriod">فترة الصلاحية (أيام)</Label>
              <Input
                id="validityPeriod"
                type="number"
                {...form.register("validityPeriod")}
                placeholder="30"
              />
            </div>

            <div>
              <Label htmlFor="minimumOrderQuantity">الحد الأدنى للطلب</Label>
              <Input
                id="minimumOrderQuantity"
                type="number"
                {...form.register("minimumOrderQuantity")}
                placeholder="1"
              />
            </div>

            <div>
              <Label htmlFor="deliveryTime">مدة التسليم (أيام)</Label>
              <Input
                id="deliveryTime"
                type="number"
                {...form.register("deliveryTime")}
                placeholder="7"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="paymentTerms">شروط الدفع</Label>
            <Input
              id="paymentTerms"
              {...form.register("paymentTerms")}
              placeholder="كاش - تحويل بنكي - آجل 30 يوم"
            />
          </div>

          <div>
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="أي ملاحظات إضافية حول السعر أو شروط التوريد"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createPricingMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={createPricingMutation.isPending}
            >
              {createPricingMutation.isPending ? "جاري الحفظ..." : "حفظ السعر"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}