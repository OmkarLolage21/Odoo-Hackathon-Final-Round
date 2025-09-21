// Core types for the accounting system
export type AppRole = 'admin' | 'invoicing_user' | 'contact';

export interface User {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  profileImage?: string;
  username?: string;
  full_name?: string;
  is_active?: boolean;
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

// Backend API representations (snake_case fields, timestamps as ISO strings)
export interface ContactResponse {
  id: string;
  name: string;
  type: 'customer' | 'vendor' | 'both';
  email: string | null;
  mobile: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_pincode?: string | null;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateContactRequest {
  name: string;
  type: 'customer' | 'vendor' | 'both';
  email?: string | null;
  mobile?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_pincode?: string | null;
}

export interface Product {
  id: string;
  name: string;
  type: 'goods' | 'service';
  salesPrice: number;
  purchasePrice: number;
  taxName?: string | null;
  salesTaxPercent?: number; // derived from taxName lookup
  purchaseTaxPercent?: number; // derived from taxName lookup
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

export interface AccountResponse {
  id: string;
  name: string;
  type: 'asset' | 'liability' | 'expense' | 'income' | 'equity';
  parent_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AccountCreateRequest {
  name: string;
  type: 'asset' | 'liability' | 'expense' | 'income' | 'equity';
  parent_id?: string | null;
}

export interface AccountUpdateRequest {
  name?: string;
  type?: 'asset' | 'liability' | 'expense' | 'income' | 'equity';
  parent_id?: string | null;
}

// =====================
// Sales Orders
// =====================

export interface SalesOrderLineInput {
  product_name: string; // entering by product name per requirement
  quantity: number;
  unit_price: number;
}

export interface SalesOrderLine extends SalesOrderLineInput {
  id: string;
  product_id: string;
  tax_percent: number;
  untaxed_amount: number;
  tax_amount: number;
  total_amount: number;
}

export interface SalesOrderCreateRequest {
  lines: SalesOrderLineInput[];
}

export interface SalesOrderUpdateRequest {
  status?: 'draft' | 'confirmed' | 'cancelled';
  lines?: SalesOrderLineInput[]; // full replacement
}

export interface SalesOrderResponse {
  id: string;
  so_number: string;
  status: 'draft' | 'confirmed' | 'cancelled';
  total_untaxed: number;
  total_tax: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  lines: SalesOrderLine[];
}

// =====================
// Purchase Orders (API-backed new implementation)
// =====================

export interface PurchaseOrderLineInput {
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface PurchaseOrderLine extends PurchaseOrderLineInput {
  id: string;
  product_id: string;
  tax_percent: number;
  untaxed_amount: number;
  tax_amount: number;
  total_amount: number;
}

export interface PurchaseOrderCreateRequest {
  vendor_name?: string | null;
  lines: PurchaseOrderLineInput[];
}

export interface PurchaseOrderResponse {
  id: string;
  po_number: string;
  vendor_name?: string | null;
  status: 'draft' | 'confirmed' | 'cancelled';
  total_untaxed: number;
  total_tax: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  lines: PurchaseOrderLine[];
}

// =====================
// Customer Invoices (API-backed)
// =====================

export interface CustomerInvoiceLineInput {
  product_name: string; // user enters product name or choose via dropdown
  quantity: number;
  unit_price: number;
  product_id?: string; // optional when chosen via dropdown
  account_id?: string | null; // optional from COA dropdown
}

export interface CustomerInvoiceLine extends CustomerInvoiceLineInput {
  id: string;
  product_id: string;
  hsn_code?: string | null;
  tax_percent: number;
  untaxed_amount: number;
  tax_amount: number;
  total_amount: number;
}

export interface CustomerInvoiceCreateRequest {
  status?: 'draft' | 'posted' | 'paid' | 'cancelled'; // default draft
  customer_id?: string | null;
  customer_name?: string | null; // free text field
  invoice_date?: string | null; // ISO date (yyyy-mm-dd)
  due_date?: string | null; // ISO date (yyyy-mm-dd)
  lines: CustomerInvoiceLineInput[];
}

export interface CustomerInvoiceResponse {
  id: string;
  invoice_number: string; // uuid string from backend (for now)
  status: 'draft' | 'posted' | 'paid' | 'cancelled';
  customer_id?: string | null;
  customer_name?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
  total_untaxed: number;
  total_tax: number;
  total_amount: number;
  amount_paid: number;
  created_at: string;
  updated_at: string;
  lines: CustomerInvoiceLine[];
}