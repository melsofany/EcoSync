// Types for the application
export interface Quotation {
  id: string;
  requestNumber: string;
  customRequestNumber?: string;
  clientId: string;
  clientName?: string;
  requestDate: string;
  expiryDate?: string;
  status: string;
  notes?: string;
  createdAt?: string;
  items?: QuotationItemWithDetails[];
}

export interface QuotationItemWithDetails {
  id: string;
  itemId: string;
  quotationId: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  // Item details
  itemNumber?: string;
  kItemId?: string;
  partNumber?: string;
  lineItem?: string;
  description?: string;
  unit?: string;
  category?: string;
  brand?: string;
  // Supplier details
  supplier?: string;
  supplierPricing?: {
    unitPrice: number;
    supplier: {
      name: string;
    };
  };
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Item {
  id: string;
  itemNumber: string;
  kItemId: string;
  partNumber?: string;
  lineItem?: string;
  description: string;
  unit: string;
  category?: string;
  brand?: string;
}

export interface POItem {
  itemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}