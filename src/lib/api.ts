// src/lib/api.ts
export const API_BASE =
  (import.meta as any).env?.VITE_API_BASE || 'http://localhost:4000';

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** ===== Types ===== */
export type User = { id: string; type: 'student' | 'vendor'; name: string };
export type Vendor = { id: string; name: string };
export type MenuItem = { id: string; vendorId: string; name: string; price: number };
export type OrderItem = { menuItemId: string; name: string; qty: number; price: number };
export type OrderStatus = 'created' | 'pending_vendor_confirmation' | 'accepted' | 'rejected';
export type Order = {
  id: string; studentId: string; vendorId: string;
  items: OrderItem[]; total: number; status: OrderStatus;
  queueNumber?: number; createdAt: string; paidAt?: string;
};
export type ChatMessage = { id: string; from: string; text: string; ts: string };

/** ===== API ===== */
export const api = {
  loginStudent: (studentId: string) =>
    jsonFetch<{ ok: boolean; user: User }>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ type: 'student', studentId }),
    }),
  loginVendor: (vendorId: string) =>
    jsonFetch<{ ok: boolean; user: User }>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ type: 'vendor', vendorId }),
    }),

  listVendors: () => jsonFetch<{ ok: boolean; vendors: Vendor[] }>(`${API_BASE}/vendors`),
  listMenus: (vendorId: string) =>
    jsonFetch<{ ok: boolean; items: MenuItem[] }>(`${API_BASE}/menus?vendorId=${vendorId}`),

  createOrder: (p: { studentId: string; vendorId: string; items: { menuItemId: string; qty: number }[] }) =>
    jsonFetch<{ ok: boolean; order: Order }>(`${API_BASE}/orders`, { method: 'POST', body: JSON.stringify(p) }),

  createQR: (orderId: string) =>
    jsonFetch<{ ok: boolean; qrDataUrl: string }>(`${API_BASE}/payments/create-qr`, {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    }),

  markPaid: (orderId: string) =>
    jsonFetch<{ ok: boolean; order: Order }>(`${API_BASE}/orders/${orderId}/pay`, { method: 'POST' }),
  acceptOrder: (orderId: string) =>
    jsonFetch<{ ok: boolean; order: Order }>(`${API_BASE}/orders/${orderId}/accept`, { method: 'POST' }),
  rejectOrder: (orderId: string) =>
    jsonFetch<{ ok: boolean; order: Order }>(`${API_BASE}/orders/${orderId}/reject`, { method: 'POST' }),

  listOrdersByStudent: (studentId: string) =>
    jsonFetch<{ ok: boolean; orders: Order[] }>(`${API_BASE}/orders?studentId=${studentId}`),
  listOrdersByVendor: (vendorId: string) =>
    jsonFetch<{ ok: boolean; orders: Order[] }>(`${API_BASE}/orders?vendorId=${vendorId}`),

  getConfig: () =>
    jsonFetch<{ ok: boolean; bookingOpen: boolean; testMode: boolean; now: string }>(`${API_BASE}/config`),

  // ===== Chat =====
  getMessages: (orderId: string, opts?: { before?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (opts?.before) qs.set('before', opts.before);
    if (opts?.limit) qs.set('limit', String(opts.limit));
    const url = `${API_BASE}/orders/${orderId}/messages` + (qs.toString() ? `?${qs}` : '');
    return jsonFetch<{ ok: true; messages: ChatMessage[]; nextCursor: string | null }>(url);
  },
  clearMessages: (orderId: string) =>
    jsonFetch<{ ok: true; deleted: number }>(`${API_BASE}/orders/${orderId}/messages`, { method: 'DELETE' }),
  sendMessage: (orderId: string, from: string, text: string) =>
    jsonFetch<{ ok: true; message: ChatMessage }>(`${API_BASE}/orders/${orderId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ from, text }),
    }),
};
