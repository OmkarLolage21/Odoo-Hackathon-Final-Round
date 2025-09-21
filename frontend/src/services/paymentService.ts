import apiClient from '../utils/apiClient';
import { PaymentCreateRequest, PaymentResponse, PaymentUpdateRequest } from '../types';

const BASE_PATH = '/api/v1/payments';
const roleHeader = (role?: string) => ({ 'X-User-Role': role || '' });

class PaymentService {
  async list(role?: string) {
    return apiClient.get<PaymentResponse[]>(BASE_PATH, { headers: roleHeader(role) });
  }
  async get(id: string, role?: string) {
    return apiClient.get<PaymentResponse>(`${BASE_PATH}/${id}`, { headers: roleHeader(role) });
  }
  async create(payload: PaymentCreateRequest, role?: string) {
    return apiClient.post<PaymentResponse>(BASE_PATH, payload, { headers: roleHeader(role) });
  }
  async update(id: string, payload: PaymentUpdateRequest, role?: string) {
    return apiClient.put<PaymentResponse>(`${BASE_PATH}/${id}`, payload, { headers: roleHeader(role) });
  }
}

export const paymentService = new PaymentService();
export default paymentService;