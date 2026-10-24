"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback } from "react";
import { bundle, products } from "@/config/products";
import { rp } from "@/lib/format";
import { getItem } from "@/lib/pricing";
import { Dialog } from "./Dialog";
import { Icon } from "./Icon";
import { useStore } from "./store";

export function CartDrawer() {
  const { cartOpen, setCartOpen, ids, priced, remove, add, toast, setCheckoutOpen } = useStore();
  const close = useCallback(() => setCartOpen(false), [setCartOpen]);
  const items = ids.map((id) => getItem(id)!);

  let tip: { overlap: string[]; now: number } | null = null;
  if (bundle && !ids.includes(bundle.id)) {
    const overlap = bundle.items.filter((x) => ids.includes(x));
    if (overlap.length >= 2) tip = { overlap, now: overlap.reduce((s, id) => s + getItem(id)!.price, 0) };
  }
  const ups = items.length ? products.filter((p) => !ids.includes(p.id) && !(bundle && ids.includes(bundle.id) && bundle.items.includes(p.id))).slice(0, 3) : [];

  return (
    <Dialog open={cartOpen} onClose={close} variant="drawer" labelledBy="cartTitle">
      <div className="l-head">
        <h3 id="cartTitle">{items.length ? `Keranjang (${items.length})` : "Keranjang"}</h3>
        <button className="close" type="button" onClick={close} aria-label="Tutup keranjang">
          <Icon name="x" />
        </button>
      </div>
      <div className="l-body" data-lenis-prevent>
        {items.length ? (
          <ul className="ci-list">
            <AnimatePresence initial={false}>
              {items.map((p, i) => (
                <motion.li
                  key={p.id}
                  className="ci"
                  layout
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40, height: 0, minHeight: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="rn">{i + 1}</span>
                  <div className="ci-txt">
                    <b>{p.title}</b>
                    <span>{p.category}</span>
                  </div>
                  <span className="ci-p">{rp(p.price)}</span>
                  <button
                    className="ci-rm"
                    type="button"
                    aria-label={`Hapus ${p.title}`}
                    onClick={() => {
                      remove(p.id);
                      toast(`${p.title} dihapus`, "trash");
                    }}
                  >
                    <Icon name="trash" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <div className="cart-empty">
            <span className="big">#N/A</span>
            <b>Keranjang masih kosong</b>
            Pilih produk dulu, nanti muncul di sini.
            <br />
            <button className="btn btn-line sm" type="button" style={{ marginTop: 16 }} onClick={close}>
              Lihat produk
            </button>
          </div>
        )}
        {tip && bundle && (
          <motion.div className="tip-box" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <b>Lebih hemat pakai {bundle.title}</b>
            {tip.overlap.length} produk di keranjangmu ada di paket ini. Harga paket {rp(bundle.price)} sudah termasuk {bundle.items.length} produk (sekarang {rp(tip.now)} untuk {tip.overlap.length}).
            <div style={{ marginTop: 10 }}>
              <button className="btn btn-primary sm" type="button" onClick={() => add(bundle!.id)}>
                <Icon name="plus" />
                Ganti ke paket
              </button>
            </div>
          </motion.div>
        )}
        {ups.length > 0 && (
          <>
            <p className="up-h">Biasanya dibeli bareng</p>
            {ups.map((p) => (
              <div className="up-row" key={p.id}>
                <div className="t">
                  <b>{p.title}</b>
                  <span>{rp(p.price)}</span>
                </div>
                <button className="up-add" type="button" onClick={() => add(p.id)}>
                  <Icon name="plus" />
                  Tambah
                </button>
              </div>
            ))}
          </>
        )}
      </div>
      {items.length > 0 && (
        <div className="l-foot">
          <div className="cart-sum">
            <span>
              Subtotal<code>=SUM(C1:C{items.length})</code>
            </span>
            <b>{rp(priced.subtotal)}</b>
          </div>
          {priced.savings > 0 && <p className="save">Hemat {rp(priced.savings)} dari harga normal</p>}
          <button
            className="btn btn-primary block lg"
            type="button"
            onClick={() => {
              close();
              setTimeout(() => setCheckoutOpen(true), 200);
            }}
          >
            Lanjut checkout <Icon name="arrow" className="ic-arrow" />
          </button>
        </div>
      )}
    </Dialog>
  );
}
