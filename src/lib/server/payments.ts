import "server-only";
import QRCode from "qrcode";
import { paymentExpiry } from "@/config/site";
import type { PaymentInfo } from "@/lib/api-types";
import { env } from "./env";
import type { Order, ProviderStatus } from "./types";
import { HttpError, midtransTime, randomDigits, safeEqual, sha512 } from "./util";

const minutesFor = (method: Order["method"]) => (method === "qris" ? paymentExpiry.qris : paymentExpiry.va);
const expiryIso = (method: Order["method"]) => new Date(Date.now() + minutesFor(method) * 60_000).toISOString();

const qrSvg = (data: string) =>
  QRCode.toString(data, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#0B1530", light: "#FFFFFF" } });

/* ------------------------------------------------------------------ */
/* DEMO — tanpa uang sungguhan, untuk mencoba alur dari awal sampai akhir */
/* ------------------------------------------------------------------ */
const demo = {
  async create(order: Order): Promise<PaymentInfo> {
    const expiresAt = expiryIso(order.method);
    if (order.method === "qris") {
      return { kind: "qris", provider: "demo", qrSvg: await qrSvg(`DEMO-BLUDATA|${order.id}|${order.amount}`), expiresAt };
    }
    const prefix = order.method === "bca" ? "70012" : "98810";
    return { kind: "va", provider: "demo", bank: order.method === "bca" ? "BCA" : "BNI", vaNumber: prefix + randomDigits(11), expiresAt };
  },
  async status(): Promise<ProviderStatus | null> {
    return null; // status demo hanya berubah lewat tombol simulasi
  },
};

/* ------------------------------------------------------------------ */
/* MIDTRANS — Snap (popup Midtrans) atau Core API (QR/VA tampil di web) */
/* ------------------------------------------------------------------ */
const mt = () => {
  const prod = env.midtrans.isProduction;
  return {
    api: prod ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com",
    app: prod ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com",
    auth: "Basic " + Buffer.from(env.midtrans.serverKey + ":").toString("base64"),
  };
};

async function mtFetch(url: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: mt().auth, ...(init.headers || {}) },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  let body: Record<string, unknown> = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  return { res, body };
}

const SNAP_METHODS: Record<Order["method"], string[]> = {
  qris: ["other_qris", "gopay", "shopeepay"],
  bca: ["bca_va"],
  bni: ["bni_va"],
};

function common(order: Order) {
  return {
    transaction_details: { order_id: order.id, gross_amount: order.amount },
    item_details: order.items.map((i) => ({ id: i.id.slice(0, 50), price: i.price, quantity: 1, name: i.title.slice(0, 50) })),
    customer_details: {
      first_name: order.buyer.name.slice(0, 255),
      email: order.buyer.email,
      ...(order.buyer.whatsapp ? { phone: "0" + order.buyer.whatsapp } : {}),
    },
  };
}

const midtrans = {
  async create(order: Order): Promise<PaymentInfo> {
    if (!env.midtrans.serverKey) throw new HttpError(500, "MIDTRANS_SERVER_KEY belum diisi.");
    const minutes = minutesFor(order.method);
    const expiresAt = expiryIso(order.method);
    const { api, app } = mt();

    if (env.midtrans.integration === "snap") {
      if (!env.midtrans.clientKey) throw new HttpError(500, "NEXT_PUBLIC_MIDTRANS_CLIENT_KEY belum diisi.");
      const { res, body } = await mtFetch(`${app}/snap/v1/transactions`, {
        method: "POST",
        body: JSON.stringify({
          ...common(order),
          enabled_payments: SNAP_METHODS[order.method],
          expiry: { start_time: midtransTime(), unit: "minutes", duration: minutes },
          callbacks: { finish: `${env.siteUrl}/pesanan/${order.id}?t=${order.token}` },
        }),
      });
      if (!res.ok || typeof body.token !== "string") {
        const msg = Array.isArray(body.error_messages) ? body.error_messages.join(", ") : `HTTP ${res.status}`;
        throw new HttpError(502, `Midtrans menolak transaksi: ${msg}`);
      }
      return {
        kind: "snap",
        provider: "midtrans",
        token: body.token,
        redirectUrl: String(body.redirect_url || ""),
        scriptUrl: `${app}/snap/snap.js`,
        clientKey: env.midtrans.clientKey,
        expiresAt,
      };
    }

    // Core API: QR / nomor VA ditampilkan langsung di website
    const expiry = { custom_expiry: { order_time: midtransTime(), expiry_duration: minutes, unit: "minute" } };
    const payload =
      order.method === "qris"
        ? { ...common(order), ...expiry, payment_type: "qris", qris: { acquirer: "gopay" } }
        : { ...common(order), ...expiry, payment_type: "bank_transfer", bank_transfer: { bank: order.method } };
    const { body } = await mtFetch(`${api}/v2/charge`, { method: "POST", body: JSON.stringify(payload) });
    const code = String(body.status_code || "");
    if (code !== "201" && code !== "200") {
      const detail = Array.isArray(body.validation_messages) ? ` (${body.validation_messages.join(", ")})` : "";
      throw new HttpError(502, `Midtrans: ${String(body.status_message || "gagal membuat pembayaran")}${detail}`);
    }
    if (order.method === "qris") {
      const qr = String(body.qr_string || "");
      const actions = (body.actions as { name: string; url: string }[] | undefined) || [];
      const qrUrl = actions.find((a) => a.name === "generate-qr-code")?.url;
      if (!qr && !qrUrl) throw new HttpError(502, "Midtrans tidak mengirim kode QR.");
      return { kind: "qris", provider: "midtrans", qrSvg: qr ? await qrSvg(qr) : "", qrUrl, expiresAt };
    }
    const va = (body.va_numbers as { bank: string; va_number: string }[] | undefined)?.[0]?.va_number;
    if (!va) throw new HttpError(502, "Midtrans tidak mengirim nomor Virtual Account.");
    return { kind: "va", provider: "midtrans", bank: order.method === "bca" ? "BCA" : "BNI", vaNumber: va, expiresAt };
  },

  async status(order: Order): Promise<ProviderStatus | null> {
    const { body } = await mtFetch(`${mt().api}/v2/${encodeURIComponent(order.id)}/status`);
    const code = String(body.status_code || "");
    if (code === "404") return { status: "pending", raw: body }; // Snap: pembeli belum memilih metode
    if (!body.transaction_status) return null;
    return { status: mapMidtrans(body), grossAmount: Number(body.gross_amount), raw: body };
  },
};

export function mapMidtrans(b: Record<string, unknown>): ProviderStatus["status"] {
  const ts = String(b.transaction_status || "");
  const fraud = String(b.fraud_status || "accept");
  if (ts === "settlement") return fraud === "accept" ? "paid" : "pending";
  if (ts === "capture") return fraud === "accept" ? "paid" : "pending";
  if (ts === "expire") return "expired";
  if (ts === "cancel" || ts === "deny" || ts === "failure") return "failed";
  return "pending";
}

/** Notifikasi Midtrans asli kalau SHA512(order_id + status_code + gross_amount + ServerKey) cocok */
export function verifyMidtransSignature(b: Record<string, unknown>) {
  const expected = sha512(`${b.order_id}${b.status_code}${b.gross_amount}${env.midtrans.serverKey}`);
  return typeof b.signature_key === "string" && safeEqual(b.signature_key, expected);
}

export const provider = () => (env.provider === "midtrans" ? midtrans : demo);
