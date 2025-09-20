import apiClient from '../utils/apiClient';
import { ContactResponse, CreateContactRequest } from '../types';

// Backwards compatibility: older form build used different keys; we'll adapt before send.
export interface ContactCreatePayload extends CreateContactRequest {}

class ContactService {
  private basePath = '/api/v1/contacts';

  private roleHeader(): Record<string,string> | undefined {
    try {
      const raw = localStorage.getItem('user_role');
      if (raw) return { 'X-User-Role': raw };
    } catch {/* ignore */}
    return undefined;
  }

  async list(): Promise<ContactResponse[]> {
    return apiClient.get<ContactResponse[]>(`${this.basePath}/`, {
      headers: this.roleHeader(),
    });
  }

  async create(payload: ContactCreatePayload): Promise<ContactResponse> {
    const body: CreateContactRequest = {
      name: payload.name,
      type: payload.type,
      email: payload.email ?? null,
      mobile: payload.mobile ?? null,
      address_city: (payload as any).address_city ?? (payload as any).city ?? null,
      address_state: (payload as any).address_state ?? (payload as any).state ?? null,
      address_pincode: (payload as any).address_pincode ?? (payload as any).pincode ?? null,
    };

    return apiClient.post<ContactResponse>(`${this.basePath}/`, body, {
      headers: this.roleHeader(),
    });
  }

  async get(contactId: string): Promise<ContactResponse> {
    return apiClient.get<ContactResponse>(`${this.basePath}/${contactId}`, {
      headers: this.roleHeader(),
    });
  }

  async update(contactId: string, payload: Partial<CreateContactRequest>): Promise<ContactResponse> {
    const body: Partial<CreateContactRequest> = {
      ...payload,
    };
    return apiClient.put<ContactResponse>(`${this.basePath}/${contactId}`, body, {
      headers: this.roleHeader(),
    });
  }

  async delete(contactId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`${this.basePath}/${contactId}`, {
      headers: this.roleHeader(),
    });
  }
}

export const contactService = new ContactService();
export default contactService;
