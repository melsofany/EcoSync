import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePricingPermissions } from "@/hooks/usePricingPermissions";
import { canViewPricing } from "../../../shared/permissions";
import { useAuth } from "@/hooks/useAuth";

// مثال لاستخدام صلاحيات الأسعار المنفصلة
export const PricingDisplayExample = () => {
  const { user } = useAuth();
  const pricing = usePricingPermissions();

  // بيانات تجريبية للأسعار
  const priceData = {
    salePrice: 1500,
    supplierPrice: 1200,
    purchaseOrderPrice: 1250,
    cost: 1100,
    margin: 25.5
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(price);
  };

  const PriceRow = ({ 
    label, 
    value, 
    canView, 
    type 
  }: { 
    label: string; 
    value: number; 
    canView: boolean; 
    type: string;
  }) => (
    <div className="flex justify-between items-center py-2 border-b">
      <span className="font-medium text-gray-700">{label}</span>
      {canView ? (
        <Badge variant="outline" className="font-mono">
          {type === 'margin' ? `${value}%` : formatPrice(value)}
        </Badge>
      ) : (
        <Badge variant="secondary" className="font-mono text-gray-400">
          ***
        </Badge>
      )}
    </div>
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">عرض الأسعار حسب الصلاحيات</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <PriceRow 
          label="سعر البيع" 
          value={priceData.salePrice}
          canView={pricing.canViewSalePrices}
          type="currency"
        />
        <PriceRow 
          label="سعر المورد" 
          value={priceData.supplierPrice}
          canView={pricing.canViewSupplierPrices}
          type="currency"
        />
        <PriceRow 
          label="سعر أمر الشراء" 
          value={priceData.purchaseOrderPrice}
          canView={pricing.canViewPurchaseOrderPrices}
          type="currency"
        />
        <PriceRow 
          label="سعر التكلفة" 
          value={priceData.cost}
          canView={pricing.canViewCosts}
          type="currency"
        />
        <PriceRow 
          label="هامش الربح" 
          value={priceData.margin}
          canView={pricing.canViewMargins}
          type="margin"
        />
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-sm text-gray-800 mb-2">صلاحياتك الحالية:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className={`w-2 h-2 rounded-full ${pricing.canViewSalePrices ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>أسعار البيع</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className={`w-2 h-2 rounded-full ${pricing.canViewSupplierPrices ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>أسعار الموردين</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className={`w-2 h-2 rounded-full ${pricing.canViewPurchaseOrderPrices ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>أوامر الشراء</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className={`w-2 h-2 rounded-full ${pricing.canViewMargins ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>هوامش الربح</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};