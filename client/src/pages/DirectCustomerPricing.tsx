import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function DirectCustomerPricing() {
  const [itemNumber, setItemNumber] = useState('');
  const [customerPrice, setCustomerPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<{item: string, price: string, row: number} | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemNumber || !customerPrice) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال رقم البند والسعر",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/customer-pricing-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemNumber: itemNumber.toUpperCase(),
          customerPrice: customerPrice,
          rfqNumber: ''
        })
      });

      const data = await response.json();

      if (response.ok) {
        setLastSaved({
          item: itemNumber,
          price: customerPrice,
          row: data.row
        });
        
        toast({
          title: "✅ تم الحفظ بنجاح",
          description: `تم حفظ السعر ${customerPrice} للبند ${itemNumber} في الصف ${data.row}`,
        });
        
        // مسح الحقول
        setItemNumber('');
        setCustomerPrice('');
      } else {
        throw new Error(data.message || 'فشل الحفظ');
      }
    } catch (error: any) {
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل حفظ السعر",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // قائمة بأمثلة للاختبار السريع
  const testItems = [
    { item: 'P-0000017', price: '3500' },
    { item: 'P-0000001', price: '1200' },
    { item: 'P-0000002', price: '2500' },
    { item: 'P-0001614', price: '4800' },
    { item: 'P-0001615', price: '6700' }
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-center">🎯 حفظ تسعير العملاء المباشر</h1>
          <p className="text-center text-gray-600 mt-2">
            حفظ مباشر لأسعار العملاء في Google Sheets بدون تسجيل دخول
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">رقم البند</label>
              <Input
                type="text"
                value={itemNumber}
                onChange={(e) => setItemNumber(e.target.value)}
                placeholder="مثال: P-0000017"
                className="text-lg"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">سعر العميل</label>
              <Input
                type="number"
                value={customerPrice}
                onChange={(e) => setCustomerPrice(e.target.value)}
                placeholder="مثال: 3500"
                className="text-lg"
                disabled={isSubmitting}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full text-lg py-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? '⏳ جاري الحفظ...' : '💾 حفظ السعر في Google Sheets'}
            </Button>
          </form>

          {/* نتيجة آخر حفظ */}
          {lastSaved && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">✅ آخر عملية حفظ ناجحة:</h3>
              <div className="text-sm space-y-1">
                <p>البند: <span className="font-bold">{lastSaved.item}</span></p>
                <p>السعر: <span className="font-bold">{lastSaved.price}</span></p>
                <p>رقم الصف في Google Sheets: <span className="font-bold">{lastSaved.row}</span></p>
              </div>
            </div>
          )}

          {/* أمثلة للاختبار السريع */}
          <div className="mt-8">
            <h3 className="font-semibold mb-3">🚀 اختبار سريع - اضغط على أي مثال:</h3>
            <div className="grid grid-cols-2 gap-2">
              {testItems.map((test, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setItemNumber(test.item);
                    setCustomerPrice(test.price);
                  }}
                  disabled={isSubmitting}
                >
                  {test.item} ← {test.price} ج.م
                </Button>
              ))}
            </div>
          </div>

          {/* تعليمات */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">📋 تعليمات الاستخدام:</h3>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>أدخل رقم البند (مثل P-0000017)</li>
              <li>أدخل سعر العميل</li>
              <li>اضغط على زر الحفظ</li>
              <li>السعر سيُحفظ مباشرة في العمود I في Google Sheets</li>
              <li>ستظهر رسالة تأكيد مع رقم الصف</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}