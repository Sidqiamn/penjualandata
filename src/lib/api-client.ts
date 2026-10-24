import type { CreateOrderBody, PublicOrder } from "./api-types";

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) }, cache: "no-store" });
  } catch {
    throw new Error("Koneksi terputus. Periksa internet lalu coba lagi.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error((data as { error?: string }).error || "Terjadi kesalahan."), { status: res.status });
  return data as T;
}

export const apiCreateOrder = (body: CreateOrderBody) =>
  call<PublicOrder>("/api/orders", { method: "POST", body: JSON.stringify(body) });

export const apiGetOrder = (id: string, token: string) =>
  call<PublicOrder>(`/api/orders/${encodeURIComponent(id)}?t=${encodeURIComponent(token)}`);

export const apiSimulate = (id: string, token: string) =>
  call<PublicOrder>(`/api/orders/${encodeURIComponent(id)}/simulate?t=${encodeURIComponent(token)}`, { method: "POST" });

export const orderPath = (o: { id: string; token: string }) => `/pesanan/${o.id}?t=${encodeURIComponent(o.token)}`;
