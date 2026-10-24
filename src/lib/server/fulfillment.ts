import "server-only";
import { bundle, products } from "@/config/products";
import { delivery, type DeliveryLink } from "@/config/delivery";
import type { OrderItem } from "@/lib/api-types";

export type ResolvedDelivery = {
  id: string;
  title: string;
  links: DeliveryLink[];
  attachmentFiles: { filename: string; file: string }[];
};

/** Link & lampiran per produk yang dibeli. Paket = gabungan isi paketnya (kecuali diatur sendiri). */
export function deliveriesFor(items: OrderItem[]): ResolvedDelivery[] {
  const out: ResolvedDelivery[] = [];
  for (const item of items) {
    const own = delivery[item.id];
    if (bundle && item.id === bundle.id && !own) {
      for (const sub of bundle.items) {
        const d = delivery[sub];
        if (!d) continue;
        out.push({ id: sub, title: titleOf(sub), links: d.links, attachmentFiles: d.attachments ?? [] });
      }
      continue;
    }
    out.push({ id: item.id, title: item.title, links: own?.links ?? [], attachmentFiles: own?.attachments ?? [] });
  }
  return out;
}

const titleOf = (id: string) => products.find((p) => p.id === id)?.title ?? id;
