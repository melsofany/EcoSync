import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Save, Trash2, FileText, Calendar, User, Building } from "lucide-react";

interface QuotationItem {
  id?: string;
  description: string;
  partNumber: string;
  lineItem: string;
  uom: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

interface NewQuotation {
  clientName: string;
  rfqNumber: string;
  requestDate: string;
  expiryDate?: string;
  responsibleEmployee: string;
  items: QuotationItem[];
}

export default function CreateQuotation() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [quotation, setQuotation] = useState<NewQuotation>({
    clientName: '',
    rfqNumber: '',
    requestDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    responsibleEmployee: '',
    items: []
  });

  const [currentItem, setCurrentItem] = useState<QuotationItem>({
    description: '',
    partNumber: '',
    lineItem: '',
    uom: 'EACH',
    quantity: 1,
    unitPrice: 0,
    notes: ''
  });

  const createMutation = useMutation({
    mutationFn: async (data: NewQuotation) => {
      return await apiRequest('/api/quotations/google-sheets', 'POST', data);
    },
    onSuccess: (data) => {
      toast({
        title: "✅ تم إنشاء طلب التسعير",
        description: `تم حفظ الطلب ${data.rfqNumber} بنجاح مع ${data.itemsCount} بند`
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
      navigate('/quotations');
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ في إنشاء طلب التسعير",
        description: error.data?.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    }
  });

  const handleAddItem = () => {
    if (!currentItem.description.trim()) {
      toast({
        title: "❌ خطأ",
        description: "يجب إدخال وصف البند",
        variant: "destructive"
      });
      return;
    }

    if (currentItem.quantity <= 0) {
      toast({
        title: "❌ خطأ",
        description: "يجب أن تكون الكمية أكبر من صفر",
        variant: "destructive"
      });
      return;
    }

    const newItem = { 
      ...currentItem, 
      id: Math.random().toString(36).substr(2, 9)
    };

    setQuotation(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    // إعادة تعيين النموذج
    setCurrentItem({
      description: '',
      partNumber: '',
      lineItem: '',
      uom: 'EACH',
      quantity: 1,
      unitPrice: 0,
      notes: ''
    });

    toast({
      title: "✅ تم إضافة البند",
      description: `تم إضافة "${newItem.description}" للطلب`
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setQuotation(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
    
    toast({
      title: "🗑️ تم حذف البند",
      description: "تم إزالة البند من الطلب"
    });
  };

  const handleSubmit = () => {
    // التحقق من صحة البيانات
    if (!quotation.clientName.trim()) {
      toast({
        title: "❌ خطأ",
        description: "يجب إدخال اسم العميل",
        variant: "destructive"
      });
      return;
    }

    if (!quotation.rfqNumber.trim()) {
      toast({
        title: "❌ خطأ",
        description: "يجب إدخال رقم الطلب",
        variant: "destructive"
      });
      return;
    }

    if (quotation.items.length === 0) {
      toast({
        title: "❌ خطأ",
        description: "يجب إضافة بند واحد على الأقل",
        variant: "destructive"
      });
      return;
    }

    createMutation.mutate(quotation);
  };

  const totalItems = quotation.items.length;
  const totalValue = quotation.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3 space-x-reverse">
            <FileText className="h-8 w-8 text-blue-600" />
            <span>إنشاء طلب تسعير جديد</span>
          </h1>
          <p className="text-gray-600 mt-2">أضف طلب تسعير جديد إلى Google Sheets مع مطابقة ذكية للبنود</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/quotations')}
          className="flex items-center space-x-2 space-x-reverse"
        >
          <span>العودة للقائمة</span>
        </Button>
      </div>

      {/* معلومات طلب التسعير */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Building className="h-5 w-5" />
            <span>معلومات أساسية</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="clientName">اسم العميل *</Label>
              <Input
                id="clientName"
                value={quotation.clientName}
                onChange={(e) => setQuotation(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="أدخل اسم العميل"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="rfqNumber">رقم طلب التسعير *</Label>
              <Input
                id="rfqNumber"
                value={quotation.rfqNumber}
                onChange={(e) => setQuotation(prev => ({ ...prev, rfqNumber: e.target.value }))}
                placeholder="مثال: 25R000001"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="responsibleEmployee">الموظف المسؤول</Label>
              <Input
                id="responsibleEmployee"
                value={quotation.responsibleEmployee}
                onChange={(e) => setQuotation(prev => ({ ...prev, responsibleEmployee: e.target.value }))}
                placeholder="اسم الموظف"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="requestDate">تاريخ الطلب *</Label>
              <Input
                id="requestDate"
                type="date"
                value={quotation.requestDate}
                onChange={(e) => setQuotation(prev => ({ ...prev, requestDate: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="expiryDate">تاريخ انتهاء العرض</Label>
              <Input
                id="expiryDate"
                type="date"
                value={quotation.expiryDate}
                onChange={(e) => setQuotation(prev => ({ ...prev, expiryDate: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إضافة بند جديد */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Plus className="h-5 w-5" />
            <span>إضافة بند جديد</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="lg:col-span-2">
              <Label htmlFor="description">الوصف *</Label>
              <Textarea
                id="description"
                value={currentItem.description}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف مفصل للبند"
                className="mt-1 min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="partNumber">رقم القطعة</Label>
              <Input
                id="partNumber"
                value={currentItem.partNumber}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, partNumber: e.target.value }))}
                placeholder="Part Number"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="lineItem">LINE ITEM</Label>
              <Input
                id="lineItem"
                value={currentItem.lineItem}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, lineItem: e.target.value }))}
                placeholder="Line Item Code"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="uom">الوحدة</Label>
              <Select
                value={currentItem.uom}
                onValueChange={(value) => setCurrentItem(prev => ({ ...prev, uom: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EACH">EACH</SelectItem>
                  <SelectItem value="KG">KG</SelectItem>
                  <SelectItem value="METER">METER</SelectItem>
                  <SelectItem value="LITER">LITER</SelectItem>
                  <SelectItem value="SET">SET</SelectItem>
                  <SelectItem value="PACK">PACK</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">الكمية *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                step="1"
                value={currentItem.quantity}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="unitPrice">السعر الوحدة</Label>
              <Input
                id="unitPrice"
                type="number"
                min="0"
                step="0.01"
                value={currentItem.unitPrice}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="notes">ملاحظات</Label>
              <Input
                id="notes"
                value={currentItem.notes}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="ملاحظات إضافية"
                className="mt-1"
              />
            </div>
          </div>

          <Button
            onClick={handleAddItem}
            className="flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة البند</span>
          </Button>
        </CardContent>
      </Card>

      {/* قائمة البنود */}
      {quotation.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <FileText className="h-5 w-5" />
                <span>بنود طلب التسعير</span>
              </div>
              <Badge variant="outline">
                {totalItems} بند
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الوصف</TableHead>
                  <TableHead>رقم القطعة</TableHead>
                  <TableHead>LINE ITEM</TableHead>
                  <TableHead>الوحدة</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>الإجمالي</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotation.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="max-w-md">
                        <p className="font-medium text-gray-800 text-sm leading-tight">
                          {item.description}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.partNumber || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.lineItem || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.uom}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-left" dir="ltr">
                      {item.unitPrice.toLocaleString('en-US', { 
                        style: 'currency', 
                        currency: 'EGP',
                        minimumFractionDigits: 2
                      })}
                    </TableCell>
                    <TableCell className="text-left font-medium" dir="ltr">
                      {(item.quantity * item.unitPrice).toLocaleString('en-US', { 
                        style: 'currency', 
                        currency: 'EGP',
                        minimumFractionDigits: 2
                      })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="flex justify-between items-center">
                <div className="text-lg font-semibold text-gray-800">
                  إجمالي القيمة المقدرة:
                </div>
                <div className="text-xl font-bold text-green-600" dir="ltr">
                  {totalValue.toLocaleString('en-US', { 
                    style: 'currency', 
                    currency: 'EGP',
                    minimumFractionDigits: 2
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* أزرار الإجراءات */}
      <div className="flex justify-end space-x-4 space-x-reverse">
        <Button
          variant="outline"
          onClick={() => navigate('/quotations')}
        >
          إلغاء
        </Button>
        
        <Button
          onClick={handleSubmit}
          disabled={createMutation.isPending || quotation.items.length === 0}
          className="flex items-center space-x-2 space-x-reverse"
        >
          {createMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <span>جاري الحفظ...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>حفظ طلب التسعير</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}