import apiClient from '../utils/apiClient';
import { PurchaseOrderCreateRequest, PurchaseOrderResponse } from '../types';

const BASE_PATH = '/api/v1/purchase-orders';
const roleHeader = (role?: string) => ({ 'X-User-Role': role || '' });

class PurchaseOrderService {
  async createDraft(payload: PurchaseOrderCreateRequest, role?: string) {
    return apiClient.post<PurchaseOrderResponse>(BASE_PATH, payload, { headers: roleHeader(role) });
  }
  async list(role?: string) {
    return apiClient.get<PurchaseOrderResponse[]>(BASE_PATH, { headers: roleHeader(role) });
  }
  async get(id: string, role?: string) {
    return apiClient.get<PurchaseOrderResponse>(`${BASE_PATH}/${id}`, { headers: roleHeader(role) });
  }
  async update(id: string, payload: Partial<PurchaseOrderCreateRequest> & { status?: 'draft' | 'confirmed' | 'cancelled'; lines?: PurchaseOrderCreateRequest['lines'] }, role?: string) {
    return apiClient.put<PurchaseOrderResponse>(`${BASE_PATH}/${id}`, payload, { headers: roleHeader(role) });
  }
  async delete(id: string, role?: string) {
    return apiClient.delete<void>(`${BASE_PATH}/${id}`, { headers: roleHeader(role) });
  }
}

export const purchaseOrderService = new PurchaseOrderService();
export default purchaseOrderService;
