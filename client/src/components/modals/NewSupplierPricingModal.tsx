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

// Form schema for supplier pricing with enhanced fields
const supplierPricingSchema = z.object({
  itemId: z.string().min(1, "يجب اختيار صنف"),
  supplierId: z.string().min(1, "يجب اختيار مورد"),
  
  // Supplier information
  supplierName: z.string().min(1, "اسم المورد مطلوب"),
  supplierContact: z.string().optional(),
  supplierPhone: z.string().optional(),
  supplierEmail: z.string().optional(),
  supplierAddress: z.string().optional(),
  
  // Pricing information
  unitPrice: z.string().min(1, "السعر مطلوب"),
  currency: z.string().default("EGP"),
  
  // VAT information
  vatIncluded: z.enum(["نعم", "لا"]).default("لا"),
  vatRate: z.string().default("14%"),
  priceBeforeVat: z.string().optional(),
  vatAmount: z.string().optional(),
  
  // Terms and conditions
  paymentTerms: z.string().optional(),
  warrantyPeriod: z.string().optional(),
  deliveryTime: z.string().optional(),
  
  // Additional fields
  priceReceivedDate: z.string().min(1, "تاريخ ورود السعر مطلوب"),
  validityPeriod: z.coerce.number().optional(),
  minimumOrderQuantity: z.coerce.number().optional(),
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
      vatIncluded: "لا",
      vatRate: "14%",
      supplierName: "",
      supplierContact: "",
      supplierPhone: "",
      supplierEmail: "",
      supplierAddress: "",
      priceBeforeVat: "",
      vatAmount: "",
      paymentTerms: "",
      warrantyPeriod: "",
      deliveryTime: "",
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

          {/* Supplier Details Section */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-800 border-b pb-2">تفاصيل المورد</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplierName">اسم المورد *</Label>
                <Input
                  id="supplierName"
                  {...form.register("supplierName")}
                  placeholder="اسم الشركة أو المورد"
                />
                {form.formState.errors.supplierName && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.supplierName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="supplierContact">جهة الاتصال</Label>
                <Input
                  id="supplierContact"
                  {...form.register("supplierContact")}
                  placeholder="اسم الشخص المسؤول"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplierPhone">رقم الهاتف</Label>
                <Input
                  id="supplierPhone"
                  {...form.register("supplierPhone")}
                  placeholder="+20 123 456 7890"
                />
              </div>

              <div>
                <Label htmlFor="supplierEmail">البريد الإلكتروني</Label>
                <Input
                  id="supplierEmail"
                  type="email"
                  {...form.register("supplierEmail")}
                  placeholder="supplier@example.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="supplierAddress">العنوان</Label>
              <Textarea
                id="supplierAddress"
                {...form.register("supplierAddress")}
                placeholder="عنوان المورد أو الشركة..."
                rows={2}
              />
            </div>
          </div>

          {/* VAT Section */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-800 border-b pb-2">ضريبة القيمة المضافة</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="vatIncluded">هل السعر يشمل ضريبة القيمة المضافة؟</Label>
                <Select
                  value={form.watch("vatIncluded")}
                  onValueChange={(value) => form.setValue("vatIncluded", value as "نعم" | "لا")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="لا">لا - السعر بدون ضريبة</SelectItem>
                    <SelectItem value="نعم">نعم - السعر شامل ضريبة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="vatRate">معدل الضريبة</Label>
                <Select
                  value={form.watch("vatRate")}
                  onValueChange={(value) => form.setValue("vatRate", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0%">معفى من الضريبة (0%)</SelectItem>
                    <SelectItem value="14%">14% (المعدل الأساسي)</SelectItem>
                    <SelectItem value="5%">5% (معدل مخفض)</SelectItem>
                    <SelectItem value="10%">10% (معدل خاص)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priceBeforeVat">السعر قبل الضريبة</Label>
                <Input
                  id="priceBeforeVat"
                  type="number"
                  step="0.01"
                  {...form.register("priceBeforeVat")}
                  placeholder="السعر بدون ضريبة"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vatAmount">مبلغ الضريبة</Label>
                <Input
                  id="vatAmount"
                  type="number"
                  step="0.01"
                  {...form.register("vatAmount")}
                  placeholder="قيمة الضريبة المضافة"
                />
              </div>
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

          {/* Additional Terms Section */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-800 border-b pb-2">الشروط والتفاصيل الإضافية</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="paymentTerms">شروط الدفع</Label>
                <Input
                  id="paymentTerms"
                  {...form.register("paymentTerms")}
                  placeholder="كاش - تحويل بنكي - آجل 30 يوم"
                />
              </div>

              <div>
                <Label htmlFor="warrantyPeriod">فترة الضمان</Label>
                <Input
                  id="warrantyPeriod"
                  {...form.register("warrantyPeriod")}
                  placeholder="سنة واحدة - سنتين - بدون ضمان"
                />
              </div>

              <div>
                <Label htmlFor="deliveryTime">مدة التسليم</Label>
                <Input
                  id="deliveryTime"
                  {...form.register("deliveryTime")}
                  placeholder="7-10 أيام عمل"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>
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