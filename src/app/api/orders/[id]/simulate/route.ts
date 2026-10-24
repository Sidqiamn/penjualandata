import { NextResponse } from "next/server";
import { env } from "@/lib/server/env";
import { getOrderForViewer, markPaid, toPublic } from "@/lib/server/orders";

export const dynamic = "force-dynamic";

/** Hanya untuk MODE DEMO: pura-pura pembayaran berhasil supaya alur bisa dicoba tanpa uang. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (env.provider !== "demo") return NextResponse.json({ error: "Tidak tersedia." }, { status: 404 });
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("t");
  const order = await getOrderForViewer(id, token);
  if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  if (order.status !== "pending" && order.status !== "paid") {
    return NextResponse.json({ error: "Pesanan sudah tidak aktif." }, { status: 409 });
  }
  const paid = await markPaid(order.id, "simulation");
  return NextResponse.json(toPublic(paid ?? order));
}
