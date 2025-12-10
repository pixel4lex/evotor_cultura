import { apiFetch } from './client';

export interface CatalogGroup {
  id: string;
  name: string;
  parent_id?: string | null;
}

export interface CatalogItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  group_id?: string;
  group_name?: string;
  measure_name?: string;
}

export interface CatalogItemsResponse {
  items: CatalogItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface CatalogGroupsResponse {
  items: CatalogGroup[];
}

export interface FetchCatalogItemsParams {
  page?: number;
  pageSize?: number;
  groupId?: string | null;
  search?: string;
}

export async function fetchCatalogItems({
  page = 1,
  pageSize = 20,
  groupId,
  search,
}: FetchCatalogItemsParams = {}): Promise<CatalogItemsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  if (groupId) {
    params.set('group_id', groupId);
  }

  if (search) {
    params.set('search', search);
  }

  return apiFetch<CatalogItemsResponse>(`/api/catalog/items?${params.toString()}`);
}

export async function fetchCatalogGroups(): Promise<CatalogGroup[]> {
  const response = await apiFetch<CatalogGroupsResponse>('/api/catalog/groups');
  return response.items;
}
