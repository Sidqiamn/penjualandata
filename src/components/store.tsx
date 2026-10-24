"use client";

import { AnimatePresence, motion } from "motion/react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { bundle } from "@/config/products";
import { getItem, priceCart } from "@/lib/pricing";
import { Icon, type IconName } from "./Icon";

type Toast = { id: number; msg: string; icon: IconName };
export type PendingOrder = { id: string; token: string; expiresAt: string; items: string[] };

type Store = {
  ids: string[];
  priced: ReturnType<typeof priceCart>;
  has: (id: string) => boolean;
  add: (id: string, from?: HTMLElement | null, silent?: boolean) => void;
  remove: (id: string) => void;
  clear: () => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  detailId: string | null;
  setDetailId: (v: string | null) => void;
  checkoutOpen: boolean;
  setCheckoutOpen: (v: boolean) => void;
  pending: PendingOrder | null;
  setPending: (p: PendingOrder | null) => void;
  toast: (msg: string, icon?: IconName) => void;
  dialogOpen: boolean;
  cartBtnRef: React.RefObject<HTMLButtonElement | null>;
};

const Ctx = createContext<Store | null>(null);
export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error("StoreProvider missing");
  return s;
};

const CART_KEY = "bd-cart";
const PENDING_KEY = "bd-pending";
const read = <T,>(k: string, d: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : d;
  } catch {
    return d;
  }
};
const write = (k: string, v: unknown) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [pending, setPendingState] = useState<PendingOrder | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const cartBtnRef = useRef<HTMLButtonElement | null>(null);
  const tid = useRef(0);

  useEffect(() => {
    setIds(read<string[]>(CART_KEY, []).filter((id) => getItem(id)));
    const p = read<PendingOrder | null>(PENDING_KEY, null);
    if (p && Date.parse(p.expiresAt) > Date.now()) setPendingState(p);
    else write(PENDING_KEY, null);
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) write(CART_KEY, ids);
  }, [ids, ready]);

  const toast = useCallback((msg: string, icon: IconName = "check") => {
    const id = ++tid.current;
    setToasts((t) => [...t.slice(-2), { id, msg, icon }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const fly = useCallback((from: HTMLElement) => {
    const to = cartBtnRef.current;
    if (!to || matchMedia("(prefers-reduced-motion: reduce)").matches || !from.animate) return;
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    const d = document.createElement("span");
    d.className = "fly";
    const sx = a.left + a.width / 2 - 7;
    const sy = a.top + a.height / 2 - 7;
    d.style.left = sx + "px";
    d.style.top = sy + "px";
    document.body.appendChild(d);
    const dx = b.left + b.width / 2 - 7 - sx;
    const dy = b.top + b.height / 2 - 7 - sy;
    d.animate(
      [
        { transform: "translate(0,0) scale(1)" },
        { transform: `translate(${dx * 0.5}px,${Math.min(dy * 0.5, 0) - 90}px) scale(1.4)`, offset: 0.45 },
        { transform: `translate(${dx}px,${dy}px) scale(.5)`, opacity: 0.5 },
      ],
      { duration: 700, easing: "cubic-bezier(.45,0,.25,1)" }
    ).onfinish = () => d.remove();
  }, []);

  const idsRef = useRef<string[]>([]);
  idsRef.current = ids;
  const add = useCallback(
    (id: string, from?: HTMLElement | null, silent?: boolean) => {
      const item = getItem(id);
      const cur = idsRef.current;
      if (!item || cur.includes(id)) return;
      if (bundle && cur.includes(bundle.id) && bundle.items.includes(id)) {
        toast(`Sudah termasuk di ${bundle.title}`, "check");
        return;
      }
      let next = [...cur];
      let replaced = false;
      if (bundle && id === bundle.id) {
        const b = bundle;
        const before = next.length;
        next = next.filter((x) => !b.items.includes(x));
        replaced = next.length < before;
      }
      next.push(id);
      idsRef.current = next;
      setIds(next);
      if (!silent) toast(replaced ? "Produk satuan diganti paket (lebih hemat)" : `${item.title} masuk keranjang`);
      if (from) fly(from);
    },
    [fly, toast]
  );
  const remove = useCallback((id: string) => setIds((cur) => cur.filter((x) => x !== id)), []);
  const clear = useCallback(() => setIds([]), []);
  const setPending = useCallback((p: PendingOrder | null) => {
    setPendingState(p);
    write(PENDING_KEY, p);
  }, []);

  const priced = useMemo(() => priceCart(ids), [ids]);
  const value: Store = {
    ids: priced.ids,
    priced,
    has: (id) => priced.ids.includes(id),
    add,
    remove,
    clear,
    cartOpen,
    setCartOpen,
    detailId,
    setDetailId,
    checkoutOpen,
    setCheckoutOpen,
    pending,
    setPending,
    toast,
    dialogOpen: cartOpen || !!detailId || checkoutOpen,
    cartBtnRef,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className="toast"
              layout
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.3 }}
            >
              <Icon name={t.icon} />
              <span>{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
