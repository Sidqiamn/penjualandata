import "server-only";
import { z } from "zod";
import { priceCart } from "@/lib/pricing";
import type { OrderStatus, PublicOrder } from "@/lib/api-types";
import { sendOrderEmail } from "./email";
import { env, redisConfigured } from "./env";
import { deliveriesFor } from "./fulfillment";
import { provider } from "./payments";
import { store } from "./store";
import type { Order } from "./types";
import { HttpError, newOrderId, newToken, safeEqual } from "./util";

const ORDER_TTL = 60 * 60 * 24 * 365; // simpan pesanan 1 tahun
const key = (id: string) => `order:${id}`;

export const createOrderSchema = z.object({
  items: z.array(z.string().min(1).max(64)).min(1).max(20),
  method: z.enum(["qris", "bca", "bni"], { error: "Pilih metode pembayaran." }),
  buyer: z.object({
    name: z.string().trim().min(2, "Nama minimal 2 huruf").max(80),
    email: z.string().trim().toLowerCase().email("Format email belum benar").max(120),
    whatsapp: z
      .string()
      .trim()
      .optional()
      .transform((v) => {
        if (!v) return undefined;
        let d = v.replace(/\D/g, "");
        if (d.startsWith("62")) d = d.slice(2);
        if (d.startsWith("0")) d = d.slice(1);
        return d || undefined;
      })
      .refine((v) => !v || /^8\d{7,12}$/.test(v), "Nomor WhatsApp belum benar"),
  }),
});

function assertStorageReady() {
  if (env.provider === "midtrans" && env.isProd && !redisConfigured()) {
    throw new HttpError(500, "Database pesanan belum diatur (UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN).");
  }
}

export async function createOrder(input: z.infer<typeof createOrderSchema>, ip: string) {
  assertStorageReady();
  const kv = store();
  const hits = await kv.incr(`rl:order:${ip}`, 600);
  if (hits > 12) throw new HttpError(429, "Terlalu banyak percobaan. Coba lagi dalam beberapa menit.");

  const priced = priceCart(input.items);
  if (!priced.items.length) throw new HttpError(400, "Keranjang kosong atau produk tidak ditemukan.");

  const now = new Date();
  const order: Order = {
    id: newOrderId(now),
    token: newToken(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    status: "pending",
    amount: priced.subtotal,
    method: input.method,
    items: priced.items,
    buyer: { name: input.buyer.name, email: input.buyer.email, whatsapp: input.buyer.whatsapp },
    provider: env.provider,
    // diisi setelah gateway membuat pembayaran
    payment: undefined as unknown as Order["payment"],
    email: { status: "pending", attempts: 0 },
  };
  order.payment = await provider().create(order);
  await kv.set(key(order.id), order, ORDER_TTL);
  return order;
}

export async function getOrder(id: string) {
  if (!/^BD-\d{6}-[A-Z0-9]{6}$/.test(id)) return null;
  return store().get<Order>(key(id));
}

export async function getOrderForViewer(id: string, token: string | null) {
  const order = await getOrder(id);
  if (!order || !token || !safeEqual(order.token, token)) return null;
  return order;
}

async function save(order: Order) {
  order.updatedAt = new Date().toISOString();
  await store().set(key(order.id), order, ORDER_TTL);
}

/** Tandai lunas (idempotent) lalu kirim email. Aman dipanggil berkali-kali dari webhook maupun cek status. */
export async function markPaid(id: string, via: NonNullable<Order["paidVia"]>) {
  const kv = store();
  const locked = await kv.setNX(`lock:paid:${id}`, 1, 30);
  if (!locked) return getOrder(id);
  try {
    const order = await getOrder(id);
    if (!order) return null;
    if (order.status !== "paid") {
      order.status = "paid";
      order.paidAt = new Date().toISOString();
      order.paidVia = via;
      await save(order);
    }
    return await ensureEmail(order);
  } finally {
    await kv.del(`lock:paid:${id}`);
  }
}

export async function updateStatus(order: Order, status: OrderStatus) {
  if (status === "paid") return markPaid(order.id, "status-check");
  if (order.status === "pending" && status !== "pending") {
    order.status = status;
    await save(order);
  }
  return order;
}

/** Kirim email sekali saja; coba ulang maks. 3x bila gagal (minimal jeda 60 detik). */
export async function ensureEmail(order: Order) {
  if (order.status !== "paid") return order;
  const e = order.email;
  if (e.status === "sent" || e.status === "skipped") return order;
  if (e.attempts >= 3) return order;
  if (e.lastAttemptAt && Date.now() - Date.parse(e.lastAttemptAt) < 60_000) return order;
  const kv = store();
  if (!(await kv.setNX(`lock:email:${order.id}`, 1, 120))) return order;
  try {
    const res = await sendOrderEmail(order);
    const fresh = (await getOrder(order.id)) ?? order;
    fresh.email = {
      status: res.status,
      attempts: e.attempts + 1,
      lastAttemptAt: new Date().toISOString(),
      error: res.error?.slice(0, 300),
    };
    await save(fresh);
    return fresh;
  } finally {
    await kv.del(`lock:email:${order.id}`);
  }
}

/** Cadangan kalau webhook terlambat/belum diatur: tanya status langsung ke gateway (maks. tiap 8 detik). */
export async function refreshOrder(order: Order) {
  if (order.status === "paid") return ensureEmail(order);
  if (order.status !== "pending") return order;
  const expired = Date.parse(order.payment.expiresAt) < Date.now() - 60_000;
  if (order.provider === "demo") {
    if (expired) return updateStatus(order, "expired");
    return order;
  }
  if (order.lastCheckedAt && Date.now() - order.lastCheckedAt < 8_000) return order;
  order.lastCheckedAt = Date.now();
  await save(order);
  try {
    const st = await provider().status(order);
    if (st) {
      if (st.status === "paid" && st.grossAmount && Math.round(st.grossAmount) !== order.amount) {
        console.error(`[order] nominal tidak cocok untuk ${order.id}`);
        return order;
      }
      return (await updateStatus(order, st.status)) ?? order;
    }
  } catch (err) {
    console.warn("[order] cek status gagal", err);
  }
  return order;
}

export function toPublic(order: Order): PublicOrder {
  const paid = order.status === "paid";
  return {
    id: order.id,
    token: order.token,
    status: order.status,
    amount: order.amount,
    method: order.method,
    items: order.items,
    buyer: { name: order.buyer.name, email: order.buyer.email },
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    payment: order.payment,
    email: { status: order.email.status },
    deliveries: paid
      ? deliveriesFor(order.items).map((d) => ({
          id: d.id,
          title: d.title,
          links: d.links,
          attachments: d.attachmentFiles.map((a) => a.filename),
        }))
      : undefined,
    demo: order.provider === "demo",
    sandbox: order.provider === "midtrans" && !env.midtrans.isProduction,
  };
}
