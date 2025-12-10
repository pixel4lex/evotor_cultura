import type { SupabaseUser } from '../api/auth';

export interface UserAddress {
  id: string;
  title: string;
  city: string;
  address: string;
  isDefault?: boolean;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  addresses: UserAddress[];
}

interface NormalizationFallback {
  name?: string;
  email?: string;
  phone?: string;
  addresses?: UserAddress[];
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value === 'true';
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return false;
}

function normalizeMetadataAddresses(
  value: unknown,
  fallback: UserAddress[] = [],
): UserAddress[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const normalized: UserAddress[] = [];

  value.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }

    const record = entry as Record<string, unknown>;
    const rawId = record.id ?? record.address_id;
    const rawTitle = record.title;
    const rawCity = record.city;
    const rawAddress = record.address;

    if (typeof rawTitle !== 'string' || typeof rawCity !== 'string' || typeof rawAddress !== 'string') {
      return;
    }

    const resolvedId = typeof rawId === 'string'
      ? rawId
      : typeof rawId === 'number'
        ? String(rawId)
        : null;

    if (!resolvedId) {
      return;
    }

    const rawIsDefault = record.is_default ?? record.isDefault;

    normalized.push({
      id: resolvedId,
      title: rawTitle,
      city: rawCity,
      address: rawAddress,
      isDefault: toBoolean(rawIsDefault),
    });
  });

  if (normalized.length === 0 && fallback.length > 0) {
    return [...fallback];
  }

  return normalized;
}

export function normalizeSupabaseUser(
  user: SupabaseUser | null | undefined,
  fallback: NormalizationFallback = {},
): AppUser {
  if (!user) {
    throw new Error('Supabase user payload is missing');
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const rawName = metadata.full_name;
  const rawPhone = metadata.phone;
  const rawAddresses = metadata.addresses;

  const name = typeof rawName === 'string' && rawName.trim().length > 0
    ? rawName.trim()
    : fallback.name || user.email;

  const phone = typeof rawPhone === 'string' ? rawPhone : fallback.phone || '';

  const addresses = normalizeMetadataAddresses(rawAddresses, fallback.addresses ?? []);

  return {
    id: user.id,
    name,
    email: user.email || fallback.email || '',
    phone,
    addresses,
  };
}
