import { Payment, PaymentCreateInput } from '../types';

interface PaymentApiModel {
  id: string;
  payment_number: string;
  status: 'draft' | 'posted' | 'cancelled';
  partner_type: 'vendor' | 'customer';
  partner_name?: string | null;
  payment_method: 'cash' | 'bank';
  amount: number;
  payment_date: string;
  vendor_bill_id?: string | null;
  customer_invoice_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

const API_BASE = '/api/v1/payments';

function mapFromApi(api: PaymentApiModel): Payment {
  return {
    id: api.id,
    paymentNumber: api.payment_number,
    status: api.status,
    partnerType: api.partner_type,
    partnerName: api.partner_name,
    paymentMethod: api.payment_method,
    amount: api.amount,
    paymentDate: api.payment_date,
    vendorBillId: api.vendor_bill_id,
    customerInvoiceId: api.customer_invoice_id,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

function mapToApi(payload: PaymentCreateInput): Partial<PaymentApiModel> {
  return {
    partner_type: payload.partnerType,
    partner_name: payload.partnerName ?? null,
    payment_method: payload.paymentMethod,
    amount: payload.amount,
    vendor_bill_id: payload.vendorBillId ?? null,
    customer_invoice_id: payload.customerInvoiceId ?? null,
  };
}

async function request<T>(url: string, options: RequestInit & { role?: string } = {}): Promise<T> {
  const { role, ...fetchOptions } = options;
  const res = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers || {}),
      ...(role ? { 'X-User-Role': role } : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export async function createPayment(payload: PaymentCreateInput, role: string): Promise<Payment> {
  const data = await request<PaymentApiModel>(API_BASE, {
    method: 'POST',
    role,
    body: JSON.stringify(mapToApi(payload)),
  });
  return mapFromApi(data);
}

export async function listPayments(role: string): Promise<Payment[]> {
  const data = await request<PaymentApiModel[]>(API_BASE, { role });
  return data.map(mapFromApi);
}

export async function getPayment(id: string, role: string): Promise<Payment> {
  const data = await request<PaymentApiModel>(`${API_BASE}/${id}`, { role });
  return mapFromApi(data);
}

export async function updatePaymentStatus(id: string, status: 'draft' | 'posted' | 'cancelled', role: string): Promise<Payment> {
  const data = await request<PaymentApiModel>(`${API_BASE}/${id}`, {
    method: 'PUT',
    role,
    body: JSON.stringify({ status }),
  });
  return mapFromApi(data);
}
