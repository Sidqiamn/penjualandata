"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useState } from "react";
import { site, waLink } from "@/config/site";
import { rp } from "@/lib/format";
import { Icon } from "./Icon";
import { EASE } from "./motion-kit";
import { useStore } from "./store";

/** Tombol WhatsApp melayang (muncul setelah lewat hero) + bar keranjang di bawah */
export function Floating() {
  const { ids, priced, dialogOpen, setCartOpen, setCheckoutOpen, pending } = useStore();
  const { scrollY } = useScroll();
  const [past, setPast] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setPast(v > 420));
  const showBar = (ids.length > 0 || !!pending) && !dialogOpen;
  useEffect(() => {
    document.body.classList.toggle("has-bar", showBar);
  }, [showBar]);

  return (
    <>
      <AnimatePresence>
        {past && !dialogOpen && (
          <motion.a
            className="fab"
            href={waLink(`Halo ${site.name}, saya mau tanya soal produknya.`)}
            target="_blank"
            rel="noopener"
            aria-label="Chat admin di WhatsApp"
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            whileHover={{ y: -2 }}
          >
            <Icon name="chat" />
            <span>Chat admin</span>
          </motion.a>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showBar && (
          <motion.div className="cart-bar" initial={{ y: "130%" }} animate={{ y: 0 }} exit={{ y: "130%" }} transition={{ duration: 0.45, ease: EASE }}>
            <div className="cart-bar-in">
              {pending && !ids.length ? (
                <>
                  <div className="cb-txt">
                    <small className="cb-pending">
                      <i />
                      Menunggu pembayaran
                    </small>
                    <b>{pending.id}</b>
                  </div>
                  <button className="btn btn-primary sm" type="button" onClick={() => setCheckoutOpen(true)}>
                    Lanjutkan bayar <Icon name="arrow" className="ic-arrow" />
                  </button>
                </>
              ) : (
                <>
                  <div className="cb-txt">
                    <small>
                      {ids.length} produk{priced.savings ? ` · hemat ${rp(priced.savings)}` : ""}
                    </small>
                    <b>{rp(priced.subtotal)}</b>
                  </div>
                  <button className="btn sm cb-view" type="button" onClick={() => setCartOpen(true)}>
                    Lihat
                  </button>
                  <button className="btn btn-primary sm" type="button" onClick={() => setCheckoutOpen(true)}>
                    Checkout <Icon name="arrow" className="ic-arrow" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
