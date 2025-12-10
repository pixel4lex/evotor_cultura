import { apiFetch } from './client';

const AUTH_BASE_PATH = '/api/auth';

export interface TokenBundle {
  access_token: string;
  refresh_token?: string | null;
}

export interface ShippingAddressPayload {
  id: string;
  title: string;
  city: string;
  address: string;
  is_default?: boolean;
}

export interface SupabaseUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface AuthResponse {
  message: string;
  session?: TokenBundle | null;
  user?: SupabaseUser | null;
}

export interface SignUpPayload {
  email: string;
  password: string;
  full_name: string;
  phone: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  email?: string;
  password?: string;
  full_name?: string;
  phone?: string;
  addresses?: ShippingAddressPayload[];
}

export interface CurrentUserResponse {
  user: SupabaseUser;
}

export interface UpdateProfileResponse {
  message: string;
  user: SupabaseUser;
}

export function signUp(payload: SignUpPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>(`${AUTH_BASE_PATH}/signup`, {
    method: 'POST',
    json: payload,
  });
}

export function signIn(payload: SignInPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>(`${AUTH_BASE_PATH}/login`, {
    method: 'POST',
    json: payload,
  });
}

export function fetchCurrentUser(token: string): Promise<CurrentUserResponse> {
  return apiFetch<CurrentUserResponse>(`${AUTH_BASE_PATH}/me`, {
    method: 'GET',
    token,
  });
}

export function updateProfile(
  token: string,
  payload: UpdateProfilePayload,
): Promise<UpdateProfileResponse> {
  return apiFetch<UpdateProfileResponse>(`${AUTH_BASE_PATH}/me`, {
    method: 'PATCH',
    token,
    json: payload,
  });
}
