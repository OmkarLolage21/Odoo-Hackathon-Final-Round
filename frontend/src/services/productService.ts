import apiClient from '../utils/apiClient';

// Backend response shape (snake_case)
export interface ProductResponse {
  id: string;
  name: string;
  type: 'goods' | 'service';
  category?: string | null;
  sales_price: number;
  purchase_price: number;
  tax_name?: string | null;
  sales_tax_percent?: number; // derived server side
  purchase_tax_percent?: number; // derived server side
  hsn_code?: string | null;
  current_stock?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProductCreateRequest {
  name: string;
  type: 'goods' | 'service';
  category?: string | null;
  sales_price: number;
  purchase_price: number;
  tax_name?: string | null;
  hsn_code?: string | null;
  current_stock?: number | null;
}

export interface ProductUpdateRequest extends Partial<ProductCreateRequest> {}

export interface HsnSearchResult { code: string; description: string }

const BASE_PATH = '/api/v1/products';

const roleHeader = (role?: string) => ({ 'X-User-Role': role || '' });

export function mapProduct(api: ProductResponse) {
  return {
    id: api.id,
    name: api.name,
    type: api.type,
    category: api.category || '',
    salesPrice: api.sales_price,
    purchasePrice: api.purchase_price,
    taxName: api.tax_name || null,
    salesTaxPercent: api.sales_tax_percent ?? 0,
    purchaseTaxPercent: api.purchase_tax_percent ?? 0,
    hsnCode: api.hsn_code || '',
    currentStock: api.current_stock ?? 0,
    createdAt: api.created_at ? new Date(api.created_at) : new Date(),
    updatedAt: api.updated_at ? new Date(api.updated_at) : new Date(),
  } as any;
}

class ProductService {
  async list(role?: string) {
    const data = await apiClient.get<ProductResponse[]>(BASE_PATH, { headers: roleHeader(role) });
    return data.map(mapProduct);
  }

  async get(id: string, role?: string) {
    const data = await apiClient.get<ProductResponse>(`${BASE_PATH}/${id}`, { headers: roleHeader(role) });
    return mapProduct(data);
  }

  async create(payload: ProductCreateRequest, role?: string) {
    const data = await apiClient.post<ProductResponse>(BASE_PATH, payload, { headers: roleHeader(role) });
    return mapProduct(data);
  }

  async update(id: string, payload: ProductUpdateRequest, role?: string) {
    const data = await apiClient.put<ProductResponse>(`${BASE_PATH}/${id}`, payload, { headers: roleHeader(role) });
    return mapProduct(data);
  }

  async remove(id: string, role?: string) {
    await apiClient.delete<void>(`${BASE_PATH}/${id}`, { headers: roleHeader(role) });
  }

  async searchHsn(query: string, role?: string, category?: 'null' | 'P' | 'S') {
    if (!query.trim()) return [] as HsnSearchResult[];
    const mode = /^[0-9]+$/.test(query.trim()) ? 'byCode' : 'byDesc';
    const params = new URLSearchParams({ q: query.trim(), mode });
    if (category && category !== 'null') params.set('category', category);
    const endpoint = `${BASE_PATH}/hsn/search?${params.toString()}`;
    // Backend returns { data: [{ c, n }] }
    const data = await apiClient.get<{ data: { c: string; n: string }[] }>(endpoint, { headers: roleHeader(role) });
    return (data?.data || []).map(item => ({ code: item.c, description: item.n }));
  }
}

export const productService = new ProductService();
export default productService;
