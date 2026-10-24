import { bundle, products, type Bundle, type Product } from "@/config/products";

export type CatalogItem = (Product | (Bundle & { oldPrice: number; includes: string[]; preview: "bundle" })) & {
  isBundle?: boolean;
};

/** Harga satuan semua isi paket (untuk harga coret & hitungan hemat) */
export const bundleUnitTotal = bundle
  ? bundle.items.reduce((s, id) => s + (products.find((p) => p.id === id)?.price ?? 0), 0)
  : 0;

export const bundleItem: CatalogItem | null = bundle
  ? {
      ...bundle,
      preview: "bundle",
      oldPrice: bundleUnitTotal,
      includes: bundle.items.map((id) => products.find((p) => p.id === id)?.title).filter(Boolean) as string[],
      isBundle: true,
    }
  : null;

export const catalog: CatalogItem[] = bundleItem ? [...products, bundleItem] : [...products];
const byIdMap = new Map(catalog.map((p) => [p.id, p]));
export const getItem = (id: string) => byIdMap.get(id);

export const discountPct = (p: { price: number; oldPrice: number }) =>
  p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;

/** Rapikan isi keranjang: buang id tidak dikenal & duplikat; kalau ada paket, isi paket satuan dihapus. */
export function normalizeCart(ids: string[]): string[] {
  const seen = new Set<string>();
  let out = ids.filter((id) => byIdMap.has(id) && !seen.has(id) && (seen.add(id), true));
  const b = bundle;
  if (b && out.includes(b.id)) out = out.filter((id) => !b.items.includes(id));
  return out;
}

/** Hitung ulang harga dari katalog (dipakai server — harga dari browser tidak pernah dipercaya). */
export function priceCart(ids: string[]) {
  const norm = normalizeCart(ids);
  const items = norm.map((id) => {
    const p = byIdMap.get(id)!;
    return { id: p.id, title: p.title, category: p.category, price: p.price };
  });
  const subtotal = items.reduce((s, i) => s + i.price, 0);
  const savings = norm.reduce((s, id) => {
    const p = byIdMap.get(id)!;
    return s + (p.oldPrice > p.price ? p.oldPrice - p.price : 0);
  }, 0);
  return { ids: norm, items, subtotal, savings };
}
