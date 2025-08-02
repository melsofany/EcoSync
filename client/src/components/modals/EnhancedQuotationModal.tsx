import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, X, Bot, AlertTriangle, CheckCircle, Trash2, Save } from "lucide-react";

// Schema for individual quotation items
const quotationItemSchema = z.object({
  partNumber: z.string().optional(),
  lineItem: z.string().optional(),
  description: z.string().min(1, "التوصيف مطلوب"),
  unit: z.enum(["Each", "Piece", "Meter", "Carton", "Feet", "Kit", "Packet", "Reel", "Set"]),
  quantity: z.number().min(0.01, "الكمية يجب أن تكون أكبر من صفر"),
  category: z.string().optional(),
  notes: z.string().optional(),
});

// Main quotation schema
const enhancedQuotationSchema = z.object({
  clientId: z.string().min(1, "اختيار العميل مطلوب"),
  customRequestNumber: z.string().optional(),
  responsibleEmployee: z.string().optional(),
  requestDate: z.string().min(1, "تاريخ الطلب مطلوب"), // Added request date
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(quotationItemSchema).min(1, "يجب إضافة بند واحد على الأقل"),
});

type EnhancedQuotationForm = z.infer<typeof enhancedQuotationSchema>;

interface AIAnalysisResult {
  status: 'processed' | 'duplicate' | 'new';
  matchedItem?: {
    id: string;
    itemNumber: string;
    description: string;
    partNumber?: string;
  };
  similarItems?: Array<{
    id: string;
    itemNumber: string;
    description: string;
    partNumber?: string;
    similarity: number;
  }>;
  recommendation?: string;
}

interface EnhancedQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnhancedQuotationModal({ isOpen, onClose }: EnhancedQuotationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [aiAnalysisResults, setAiAnalysisResults] = useState<{ [key: number]: AIAnalysisResult }>({});
  const [isAnalyzing, setIsAnalyzing] = useState<{ [key: number]: boolean }>({});

  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
    enabled: isOpen,
  });

  const form = useForm<EnhancedQuotationForm>({
    resolver: zodResolver(enhancedQuotationSchema),
    defaultValues: {
      clientId: "",
      customRequestNumber: "",
      responsibleEmployee: "",
      requestDate: new Date().toISOString().split('T')[0], // Default to today
      expiryDate: "",
      notes: "",
      items: [
        {
          partNumber: "",
          lineItem: "",
          description: "",
          unit: "Each",
          quantity: 1,
          category: "",
          notes: "",
        }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // AI Analysis mutation
  const aiAnalysisMutation = useMutation({
    mutationFn: async ({ description, partNumber, itemIndex }: { description: string; partNumber?: string; itemIndex: number }) => {
      const response = await apiRequest("POST", "/api/items/ai-compare", {
        description,
        partNumber: partNumber || undefined,
      });
      return { data: await response.json(), itemIndex };
    },
    onSuccess: (result) => {
      const { data, itemIndex } = result;
      setAiAnalysisResults(prev => ({
        ...prev,
        [itemIndex]: {
          status: data.similarItems?.length > 0 ? 'duplicate' : 'new',
          similarItems: data.similarItems || [],
          recommendation: data.similarItems?.length > 0 
            ? 'تم العثور على بنود مشابهة. يرجى مراجعة القائمة أدناه.'
            : 'بند جديد - سيتم توليد رقم معرف فريد.'
        }
      }));
      setIsAnalyzing(prev => ({ ...prev, [itemIndex]: false }));
    },
    onError: (error: any, variables) => {
      const itemIndex = variables.itemIndex;
      setIsAnalyzing(prev => ({ ...prev, [itemIndex]: false }));
      toast({
        title: "خطأ في تحليل البند",
        description: "حدث خطأ أثناء تحليل البند بالذكاء الاصطناعي",
        variant: "destructive",
      });
    },
  });

  // Function to trigger AI analysis for an item
  const analyzeItem = (index: number) => {
    const item = form.getValues(`items.${index}`);
    if (!item.description.trim()) {
      toast({
        title: "تحذير",
        description: "يرجى إدخال التوصيف أولاً",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(prev => ({ ...prev, [index]: true }));
    aiAnalysisMutation.mutate({
      description: item.description, 
      partNumber: item.partNumber || undefined,
      itemIndex: index
    });
  };

  // Main quotation creation mutation
  const createQuotationMutation = useMutation({
    mutationFn: async (data: EnhancedQuotationForm) => {
      // First create the quotation
      const quotationData = {
        clientId: data.clientId,
        responsibleEmployee: data.responsibleEmployee,
        requestDate: data.requestDate,
        expiryDate: data.expiryDate,
        notes: data.notes,
        customRequestNumber: data.customRequestNumber,
      };

      const quotationResponse = await apiRequest("POST", "/api/quotations", quotationData);
      const quotation = await quotationResponse.json();

      // Then create items and add them to the quotation
      for (const itemData of data.items) {
        // Create the item first
        const itemResponse = await apiRequest("POST", "/api/items", {
          description: itemData.description,
          partNumber: itemData.partNumber || null,
          lineItem: itemData.lineItem || null,
          unit: itemData.unit,
          category: itemData.category || null,
        });
        const item = await itemResponse.json();

        // Add item to quotation
        await apiRequest("POST", `/api/quotations/${quotation.id}/items`, {
          itemId: item.id,
          quantity: itemData.quantity,
          unitPrice: 0, // Will be filled by purchasing department
          totalPrice: 0,
        });

        // Trigger AI analysis for each item automatically
        try {
          await apiRequest("POST", "/api/items/ai-compare", {
            description: itemData.description,
            partNumber: itemData.partNumber || undefined,
          });
        } catch (aiError) {
          console.log("AI analysis failed for item:", itemData.description);
          // Continue with quotation creation even if AI fails
        }
      }

      return quotation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: "تم إنشاء طلب التسعير",
        description: `تم إنشاء طلب التسعير ${data.requestNumber} بنجاح مع ${form.getValues("items").length} بند`,
      });
      form.reset();
      setAiAnalysisResults({});
      setIsAnalyzing({});
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

  const onSubmit = (data: EnhancedQuotationForm) => {
    createQuotationMutation.mutate(data);
  };

  const addNewItem = () => {
    append({
      partNumber: "",
      lineItem: "",
      description: "",
      unit: "Each",
      quantity: 1,
      category: "",
      notes: "",
    });
  };

  const unitOptions = [
    { value: "Each", label: "قطعة" },
    { value: "Piece", label: "وحدة" },
    { value: "Meter", label: "متر" },
    { value: "Carton", label: "كرتونة" },
    { value: "Feet", label: "قدم" },
    { value: "Kit", label: "طقم" },
    { value: "Packet", label: "عبوة" },
    { value: "Reel", label: "بكرة" },
    { value: "Set", label: "مجموعة" },
  ];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right text-xl font-bold">
            إنشاء طلب تسعير جديد
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic quotation information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right">معلومات أساسية</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">العميل *</Label>
                <Select 
                  onValueChange={(value) => form.setValue("clientId", value)}
                  value={form.watch("clientId")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العميل" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients && Array.isArray(clients) && clients.map((client: any) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.clientId && (
                  <p className="text-sm text-red-500">{String(form.formState.errors.clientId.message)}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customRequestNumber">رقم طلب العميل (اختياري)</Label>
                <Input
                  {...form.register("customRequestNumber")}
                  placeholder="رقم الطلب من العميل"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestDate">تاريخ طلب التسعير الوارد *</Label>
                <Input
                  type="date"
                  {...form.register("requestDate")}
                />
                {form.formState.errors.requestDate && (
                  <p className="text-sm text-red-500">{form.formState.errors.requestDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">تاريخ انتهاء العرض</Label>
                <Input
                  type="date"
                  {...form.register("expiryDate")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsibleEmployee">الموظف المسؤول</Label>
                <Input
                  {...form.register("responsibleEmployee")}
                  placeholder="اسم الموظف المسؤول"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  {...form.register("notes")}
                  placeholder="ملاحظات إضافية على الطلب"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Items section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-right">بنود التسعير</CardTitle>
              <Button type="button" onClick={addNewItem} size="sm">
                <Plus className="w-4 h-4 ml-2" />
                إضافة بند
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">البند {index + 1}</h4>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => analyzeItem(index)}
                          disabled={isAnalyzing[index] || !form.watch(`items.${index}.description`)}
                          size="sm"
                          variant="outline"
                        >
                          {isAnalyzing[index] ? (
                            <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                          تحليل بالذكاء الاصطناعي
                        </Button>
                        {index > 0 && (
                          <Button
                            type="button"
                            onClick={() => remove(index)}
                            size="sm"
                            variant="destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>رقم القطعة (Part No.)</Label>
                        <Input
                          {...form.register(`items.${index}.partNumber`)}
                          placeholder="P/N"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>رقم البند (Line Item)</Label>
                        <Input
                          {...form.register(`items.${index}.lineItem`)}
                          placeholder="Line Item"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>الوحدة *</Label>
                        <Select
                          onValueChange={(value) => form.setValue(`items.${index}.unit`, value as "Each" | "Piece" | "Meter" | "Carton" | "Feet" | "Kit" | "Packet" | "Reel" | "Set")}
                          value={form.watch(`items.${index}.unit`)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الوحدة" />
                          </SelectTrigger>
                          <SelectContent>
                            {unitOptions.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>التوصيف *</Label>
                        <Textarea
                          {...form.register(`items.${index}.description`)}
                          placeholder="وصف مفصل للبند"
                          rows={3}
                        />
                        {form.formState.errors.items?.[index]?.description && (
                          <p className="text-sm text-red-500">
                            {String(form.formState.errors.items[index]?.description?.message)}
                          </p>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>الكمية *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                            placeholder="الكمية"
                          />
                          {form.formState.errors.items?.[index]?.quantity && (
                            <p className="text-sm text-red-500">
                              {String(form.formState.errors.items[index]?.quantity?.message)}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>التصنيف</Label>
                          <Input
                            {...form.register(`items.${index}.category`)}
                            placeholder="تصنيف البند"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>ملاحظات</Label>
                      <Textarea
                        {...form.register(`items.${index}.notes`)}
                        placeholder="ملاحظات خاصة بهذا البند"
                        rows={2}
                      />
                    </div>

                    {/* AI Analysis Results */}
                    {aiAnalysisResults[index] && (
                      <div className="mt-4">
                        <div className={`p-4 rounded-lg border-l-4 ${
                          aiAnalysisResults[index].status === 'duplicate' 
                            ? 'border-yellow-500 bg-yellow-50' 
                            : 'border-green-500 bg-green-50'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            {aiAnalysisResults[index].status === 'duplicate' ? (
                              <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                            <span className="font-semibold">
                              {aiAnalysisResults[index].status === 'duplicate' 
                                ? 'بنود مشابهة موجودة' 
                                : 'بند جديد'}
                            </span>
                          </div>
                          <p className="text-sm mb-3">{aiAnalysisResults[index].recommendation}</p>
                          
                          {aiAnalysisResults[index].similarItems && 
                           aiAnalysisResults[index].similarItems!.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="font-medium">البنود المشابهة:</h5>
                              <div className="max-h-32 overflow-y-auto">
                                {aiAnalysisResults[index].similarItems!.map((item, idx) => (
                                  <div key={idx} className="text-xs p-2 bg-white rounded border">
                                    <div className="font-medium">{item.itemNumber}</div>
                                    <div className="text-gray-600">{item.description}</div>
                                    {item.partNumber && (
                                      <div className="text-gray-500">P/N: {item.partNumber}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Form actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={createQuotationMutation.isPending}
              className="min-w-[120px]"
            >
              {createQuotationMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  جاري الإنشاء...
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  إرسال للتسعير
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}