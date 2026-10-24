"use client";

import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { site, waLink } from "@/config/site";
import { Icon } from "./Icon";
import { useStore } from "./store";

export function Header({ minimal = false }: { minimal?: boolean }) {
  const { ids, setCartOpen, cartBtnRef } = useStore();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.3 });
  return (
    <header className="topbar">
      <div className="wrap topbar-in">
        <a className="brand" href="/#top">
          <img src="/logo.png" alt="" width={30} height={30} />
          <b>{site.name}</b>
          <span>Data &amp; AI</span>
        </a>
        {!minimal && (
          <nav className="nav" aria-label="Navigasi utama">
            <a href="#produk">Produk</a>
            <a href="#cara">Cara beli</a>
            <a href="#faq">FAQ</a>
          </nav>
        )}
        <div className="top-actions">
          <a className="btn btn-line sm hide-sm" href={waLink(`Halo ${site.name}, saya mau tanya soal produknya.`)} target="_blank" rel="noopener">
            <Icon name="chat" />
            Tanya admin
          </a>
          {!minimal && (
            <button ref={cartBtnRef} className="cart-btn" type="button" aria-label={`Buka keranjang, ${ids.length} produk`} onClick={() => setCartOpen(true)}>
              <Icon name="cart" />
              <AnimatePresence>
                {ids.length > 0 && (
                  <motion.span
                    key={ids.length}
                    className="count"
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: [1.35, 1], opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {ids.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )}
        </div>
      </div>
      {!minimal && <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden="true" />}
    </header>
  );
}
