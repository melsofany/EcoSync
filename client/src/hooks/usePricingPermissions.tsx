import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { canViewPricing } from "../../../shared/permissions";

// Hook لاستخدام صلاحيات الأسعار
export const usePricingPermissions = () => {
  const { user } = useAuth();

  return {
    canViewSalePrices: canViewPricing(user, 'salePrices'),
    canViewSupplierPrices: canViewPricing(user, 'supplierPrices'),
    canViewPurchaseOrderPrices: canViewPricing(user, 'purchaseOrderPrices'),
    canViewCosts: canViewPricing(user, 'costs'), 
    canViewMargins: canViewPricing(user, 'margins'),
    canViewAnyPricing: canViewPricing(user, 'salePrices') || canViewPricing(user, 'supplierPrices') || canViewPricing(user, 'purchaseOrderPrices') || canViewPricing(user, 'costs') || canViewPricing(user, 'margins')
  };
};

// مكون لإخفاء/إظهار المحتوى حسب صلاحية الأسعار
interface PricingGuardProps {
  children: React.ReactNode;
  type?: 'salePrices' | 'supplierPrices' | 'purchaseOrderPrices' | 'costs' | 'margins';
  fallback?: React.ReactNode;
}

export const PricingGuard = ({ 
  children, 
  type = 'salePrices', 
  fallback = null 
}: PricingGuardProps) => {
  const { user } = useAuth();
  
  if (!canViewPricing(user, type)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

// مكون لعرض النص البديل عند عدم وجود صلاحية
interface PriceDisplayProps {
  value: number | string;
  type?: 'salePrices' | 'supplierPrices' | 'purchaseOrderPrices' | 'costs' | 'margins';
  format?: 'currency' | 'percentage' | 'number';
  placeholder?: string;
}

export const PriceDisplay = ({ 
  value, 
  type = 'salePrices',
  format = 'currency',
  placeholder = '***'
}: PriceDisplayProps) => {
  const { user } = useAuth();
  
  if (!canViewPricing(user, type)) {
    return <span className="text-gray-400 font-mono">{placeholder}</span>;
  }
  
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('ar-SA', {
          style: 'currency',
          currency: 'SAR'
        }).format(val);
      case 'percentage':
        return `${val.toFixed(2)}%`;
      case 'number':
        return new Intl.NumberFormat('ar-SA').format(val);
      default:
        return val.toString();
    }
  };
  
  return <span>{formatValue(value)}</span>;
};