import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calculator, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const customerPricingSchema = z.object({
  quotationId: z.string().min(1, "معرف العرض مطلوب"),
  itemId: z.string().min(1, "معرف البند مطلوب"),
  supplierPricingId: z.string().optional(),
  costPrice: z.string().min(1, "سعر التكلفة مطلوب"),
  sellingPrice: z.string().min(1, "سعر البيع مطلوب"),
  quantity: z.string().min(1, "الكمية مطلوبة"),
  notes: z.string().optional(),
});

type CustomerPricingForm = z.infer<typeof customerPricingSchema>;

interface CustomerPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  quotationId?: string;
}

export default function CustomerPricingModal({
  isOpen,
  onClose,
  item,
  quotationId,
}: CustomerPricingModalProps) {
  const [profitMargin, setProfitMargin] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CustomerPricingForm>({
    resolver: zodResolver(customerPricingSchema),
    defaultValues: {
      quotationId: quotationId || "",
      itemId: item?.item?.id || "",
      supplierPricingId: item?.supplierPricing?.id || "",
      costPrice: item?.supplierPricing?.unitPrice || "",
      sellingPrice: "",
      quantity: "1",
      notes: "",
    },
  });

  const createCustomerPricing = useMutation({
    mutationFn: async (data: CustomerPricingForm) => {
      const response = await apiRequest("POST", "/api/customer-pricing", {
        ...data,
        costPrice: Number(data.costPrice),
        sellingPrice: Number(data.sellingPrice),
        quantity: Number(data.quantity),
        profitMargin,
        totalAmount,
        currency: "EGP",
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إضافة تسعير العميل بنجاح",
        description: "تم حفظ السعر وحساب هامش الربح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/items-ready-for-customer-pricing"] });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إضافة تسعير العميل",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  // Calculate profit margin and total amount
  useEffect(() => {
    const costPrice = Number(form.watch("costPrice")) || 0;
    const sellingPrice = Number(form.watch("sellingPrice")) || 0;
    const quantity = Number(form.watch("quantity")) || 1;

    if (costPrice > 0 && sellingPrice > 0) {
      const margin = ((sellingPrice - costPrice) / costPrice) * 100;
      setProfitMargin(Number(margin.toFixed(2)));
    } else {
      setProfitMargin(0);
    }

    setTotalAmount(sellingPrice * quantity);
  }, [form.watch("costPrice"), form.watch("sellingPrice"), form.watch("quantity")]);

  const onSubmit = (data: CustomerPricingForm) => {
    createCustomerPricing.mutate(data);
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            تسعير العميل - {item.item?.description}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item and Supplier Info */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold">معلومات البند والمورد</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="font-medium">رقم البند:</label>
                <p>{item.item?.itemNumber}</p>
              </div>
              <div>
                <label className="font-medium">الوحدة:</label>
                <p>{item.item?.unit || "غير محدد"}</p>
              </div>
              <div>
                <label className="font-medium">سعر المورد:</label>
                <p className="font-semibold text-green-600">
                  {formatCurrency(Number(item.supplierPricing?.unitPrice || 0))}
                </p>
              </div>
              <div>
                <label className="font-medium">تاريخ ورود السعر:</label>
                <p>{item.supplierPricing?.priceReceivedDate ? 
                  new Date(item.supplierPricing.priceReceivedDate).toLocaleDateString('ar-EG')
                  : "غير محدد"}</p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-blue-700">
                        <DollarSign className="h-4 w-4" />
                        سعر المورد (التكلفة) *
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="border-blue-300 focus:border-blue-500"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">يمكن تعديل سعر المورد حسب الحاجة</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الكمية</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="1"
                          min="1"
                          placeholder="1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="sellingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سعر البيع للعميل (جنيه)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="text-lg font-semibold"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Profit Calculation Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold text-blue-800">حساب الربح</h4>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <label className="text-blue-700 font-medium">نسبة الربح:</label>
                    <p className={`text-lg font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitMargin.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <label className="text-blue-700 font-medium">إجمالي المبلغ:</label>
                    <p className="text-lg font-bold text-blue-800">
                      {formatCurrency(totalAmount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-blue-700 font-medium">صافي الربح:</label>
                    <p className={`text-lg font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency((Number(form.watch("sellingPrice")) - Number(form.watch("costPrice"))) * Number(form.watch("quantity")))}
                    </p>
                  </div>
                </div>

                {profitMargin < 0 && (
                  <Badge variant="destructive" className="w-fit">
                    تحذير: السعر أقل من التكلفة!
                  </Badge>
                )}
                {profitMargin >= 0 && profitMargin < 10 && (
                  <Badge variant="secondary" className="w-fit">
                    هامش ربح منخفض
                  </Badge>
                )}
                {profitMargin >= 20 && (
                  <Badge variant="default" className="w-fit">
                    هامش ربح جيد
                  </Badge>
                )}
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ملاحظات (اختياري)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="أضف أي ملاحظات حول التسعير..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={createCustomerPricing.isPending}
                  className="flex-1"
                >
                  {createCustomerPricing.isPending ? "جاري الحفظ..." : "حفظ التسعير"}
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  إلغاء
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}