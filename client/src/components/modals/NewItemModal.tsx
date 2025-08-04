import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, Check, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const itemSchema = z.object({
  partNumber: z.string().optional(),
  lineItem: z.string().optional(),
  description: z.string().min(1, "وصف الصنف مطلوب"),
  unit: z.string().min(1, "الوحدة مطلوبة"),
  category: z.string().optional(),
});

type ItemForm = z.infer<typeof itemSchema>;

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewItemModal({ isOpen, onClose }: NewItemModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [aiResults, setAiResults] = useState<any>(null);
  const [isCheckingAI, setIsCheckingAI] = useState(false);

  const units = [
    "Each", "Piece", "Meter", "Carton", "Feet", "Kit", "Packet", "Reel", "Set"
  ];

  const categories = [
    { value: "electrical", label: "كهربائية" },
    { value: "mechanical", label: "ميكانيكية" },
    { value: "civil", label: "مدنية" },
    { value: "electronic", label: "إلكترونية" },
  ];

  const form = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      partNumber: "",
      lineItem: "",
      description: "",
      unit: "",
      category: "",
    },
  });

  const checkAISimilarity = async (description: string, partNumber?: string) => {
    if (!description.trim()) return;

    setIsCheckingAI(true);
    try {
      const response = await apiRequest("POST", "/api/items/ai-compare", {
        description,
        partNumber,
      });
      const result = await response.json();
      setAiResults(result);
    } catch (error) {
      console.error("AI check failed:", error);
    } finally {
      setIsCheckingAI(false);
    }
  };

  const createItemMutation = useMutation({
    mutationFn: async (data: ItemForm) => {
      const response = await apiRequest("POST", "/api/items", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: "تم إضافة الصنف",
        description: `تم إضافة الصنف ${data.itemNumber} بنجاح`,
      });
      form.reset();
      setAiResults(null);
      onClose();
    },
    onError: (error: any) => {
      console.error('Item creation error:', error);
      
      // Handle duplicate error specifically
      if (error.status === 409 && error.error === "DUPLICATE_PART_NUMBER") {
        toast({
          title: "صنف مكرر",
          description: `يوجد صنف بنفس رقم القطعة: ${error.existingItem?.itemNumber}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "خطأ في إضافة الصنف",
          description: error.message || "حدث خطأ أثناء إضافة الصنف",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: ItemForm) => {
    // منع الإرسال إذا تم اكتشاف تكرار
    if (aiResults?.isDuplicate) {
      toast({
        title: "تحذير: صنف مكرر",
        description: "لا يمكن إضافة هذا الصنف لأنه موجود مسبقاً في النظام",
        variant: "destructive",
      });
      return;
    }
    
    createItemMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    setAiResults(null);
    onClose();
  };

  const handleDescriptionChange = (value: string) => {
    form.setValue("description", value);
    
    // Auto-check AI similarity when description has enough content
    if (value.length > 10) {
      const partNumber = form.getValues("partNumber");
      checkAISimilarity(value, partNumber);
    } else {
      setAiResults(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>إضافة صنف جديد</DialogTitle>
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
              <Label>رقم الصنف (تلقائي)</Label>
              <Input
                value="سيتم توليده تلقائياً"
                disabled
                className="bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                سيتم توليد رقم صنف فريد تلقائياً (P-000001)
              </p>
            </div>

            <div>
              <Label htmlFor="partNumber">رقم القطعة (PART NO.)</Label>
              <Input
                id="partNumber"
                placeholder="رقم القطعة من المورد"
                {...form.register("partNumber")}
              />
            </div>

            <div>
              <Label htmlFor="lineItem">LINE ITEM</Label>
              <Input
                id="lineItem"
                placeholder="1234.567.GENRAL.0001"
                dir="ltr"
                {...form.register("lineItem")}
              />
            </div>

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

            <div className="md:col-span-2">
              <Label htmlFor="description">التوصيف *</Label>
              <Textarea
                id="description"
                placeholder="وصف مفصل للصنف..."
                rows={3}
                value={form.watch("description")}
                onChange={(e) => handleDescriptionChange(e.target.value)}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.description.message}
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

          {/* AI Similarity Check Results */}
          {(isCheckingAI || aiResults) && (
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 space-x-reverse mb-3">
                  <Check className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-800">
                    {isCheckingAI ? "جاري فحص التشابه..." : "نتائج فحص التشابه"}
                  </h4>
                </div>

                {isCheckingAI && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className="w-4 h-4 border-2 border-purple-600/20 border-t-purple-600 rounded-full loading-spinner"></div>
                    <span className="text-sm text-purple-700">
                      جاري البحث عن أصناف مشابهة باستخدام الذكاء الاصطناعي...
                    </span>
                  </div>
                )}

                {aiResults && !isCheckingAI && (
                  <div>
                    {/* Show duplicate warning if AI detected duplicates */}
                    {aiResults.isDuplicate && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
                        <div className="flex items-center space-x-2 space-x-reverse mb-2">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <span className="text-sm font-bold text-red-800">
                            تحذير: تم اكتشاف صنف مكرر!
                          </span>
                        </div>
                        <p className="text-sm text-red-700 mb-2">
                          {aiResults.reason || "يُنصح بعدم إضافة هذا الصنف لأنه موجود مسبقاً"}
                        </p>
                        {aiResults.matchedItem && (
                          <p className="text-xs text-red-600">
                            الصنف المطابق: {aiResults.matchedItem}
                          </p>
                        )}
                        <p className="text-xs text-red-600 mt-2 font-semibold">
                          ⚠️ لا يمكن إضافة الصنف - يرجى استخدام الصنف الموجود
                        </p>
                      </div>
                    )}

                    {aiResults.similarItems && aiResults.similarItems.length > 0 ? (
                      <div>
                        <div className="flex items-center space-x-2 space-x-reverse mb-2">
                          <AlertCircle className={`h-4 w-4 ${aiResults.isDuplicate ? 'text-red-600' : 'text-amber-600'}`} />
                          <span className={`text-sm font-medium ${aiResults.isDuplicate ? 'text-red-700' : 'text-amber-700'}`}>
                            تم العثور على {aiResults.similarItems.length} صنف مشابه
                            {aiResults.isDuplicate && ' (مكرر)'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {aiResults.similarItems.slice(0, 3).map((item: any) => (
                            <div key={item.id} className={`p-2 rounded border ${aiResults.isDuplicate ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
                              <p className="text-sm font-medium">{item.itemNumber}</p>
                              <p className="text-xs text-gray-600">{item.description}</p>
                              {item.partNumber && (
                                <p className="text-xs text-blue-600">Part Number: {item.partNumber}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700">
                          لم يتم العثور على أصناف مشابهة - يمكن إضافة الصنف بأمان
                        </span>
                      </div>
                    )}
                    
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <p className="text-xs text-purple-600">
                        AI Provider: {aiResults.aiProvider === "deepseek" ? "DeepSeek" : "Local Matching"}
                        {aiResults.aiProvider === "deepseek" && !aiResults.apiKeyConfigured && " (API Key غير مُكوّن)"}
                      </p>
                      {aiResults.confidence && (
                        <p className="text-xs text-gray-500">
                          مستوى الثقة: {aiResults.confidence === "high" ? "عالي" : aiResults.confidence === "medium" ? "متوسط" : "منخفض"}
                        </p>
                      )}
                    </div>
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
              disabled={createItemMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={createItemMutation.isPending || (aiResults?.isDuplicate)}
              variant={aiResults?.isDuplicate ? "destructive" : "default"}
            >
              {createItemMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full loading-spinner ml-2"></div>
                  جاري الإضافة...
                </>
              ) : aiResults?.isDuplicate ? (
                "صنف مكرر - لا يمكن الإضافة"
              ) : (
                "إضافة الصنف"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
