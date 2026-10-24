import { NextResponse } from "next/server";
import { getOrderForViewer, refreshOrder, toPublic } from "@/lib/server/orders";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("t");
  const order = await getOrderForViewer(id, token);
  if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  const fresh = (await refreshOrder(order)) ?? order;
  return NextResponse.json(toPublic(fresh), { headers: { "Cache-Control": "no-store" } });
}
