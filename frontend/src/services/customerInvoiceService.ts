import apiClient from '../utils/apiClient';
import { CustomerInvoiceCreateRequest, CustomerInvoiceResponse } from '../types';

const BASE_PATH = '/api/v1/customer-invoices';

const roleHeader = (role?: string) => ({ 'X-User-Role': role || '' });

class CustomerInvoiceService {
  async list(role?: string) {
    const data = await apiClient.get<CustomerInvoiceResponse[]>(BASE_PATH, { headers: roleHeader(role) });
    return data;
  }

  async create(payload: CustomerInvoiceCreateRequest, role?: string) {
    const data = await apiClient.post<CustomerInvoiceResponse>(BASE_PATH, payload, { headers: roleHeader(role) });
    return data;
  }

  async get(id: string, role?: string) {
    const data = await apiClient.get<CustomerInvoiceResponse>(`${BASE_PATH}/${id}`, { headers: roleHeader(role) });
    return data;
  }
}

export const customerInvoiceService = new CustomerInvoiceService();
export default customerInvoiceService;
