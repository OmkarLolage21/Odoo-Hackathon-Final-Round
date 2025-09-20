import apiClient from '../utils/apiClient';

// Types reflecting backend schema
export interface TaxResponse {
  id: string;
  name: string;
  computation_method: 'percentage' | 'fixed';
  value: number;
  is_applicable_on_sales: boolean;
  is_applicable_on_purchase: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TaxCreate {
  name: string;
  computation_method: 'percentage' | 'fixed';
  value: number;
  is_applicable_on_sales: boolean;
  is_applicable_on_purchase: boolean;
}

export interface TaxUpdate {
  name?: string;
  computation_method?: 'percentage' | 'fixed';
  value?: number;
  is_applicable_on_sales?: boolean;
  is_applicable_on_purchase?: boolean;
}

class TaxService {
  private BASE_PATH = '/api/v1/taxes';

  private roleHeader(role?: string) {
    return { 'X-User-Role': role || '' };
  }

  async list(role?: string): Promise<TaxResponse[]> {
    return apiClient.get<TaxResponse[]>(this.BASE_PATH, { headers: this.roleHeader(role) });
  }

  async get(taxId: string, role?: string): Promise<TaxResponse> {
    return apiClient.get<TaxResponse>(`${this.BASE_PATH}/${taxId}`, { headers: this.roleHeader(role) });
  }

  async create(payload: TaxCreate, role?: string): Promise<TaxResponse> {
    return apiClient.post<TaxResponse>(this.BASE_PATH, payload, { headers: this.roleHeader(role) });
  }

  async update(taxId: string, payload: TaxUpdate, role?: string): Promise<TaxResponse> {
    return apiClient.put<TaxResponse>(`${this.BASE_PATH}/${taxId}`, payload, { headers: this.roleHeader(role) });
  }

  async remove(taxId: string, role?: string): Promise<void> {
    return apiClient.delete<void>(`${this.BASE_PATH}/${taxId}`, { headers: this.roleHeader(role) });
  }
}

export const taxService = new TaxService();
export default taxService;