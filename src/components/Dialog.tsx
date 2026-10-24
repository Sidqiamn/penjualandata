"use client";

import { useLenis } from "lenis/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { EASE } from "./motion-kit";

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(max-width: 640px)");
    const f = () => setM(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  return m;
}

/** Modal / drawer dengan animasi, kunci scroll (Lenis), fokus terjebak di dalam, dan tombol Esc */
export function Dialog({
  open,
  onClose,
  variant = "modal",
  labelledBy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  variant?: "modal" | "drawer";
  labelledBy: string;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const lenis = useLenis();
  const mobile = useIsMobile();
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement as HTMLElement;
    lenis?.stop();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const t = setTimeout(() => {
      const f = panel.current?.querySelector<HTMLElement>("[data-autofocus], .l-body input, .close");
      f?.focus({ preventScroll: true });
    }, 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab" && panel.current) {
        const els = Array.from(panel.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,[tabindex]:not([tabindex="-1"])')).filter((x) => x.offsetParent !== null);
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prev;
      lenis?.start();
      if (opener.current && document.contains(opener.current)) opener.current.focus({ preventScroll: true });
    };
  }, [open, lenis, onClose]);

  if (!mounted) return null;
  const drawer = variant === "drawer";
  const panelMotion = drawer
    ? { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } }
    : mobile
      ? { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } }
      : { initial: { opacity: 0, y: 24, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 16, scale: 0.98 } };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="layer" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
          <motion.div className="scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
          {drawer ? (
            <motion.aside ref={panel} className="drawer" {...panelMotion} transition={{ duration: 0.45, ease: EASE }}>
              {children}
            </motion.aside>
          ) : (
            <div className="modal-pos">
              <motion.div ref={panel} className="modal" {...panelMotion} transition={{ duration: 0.45, ease: EASE }}>
                {children}
              </motion.div>
            </div>
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
