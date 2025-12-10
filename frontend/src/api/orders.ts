import { apiFetch } from './client';

export type OrderStatus =
  | 'На рассмотрении'
  | 'Ждет оплаты'
  | 'Одобрен'
  | 'Отклонен';


export interface OrderItemPayload {
  id: string;
  name: string;
  price: number;
  quantity: number;
  brand?: string | null;
  image?: string | null;
}

export interface OrderShippingAddress {
  id?: string | null;
  title: string;
  city?: string | null;
  address: string;
  comment?: string | null;
}

export interface OrderUserSummary {
  id: string;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
}

export interface OrderRecord {
  id: number;
  user_id: string;
  user: OrderUserSummary;
  status: OrderStatus;
  currency: string;
  total_cost: number;
  items: OrderItemPayload[];
  shipping_address?: OrderShippingAddress | null;

  payment_status: 'Не оплачен' | 'Оплачен' | 'Отменен' | 'Ошибка';
  tracking_code?: string | null;

  created_at: string;
}

export interface CreateOrderRequest {
  items: OrderItemPayload[];
  shipping_address: OrderShippingAddress;
  currency?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  currency?: string;
  total_cost?: number;
  items?: OrderItemPayload[];
  shipping_address?: OrderShippingAddress;
  tracking_code?: string; // new

}

export function createOrder(payload: CreateOrderRequest, token?: string) {
  return apiFetch<OrderRecord>('/api/orders', {
    method: 'POST',
    token,
    json: payload,
  });
}

export function fetchMyOrders(token: string) {
  return apiFetch<OrderRecord[]>('/api/orders/me', {
    method: 'GET',
    token,
  });
}

export function fetchAllOrders(token: string) {
  return apiFetch<OrderRecord[]>('/api/orders/viewall', {
    method: 'GET',
    token,
  });
}

export function updateOrder(token: string, orderId: number, payload: UpdateOrderRequest) {
  return apiFetch<OrderRecord>(`/api/orders/${orderId}`, {
    method: 'PATCH',
    token,
    json: payload,
  });
}

export function deleteOrder(token: string, orderId: number) {
  return apiFetch<void>(`/api/orders/${orderId}`, {
    method: 'DELETE',
    token,
  });
}
