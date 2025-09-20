import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Lightweight local (in-memory) purchase module state. In a real app this would
// call backend endpoints; here we keep it client side so UI flows can be built
// and exercised without server support yet.

export type PurchaseLine = {
  id: string;
  product: string; // For now just store name; could be productId later
  quantity: number;
  unitPrice: number;
  taxPercent: number; // e.g. 18
  hsn?: string;
  accountName?: string;
};

export type PurchaseOrderData = {
  id: string;              // internal id (uuid)
  number: string;          // display number P00001 style sequence
  reference?: string;      // external reference entered by user
  vendor: string;          // vendor name placeholder
  date: string;            // ISO date (yyyy-mm-dd)
  status: 'draft' | 'confirmed' | 'billed' | 'cancelled';
  lines: PurchaseLine[];
};

export type VendorBillData = {
  id: string;
  number: string;          // BILL/<year>/<seq>
  vendor: string;
  date: string;            // bill date
  dueDate?: string;
  reference?: string;
  poId?: string;           // reference to PO
  status: 'draft' | 'posted' | 'paid' | 'cancelled';
  lines: PurchaseLine[];
  paidAmount: number;      // cumulative payments
};

export type BillPaymentData = {
  id: string;
  number: string;          // PAY/<yy>/<seq>
  date: string;
  partner: string;         // vendor name
  amount: number;          // amount being paid
  paymentType: 'send' | 'receive';
  partnerType: 'vendor' | 'customer';
  method: 'cash' | 'bank';
  note?: string;
  billId: string;          // associated bill
  status: 'draft' | 'posted' | 'cancelled';
};

interface PurchaseContextValue {
  purchaseOrders: PurchaseOrderData[];
  vendorBills: VendorBillData[];
  billPayments: BillPaymentData[];
  createPurchaseOrder(vendor?: string): PurchaseOrderData;
  updatePurchaseOrder(id: string, patch: Partial<Omit<PurchaseOrderData, 'id' | 'number' | 'status'>>): void;
  setPurchaseOrderLines(id: string, lines: PurchaseLine[]): void;
  confirmPurchaseOrder(id: string): void;
  cancelPurchaseOrder(id: string): void;
  markPOBilled(id: string): void;
  createBillFromPO(poId: string): VendorBillData | undefined;
  createVendorBill(data: { vendor: string; poId?: string; lines?: PurchaseLine[]; date?: string }): VendorBillData;
  updateVendorBill(id: string, patch: Partial<Omit<VendorBillData, 'id' | 'number' | 'status'>>): void;
  setVendorBillLines(id: string, lines: PurchaseLine[]): void;
  postVendorBill(id: string): void; // draft -> posted
  payVendorBill(id: string, amount: number): void; // posted -> maybe paid
  cancelVendorBill(id: string): void;
  createPaymentFromBill(billId: string, method?: 'cash' | 'bank'): BillPaymentData | undefined;
  postBillPayment(paymentId: string): void;
  cancelBillPayment(paymentId: string): void;
  updateBillPayment(paymentId: string, patch: Partial<Pick<BillPaymentData, 'method' | 'note' | 'amount'>>): void;
  computeLineAmounts(line: PurchaseLine): { untaxed: number; tax: number; total: number };
  computeTotals(lines: PurchaseLine[]): { untaxed: number; tax: number; total: number };
  formatCurrency(v: number): string;
}

const PurchaseContext = createContext<PurchaseContextValue | undefined>(undefined);

export const PurchaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderData[]>([]);
  const [vendorBills, setVendorBills] = useState<VendorBillData[]>([]);
  const [billPayments, setBillPayments] = useState<BillPaymentData[]>([]);
  const billSeqYearRef = useRef<string>(new Date().getFullYear().toString());
  const billSeqRef = useRef<number>(0);
  const poSeqRef = useRef<number>(0);
  const poRefYearRef = useRef<string>(new Date().getFullYear().toString().slice(-2));
  const poRefSeqRef = useRef<number>(0);
  const billRefYearRef = useRef<string>(new Date().getFullYear().toString().slice(-2));
  const billRefSeqRef = useRef<number>(0);
  const payRefYearRef = useRef<string>(new Date().getFullYear().toString().slice(-2));
  const paySeqRef = useRef<number>(0);


  const generateBillNumber = () => {
    const year = new Date().getFullYear().toString();
    if (billSeqYearRef.current !== year) {
      billSeqYearRef.current = year;
      billSeqRef.current = 0;
    }
    billSeqRef.current += 1;
    return `BILL/${year}/${billSeqRef.current.toString().padStart(4, '0')}`;
  };

  const nextBillReference = () => {
    const yy = new Date().getFullYear().toString().slice(-2);
    if (billRefYearRef.current !== yy) {
      billRefYearRef.current = yy; billRefSeqRef.current = 0;
    }
    billRefSeqRef.current += 1;
    return `SUP-${yy}-${billRefSeqRef.current.toString().padStart(4,'0')}`;
  };

  const nextPaymentNumber = () => {
    const yy = new Date().getFullYear().toString().slice(-2);
    if (payRefYearRef.current !== yy) { payRefYearRef.current = yy; paySeqRef.current = 0; }
    paySeqRef.current += 1;
    return `PAY/${yy}/${paySeqRef.current.toString().padStart(4,'0')}`;
  };

  const nextPONumber = () => {
    poSeqRef.current += 1;
    return `P${poSeqRef.current.toString().padStart(5, '0')}`;
  };

  const nextPOReference = () => {
    const yy = new Date().getFullYear().toString().slice(-2);
    if (poRefYearRef.current !== yy) {
      poRefYearRef.current = yy;
      poRefSeqRef.current = 0;
    }
    poRefSeqRef.current += 1;
    return `REQ-${yy}-${poRefSeqRef.current.toString().padStart(4,'0')}`;
  };

  const createPurchaseOrder = (vendor: string = 'Azure Interior'): PurchaseOrderData => {
    const po: PurchaseOrderData = {
      id: uuidv4(),
      number: nextPONumber(),
      reference: nextPOReference(),
      vendor,
      date: new Date().toISOString().slice(0, 10),
      status: 'draft',
      lines: [
        { id: uuidv4(), product: 'Sample Item', quantity: 1, unitPrice: 0, taxPercent: 18 }
      ]
    };
    setPurchaseOrders(prev => [po, ...prev]);
    return po;
  };

  const updatePurchaseOrder = (id: string, patch: Partial<Omit<PurchaseOrderData, 'id' | 'number' | 'status'>>) => {
    setPurchaseOrders(prev => prev.map(po => po.id === id ? { ...po, ...patch } : po));
  };

  const setPurchaseOrderLines = (id: string, lines: PurchaseLine[]) => {
    setPurchaseOrders(prev => prev.map(po => po.id === id ? { ...po, lines } : po));
  };

  const confirmPurchaseOrder = (id: string) => setPurchaseOrders(prev => prev.map(po => po.id === id ? { ...po, status: 'confirmed' } : po));
  const cancelPurchaseOrder = (id: string) => setPurchaseOrders(prev => prev.map(po => po.id === id ? { ...po, status: 'cancelled' } : po));
  const markPOBilled = (id: string) => setPurchaseOrders(prev => prev.map(po => po.id === id ? { ...po, status: 'billed' } : po));

  const createVendorBill = ({ vendor, poId, lines = [], date, dueDate }: { vendor: string; poId?: string; lines?: PurchaseLine[]; date?: string; dueDate?: string; }): VendorBillData => {
    const bill: VendorBillData = {
      id: uuidv4(),
      number: generateBillNumber(),
      vendor,
      date: date || new Date().toISOString().slice(0, 10),
      dueDate: dueDate || new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0,10),
      reference: nextBillReference(),
      poId,
      status: 'draft',
      lines: lines.length ? lines : [ { id: uuidv4(), product: 'Sample Item', quantity: 1, unitPrice: 0, taxPercent: 18 } ],
      paidAmount: 0
    };
    setVendorBills(prev => [bill, ...prev]);
    return bill;
  };

  const createBillFromPO = (poId: string): VendorBillData | undefined => {
    const po = purchaseOrders.find(p => p.id === poId && p.status === 'confirmed');
    if (!po) return undefined;
    const bill = createVendorBill({ vendor: po.vendor, poId: po.id, lines: po.lines.map(l => ({ ...l, id: uuidv4() })) });
    markPOBilled(po.id);
    return bill;
  };

  const updateVendorBill = (id: string, patch: Partial<Omit<VendorBillData, 'id' | 'number' | 'status'>>) => {
    setVendorBills(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
  };

  const setVendorBillLines = (id: string, lines: PurchaseLine[]) => {
    setVendorBills(prev => prev.map(b => b.id === id ? { ...b, lines } : b));
  };

  const postVendorBill = (id: string) => setVendorBills(prev => prev.map(b => b.id === id ? { ...b, status: 'posted' } : b));
  const cancelVendorBill = (id: string) => setVendorBills(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
  const payVendorBill = (id: string, amount: number) => setVendorBills(prev => prev.map(b => {
    if (b.id !== id) return b;
    const totals = computeTotals(b.lines);
    const newPaid = Math.min(totals.total, b.paidAmount + amount);
    return { ...b, paidAmount: newPaid, status: newPaid >= totals.total ? 'paid' : b.status };
  }));

  const createPaymentFromBill = (billId: string, method: 'cash' | 'bank' = 'bank'): BillPaymentData | undefined => {
    const bill = vendorBills.find(b => b.id === billId && (b.status === 'posted' || b.status === 'paid'));
    if (!bill) return undefined;
    const totals = computeTotals(bill.lines);
    const remaining = totals.total - bill.paidAmount;
    if (remaining <= 0) return undefined;
    const payment: BillPaymentData = {
      id: uuidv4(),
      number: nextPaymentNumber(),
      date: new Date().toISOString().slice(0,10),
      partner: bill.vendor,
      amount: remaining,
      paymentType: 'send',
      partnerType: 'vendor',
      method,
      billId: bill.id,
      status: 'draft'
    };
    setBillPayments(prev => [payment, ...prev]);
    return payment;
  };

  const postBillPayment = (paymentId: string) => {
    setBillPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'posted' } : p));
    const payment = billPayments.find(p => p.id === paymentId);
    if (payment) {
      payVendorBill(payment.billId, payment.amount);
    }
  };

  const cancelBillPayment = (paymentId: string) => setBillPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'cancelled' } : p));

  const updateBillPayment = (paymentId: string, patch: Partial<Pick<BillPaymentData, 'method' | 'note' | 'amount'>>) => {
    setBillPayments(prev => prev.map(p => p.id === paymentId ? { ...p, ...patch } : p));
  };

  const computeLineAmounts = (line: PurchaseLine) => {
    const untaxed = line.quantity * line.unitPrice;
    const tax = untaxed * (line.taxPercent / 100);
    return { untaxed, tax, total: untaxed + tax };
  };

  const computeTotals = (lines: PurchaseLine[]) => {
    return lines.reduce((acc, l) => {
      const a = computeLineAmounts(l);
      acc.untaxed += a.untaxed;
      acc.tax += a.tax;
      acc.total += a.total;
      return acc;
    }, { untaxed: 0, tax: 0, total: 0 });
  };

  const formatCurrency = (v: number) => {
    // Show up to 1 decimal if necessary else integer, matching wireframe style (e.g., 16,350 not 16,350.00)
    const hasDecimal = Math.abs(v % 1) > 0.0001;
    const formatted = v.toLocaleString(undefined, { minimumFractionDigits: hasDecimal ? 1 : 0, maximumFractionDigits: hasDecimal ? 1 : 0 });
    return formatted;
  };

  const value = useMemo<PurchaseContextValue>(() => ({
    purchaseOrders,
    vendorBills,
  billPayments,
    createPurchaseOrder,
    updatePurchaseOrder,
    setPurchaseOrderLines,
    confirmPurchaseOrder,
    cancelPurchaseOrder,
    markPOBilled,
    createBillFromPO,
    createVendorBill,
    updateVendorBill,
    setVendorBillLines,
    postVendorBill,
    payVendorBill,
    cancelVendorBill,
    createPaymentFromBill,
    postBillPayment,
    cancelBillPayment,
  updateBillPayment,
    computeLineAmounts,
    computeTotals,
    formatCurrency
  }), [purchaseOrders, vendorBills, billPayments]);

  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
};

export const usePurchase = () => {
  const ctx = useContext(PurchaseContext);
  if (!ctx) throw new Error('usePurchase must be used within PurchaseProvider');
  return ctx;
};
