import apiClient from '../utils/apiClient';
import { AccountResponse, AccountCreateRequest, AccountUpdateRequest } from '../types';

const BASE_PATH = '/api/v1/chart-of-accounts';

const roleHeader = (role?: string) => ({ 'X-User-Role': role || '' });

function mapAccount(api: AccountResponse) {
  return {
    id: api.id,
    name: api.name,
    type: api.type,
    parentId: api.parent_id || null,
    createdAt: api.created_at ? new Date(api.created_at) : new Date(),
    updatedAt: api.updated_at ? new Date(api.updated_at) : new Date(),
  };
}

class AccountService {
  async list(role?: string) {
    const data = await apiClient.get<AccountResponse[]>(BASE_PATH, { headers: roleHeader(role) });
    return data.map(mapAccount);
  }
  async get(id: string, role?: string) {
    const data = await apiClient.get<AccountResponse>(`${BASE_PATH}/${id}`, { headers: roleHeader(role) });
    return mapAccount(data);
  }
  async create(payload: AccountCreateRequest, role?: string) {
    const data = await apiClient.post<AccountResponse>(BASE_PATH, payload, { headers: roleHeader(role) });
    return mapAccount(data);
  }
  async update(id: string, payload: AccountUpdateRequest, role?: string) {
    const data = await apiClient.put<AccountResponse>(`${BASE_PATH}/${id}`, payload, { headers: roleHeader(role) });
    return mapAccount(data);
  }
  async remove(id: string, role?: string) {
    await apiClient.delete<void>(`${BASE_PATH}/${id}`, { headers: roleHeader(role) });
  }
}

export const accountService = new AccountService();
export default accountService;
