import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { OrderView } from "@/components/OrderView";
import { Footer } from "@/components/Sections";

export const metadata: Metadata = { title: "Pesanan", robots: { index: false, follow: false } };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;
  return (
    <>
      <Header minimal />
      <OrderView id={id} token={t ?? ""} />
      <Footer />
    </>
  );
}
