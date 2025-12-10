let HOST = window.location.hostname;
if (HOST.includes('localhost')) {
  HOST = 'localhost:8000';
}
export const DEFAULT_BASE_URL = `http://${HOST}`;

const rawBaseUrl = (import.meta.env?.VITE_API_BASE_URL ?? DEFAULT_BASE_URL) as string;
const sanitizedBaseUrl = rawBaseUrl.replace(/\/$/, '');

export const API_BASE_URL = sanitizedBaseUrl;

export class ApiRequestError extends Error {
  status: number;
  detail?: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.detail = detail;
  }
}

export interface ApiFetchOptions extends RequestInit {
  json?: unknown;
  token?: string;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { json, token, headers, ...rest } = options;
  const requestUrl = `${sanitizedBaseUrl}${path}`;

  const headerEntries: [string, string][] = [];

  if (headers instanceof Headers) {
    headers.forEach((value, key) => headerEntries.push([key, value]));
  } else if (Array.isArray(headers)) {
    headerEntries.push(...(headers as [string, string][]));
  } else if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      if (typeof value !== 'undefined') {
        headerEntries.push([key, String(value)]);
      }
    });
  }

  const mergedHeaders = new Headers(headerEntries);

  if (!mergedHeaders.has('Accept')) {
    mergedHeaders.set('Accept', 'application/json');
  }

  if (json !== undefined && !mergedHeaders.has('Content-Type')) {
    mergedHeaders.set('Content-Type', 'application/json');
  }

  if (token) {
    mergedHeaders.set('Authorization', `Bearer ${token}`);
  }

  const init: RequestInit = {
    ...rest,
    headers: mergedHeaders,
  };

  if (json !== undefined) {
    init.body = JSON.stringify(json);
  }

  const response = await fetch(requestUrl, init);
  const text = await response.text();
  const hasBody = text.length > 0;

  let data: unknown = undefined;
  if (hasBody) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const detail = (data as Record<string, unknown> | undefined)?.detail ?? data;
    const message = typeof detail === 'string' && detail
      ? detail
      : response.statusText || 'Request failed';

    throw new ApiRequestError(message, response.status, detail);
  }

  return data as T;
}
