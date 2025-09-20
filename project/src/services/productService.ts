import { Product } from '../types';

// Backend product shape (snake_case) for type reference
export interface ProductApiModel {
  id: string;
  name: string;
  type: 'goods' | 'service';
  sales_price: number;
  purchase_price: number;
  tax_name?: string | null;
  sales_tax_percent?: number;
  purchase_tax_percent?: number;
  hsn_code?: string;
  category?: string;
  current_stock: number;
  created_at?: string;
  updated_at?: string;
}

const API_BASE = '/api/v1/products';

function mapFromApi(api: ProductApiModel): Product {
  return {
    id: api.id,
    name: api.name,
    type: api.type,
    salesPrice: api.sales_price,
    purchasePrice: api.purchase_price,
    taxName: api.tax_name ?? null,
    salesTaxPercent: api.sales_tax_percent,
    purchaseTaxPercent: api.purchase_tax_percent,
    hsnCode: api.hsn_code,
    category: api.category,
    currentStock: api.current_stock,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

function mapToApi(product: Partial<Product>): Partial<ProductApiModel> {
  return {
    name: product.name!,
    type: product.type!,
    sales_price: product.salesPrice!,
    purchase_price: product.purchasePrice!,
    tax_name: product.taxName ?? null,
    hsn_code: product.hsnCode,
    category: product.category,
    current_stock: product.currentStock!,
  } as Partial<ProductApiModel>;
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

export async function listProducts(role: string): Promise<Product[]> {
  const data = await request<ProductApiModel[]>(API_BASE, { role });
  return data.map(mapFromApi);
}

export async function getProduct(id: string, role: string): Promise<Product> {
  const data = await request<ProductApiModel>(`${API_BASE}/${id}`, { role });
  return mapFromApi(data);
}

export async function createProduct(payload: Partial<Product>, role: string): Promise<Product> {
  const data = await request<ProductApiModel>(API_BASE, {
    method: 'POST',
    role,
    body: JSON.stringify(mapToApi(payload)),
  });
  return mapFromApi(data);
}

export async function updateProduct(id: string, payload: Partial<Product>, role: string): Promise<Product> {
  const data = await request<ProductApiModel>(`${API_BASE}/${id}`, {
    method: 'PUT',
    role,
    body: JSON.stringify(mapToApi(payload)),
  });
  return mapFromApi(data);
}

export async function deleteProduct(id: string, role: string): Promise<void> {
  await request<void>(`${API_BASE}/${id}`, { method: 'DELETE', role });
}

// HSN Search
export interface HsnSearchResult {
  code: string;
  description: string;
}

// NOTE: backend expects mode param (byCode or byDesc) and returns { data: [ { c, n } ] }
export async function searchHsn(query: string, role: string, params?: { mode?: 'byCode' | 'byDesc'; category?: string }): Promise<HsnSearchResult[]> {
  const mode = params?.mode || (/^\d+$/.test(query) ? 'byCode' : 'byDesc');
  const url = new URL(`${API_BASE}/hsn/search`, window.location.origin);
  url.searchParams.set('q', query);
  url.searchParams.set('mode', mode);
  if (params?.category) url.searchParams.set('category', params.category);
  const data = await request<{ data: { c: string; n: string }[] }>(url.toString(), { role });
  return (data.data || []).map(item => ({ code: item.c, description: item.n }));
}
