// app/lib/api.ts
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const cleanEndpoint = endpoint.startsWith('/api')
    ? endpoint
    : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const url = `${STRAPI_URL}${cleanEndpoint}`;

  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token') || localStorage.getItem('jwt');
  }

  const customHeaders = (options.headers as Record<string, string>) || {};

  const headers: Record<string, string> = {
    ...customHeaders,
  };

  // FormData না হলে Content-Type সেট হবে
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // ⚠️ লগইন বা রেজিস্ট্রেশনের রিকোয়েস্টে পুরনো টোকেন পাঠানো যাবে না
  const isAuthRoute = endpoint.includes('/auth/local') || endpoint.includes('/auth/register');

  if (token && !isAuthRoute && !headers['Authorization']) {
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    if (cleanToken) {
      headers['Authorization'] = `Bearer ${cleanToken}`;
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 204) {
    return { success: true };
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error?.message || 'Invalid credentials or access denied');
  }

  return data;
}