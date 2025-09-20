import api from '../utils/apiClient';

const BASE_PATH = '/api/v1/vendor-bills';
const roleHeader = (role?: string) => ({ 'X-User-Role': role || (localStorage.getItem('user_role') || '') });

export type VendorBillLineIn = {
  product_name: string;
  quantity: number;
  unit_price: number;
  product_id?: string;
};

export type VendorBillCreateIn = {
  vendor_name?: string;
  bill_reference?: string;
  bill_date?: string; // yyyy-mm-dd
  due_date?: string;  // yyyy-mm-dd
  purchase_order_id?: string;
  lines: VendorBillLineIn[];
};

export async function createVendorBill(payload: VendorBillCreateIn, role?: string) {
  return api.post(BASE_PATH, payload, { headers: roleHeader(role) });
}

export async function listVendorBills(role?: string) {
  return api.get(BASE_PATH, { headers: roleHeader(role) });
}

export async function getVendorBill(id: string, role?: string) {
  return api.get(`${BASE_PATH}/${id}`, { headers: roleHeader(role) });
}
