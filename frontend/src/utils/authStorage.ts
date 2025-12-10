import type { TokenBundle } from '../api/auth';
import type { AppUser } from './user';

export const AUTH_STORAGE_KEY = 'culturaAuth';
const LEGACY_USER_KEY = 'culturaUser';

export interface StoredAuth {
  accessToken: string;
  refreshToken?: string | null;
  user: AppUser;
}

export function getStoredAuth(): StoredAuth | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredAuth;
    if (!parsed?.accessToken || !parsed?.user) {
      return null;
    }
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken ?? null,
      user: parsed.user,
    };
  } catch {
    return null;
  }
}

export function saveAuth(payload: { user: AppUser; tokens: TokenBundle }): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  const record: StoredAuth = {
    accessToken: payload.tokens.access_token,
    refreshToken: payload.tokens.refresh_token ?? null,
    user: payload.user,
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(record));
  localStorage.removeItem(LEGACY_USER_KEY);
}

export function updateStoredUser(user: AppUser): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  const existing = getStoredAuth();
  if (!existing) {
    return;
  }

  const record: StoredAuth = {
    accessToken: existing.accessToken,
    refreshToken: existing.refreshToken ?? null,
    user,
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(record));
}

export function clearAuthStorage(): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
}
