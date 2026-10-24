import { NextResponse } from "next/server";
import { createOrder, createOrderSchema, toPublic } from "@/lib/server/orders";
import { HttpError, clientIp } from "@/lib/server/util";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }
  const parsed = createOrderSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message || "Data belum lengkap." }, { status: 400 });
  }
  try {
    const order = await createOrder(parsed.data, clientIp(req));
    return NextResponse.json(toPublic(order), { status: 201 });
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[api/orders]", err);
    return NextResponse.json({ error: "Gagal membuat pesanan. Coba lagi sebentar." }, { status: 500 });
  }
}
