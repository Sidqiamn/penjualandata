import { NextResponse } from "next/server";
import { env } from "@/lib/server/env";
import { getOrder, markPaid, updateStatus } from "@/lib/server/orders";
import { mapMidtrans, provider, verifyMidtransSignature } from "@/lib/server/payments";

export const dynamic = "force-dynamic";

/**
 * Notification URL Midtrans → https://DOMAIN-KAMU/api/payments/midtrans
 * 1) cek signature, 2) cocokkan nominal, 3) konfirmasi ulang ke API status,
 * 4) tandai lunas + kirim email (idempotent, aman kalau notifikasi datang dua kali).
 */
export async function POST(req: Request) {
  if (env.provider !== "midtrans") return NextResponse.json({ ok: false }, { status: 404 });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (!verifyMidtransSignature(body)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  try {
    const orderId = String(body.order_id || "");
    const order = await getOrder(orderId);
    // Notifikasi uji dari dashboard Midtrans memakai order_id contoh → jawab 200 supaya tidak diulang
    if (!order) return NextResponse.json({ ok: true, ignored: true });

    const amount = Math.round(Number(body.gross_amount));
    if (amount !== order.amount) {
      console.error(`[midtrans] nominal tidak cocok ${orderId}: ${amount} vs ${order.amount}`);
      return NextResponse.json({ ok: true, mismatch: true });
    }

    let status = mapMidtrans(body);
    if (status === "paid") {
      // Lapisan kedua: tanya langsung ke Midtrans. Kalau API status sedang tidak bisa dihubungi,
      // signature yang valid sudah cukup sebagai bukti notifikasi asli.
      try {
        const confirmed = await provider().status(order);
        if (confirmed && confirmed.status !== "pending") status = confirmed.status;
      } catch (err) {
        console.warn("[midtrans] konfirmasi status gagal, memakai notifikasi bertanda tangan", err);
      }
    }
    if (status === "paid") await markPaid(order.id, "webhook");
    else await updateStatus(order, status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[midtrans] gagal memproses notifikasi", err);
    // 500 → Midtrans akan mengirim ulang notifikasi
    return NextResponse.json({ error: "temporary failure" }, { status: 500 });
  }
}
