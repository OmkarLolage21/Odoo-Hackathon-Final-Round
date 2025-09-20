import apiClient from '../utils/apiClient';
import { SalesOrderCreateRequest, SalesOrderResponse, SalesOrderUpdateRequest } from '../types';

const BASE_PATH = '/api/v1/sales-orders';
const roleHeader = (role?: string) => ({ 'X-User-Role': role || '' });

class SalesOrderService {
  async createDraft(payload: SalesOrderCreateRequest, role?: string) {
    return apiClient.post<SalesOrderResponse>(BASE_PATH, payload, { headers: roleHeader(role) });
  }
  async list(role?: string) {
    return apiClient.get<SalesOrderResponse[]>(BASE_PATH, { headers: roleHeader(role) });
  }
  async get(id: string, role?: string) {
    return apiClient.get<SalesOrderResponse>(`${BASE_PATH}/${id}`, { headers: roleHeader(role) });
  }
  async update(id: string, payload: SalesOrderUpdateRequest, role?: string) {
    return apiClient.put<SalesOrderResponse>(`${BASE_PATH}/${id}`, payload, { headers: roleHeader(role) });
  }
  async delete(id: string, role?: string) {
    return apiClient.delete<void>(`${BASE_PATH}/${id}`, { headers: roleHeader(role) });
  }
}

export const salesOrderService = new SalesOrderService();
export default salesOrderService;