// Core types for the accounting system
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'invoicing_user' | 'contact';
  profileImage?: string;
}

export interface Contact {
  id: string;
  name: string;
  type: 'customer' | 'vendor' | 'both';
  email: string;
  mobile: string;
  address: {
    city: string;
    state: string;
    pincode: string;
  };
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  type: 'goods' | 'service';
  salesPrice: number;
  purchasePrice: number;
  saleTaxPercent: number;
  purchaseTaxPercent: number;
  hsnCode: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tax {
  id: string;
  name: string;
  computationMethod: 'percentage' | 'fixed';
  rate: number;
  applicableOn: 'sales' | 'purchase' | 'both';
  createdAt: Date;
  updatedAt: Date;
}

export interface ChartOfAccount {
  id: string;
  name: string;
  type: 'asset' | 'liability' | 'expense' | 'income' | 'equity';
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrder {
  id: string;
  vendorId: string;
  vendor: Contact;
  orderDate: Date;
  expectedDate: Date;
  status: 'draft' | 'confirmed' | 'billed' | 'cancelled';
  items: PurchaseOrderItem[];
  totalAmount: number;
  taxAmount: number;
  grandTotal: number;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  amount: number;
}

export interface VendorBill {
  id: string;
  purchaseOrderId?: string;
  vendorId: string;
  vendor: Contact;
  billNumber: string;
  billDate: Date;
  dueDate: Date;
  status: 'draft' | 'posted' | 'paid' | 'cancelled';
  items: VendorBillItem[];
  totalAmount: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
}

export interface VendorBillItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  amount: number;
}

export interface SalesOrder {
  id: string;
  customerId: string;
  customer: Contact;
  orderDate: Date;
  expectedDate: Date;
  status: 'draft' | 'confirmed' | 'invoiced' | 'cancelled';
  items: SalesOrderItem[];
  totalAmount: number;
  taxAmount: number;
  grandTotal: number;
}

export interface SalesOrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  amount: number;
}

export interface CustomerInvoice {
  id: string;
  salesOrderId?: string;
  customerId: string;
  customer: Contact;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  status: 'draft' | 'posted' | 'paid' | 'cancelled';
  items: CustomerInvoiceItem[];
  totalAmount: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
}

export interface CustomerInvoiceItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  amount: number;
}

export interface Payment {
  id: string;
  type: 'customer_payment' | 'vendor_payment';
  partnerId: string;
  partner: Contact;
  invoiceId?: string;
  billId?: string;
  amount: number;
  paymentMethod: 'cash' | 'bank';
  paymentDate: Date;
  reference: string;
  status: 'draft' | 'posted' | 'cancelled';
}