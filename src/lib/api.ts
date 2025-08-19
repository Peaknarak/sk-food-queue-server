// src/lib/api.ts
export const API_BASE =
   (import.meta as any).env?.VITE_API_BASE || 'https://sk-food-queue-api.onrender.com';

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** ===== Types ===== */
export type Role = 'student' | 'vendor' | 'admin';
export type User = { id: string; role: Role; name: string; vendorId?: string };
export type Vendor = { id: string; name: string; approved: boolean };
export type MenuItem = { id: string; vendorId: string; name: string; price: number };

export type OrderItem = { menuItemId: string; name: string; qty: number; price: number };
export type OrderStatus = 'created' | 'pending_vendor_confirmation' | 'accepted' | 'rejected';
export type Order = {
  id: string;
  studentId: string;
  vendorId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  queueNumber?: number;
  createdAt: string;
  paidAt?: string;
};
export type ChatMessage = { id: string; from: string; text: string; ts: string };

/** ===== API ===== */
export const api = {
  // Auth
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
  loginAdmin: (adminKey: string) =>
    jsonFetch<{ ok: boolean; user: User }>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ type: 'admin', adminKey }),
    }),

  // Public
  listVendors: () =>
    jsonFetch<{ ok: boolean; vendors: Vendor[] }>(`${API_BASE}/vendors`),
  listMenus: (vendorId: string) =>
    jsonFetch<{ ok: boolean; items: MenuItem[] }>(`${API_BASE}/menus?vendorId=${vendorId}`),
  getConfig: () =>
    jsonFetch<{ ok: boolean; bookingOpen: boolean; testMode: boolean; now: string }>(`${API_BASE}/config`),

  // Orders
  createOrder: (payload: { studentId: string; vendorId: string; items: { menuItemId: string; qty: number }[] }) =>
    jsonFetch<{ ok: boolean; order: Order }>(`${API_BASE}/orders`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
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

  // Chat
  getMessages: (orderId: string) =>
    jsonFetch<{ ok: true; messages: ChatMessage[] }>(`${API_BASE}/orders/${orderId}/messages`),

  // Admin (Vendor management)
  adminListVendors: (adminKey: string) =>
    jsonFetch<{ ok: boolean; vendors: Vendor[] }>(`${API_BASE}/admin/vendors`, {
      headers: { 'x-admin-key': adminKey },
    }),
  adminUpsertVendor: (adminKey: string, payload: { id: string; name: string; approved?: boolean }) =>
    jsonFetch<{ ok: boolean; vendor: Vendor }>(`${API_BASE}/admin/vendors`, {
      method: 'POST',
      headers: { 'x-admin-key': adminKey },
      body: JSON.stringify(payload),
    }),
  adminApproveVendor: (adminKey: string, id: string) =>
    jsonFetch<{ ok: boolean; vendor: Vendor }>(`${API_BASE}/admin/vendors/${id}/approve`, {
      method: 'POST',
      headers: { 'x-admin-key': adminKey },
    }),
  adminRejectVendor: (adminKey: string, id: string) =>
    jsonFetch<{ ok: boolean; vendor: Vendor }>(`${API_BASE}/admin/vendors/${id}/reject`, {
      method: 'POST',
      headers: { 'x-admin-key': adminKey },
    }),
  adminDeleteVendor: (adminKey: string, id: string) =>
    jsonFetch<{ ok: boolean }>(`${API_BASE}/admin/vendors/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': adminKey },
    }),

  // Vendor Menu CRUD
  vendorListMenus: (vendorId: string) =>
    jsonFetch<{ ok: boolean; items: MenuItem[] }>(`${API_BASE}/vendor/menus?vendorId=${vendorId}`),
  vendorCreateMenu: (payload: { vendorId: string; name: string; price: number }) =>
    jsonFetch<{ ok: boolean; item: MenuItem }>(`${API_BASE}/vendor/menus`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  vendorUpdateMenu: (id: string, payload: { name?: string; price?: number }) =>
    jsonFetch<{ ok: boolean; item: MenuItem }>(`${API_BASE}/vendor/menus/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  vendorDeleteMenu: (id: string) =>
    jsonFetch<{ ok: boolean }>(`${API_BASE}/vendor/menus/${id}`, { method: 'DELETE' }),
};
