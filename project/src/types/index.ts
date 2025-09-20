export interface Product {
  id: string;
  name: string;
  type: 'goods' | 'service';
  salesPrice: number;
  purchasePrice: number;
  taxName?: string | null;
  salesTaxPercent?: number; // derived
  purchaseTaxPercent?: number; // derived
  hsnCode?: string;
  category?: string;
  currentStock: number;
  createdAt?: string;
  updatedAt?: string;
}
