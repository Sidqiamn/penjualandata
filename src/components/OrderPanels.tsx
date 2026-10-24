"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { paymentMethods } from "@/config/site";
import { apiGetOrder, orderPath } from "@/lib/api-client";
import type { PublicOrder } from "@/lib/api-types";
import { countdown, rp } from "@/lib/format";
import { Icon } from "./Icon";
import { EASE } from "./motion-kit";

/* ---------------- util kecil ---------------- */

export function useNow(active = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

export function CopyButton({ text, label = "Salin" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  const onClick = () => {
    const ok = () => {
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    };
    try {
      navigator.clipboard.writeText(text).then(ok, () => fallback(text) && ok());
    } catch {
      if (fallback(text)) ok();
    }
  };
  return (
    <button type="button" className={`copy${done ? " done" : ""}`} onClick={onClick}>
      <Icon name={done ? "check" : "copy"} />
      {done ? "Disalin" : label}
    </button>
  );
}
function fallback(text: string) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

const groupVA = (v: string) => v.replace(/(\d{4})(?=\d)/g, "$1 ");
export const methodLabel = (id: string) => paymentMethods.find((m) => m.id === id)?.label ?? id;

/* ---------------- polling status ---------------- */

/** Tanya status pesanan tiap 3 detik selama masih menunggu (berhenti saat tab tidak terlihat). */
export function useOrderPolling(order: PublicOrder | null, onChange: (o: PublicOrder) => void, enabled = true) {
  const cb = useRef(onChange);
  cb.current = onChange;
  const extra = useRef(0);
  const waiting = order && (order.status === "pending" || (order.status === "paid" && order.email.status === "pending"));
  useEffect(() => {
    if (!order || !waiting || !enabled) return;
    extra.current = 0;
    let stop = false;
    const tick = async () => {
      if (document.hidden) return;
      try {
        const o = await apiGetOrder(order.id, order.token);
        if (stop) return;
        if (o.status !== order.status || o.email.status !== order.email.status) cb.current(o);
        if (o.status === "paid" && o.email.status === "pending" && ++extra.current > 6) stop = true;
      } catch {
        /* coba lagi di putaran berikutnya */
      }
    };
    const t = setInterval(tick, 3000);
    const onVis = () => !document.hidden && tick();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [order, waiting, enabled]);
}

/* ---------------- Midtrans Snap ---------------- */

type SnapCallbacks = { onSuccess?: () => void; onPending?: () => void; onError?: () => void; onClose?: () => void };
declare global {
  interface Window {
    snap?: { pay: (token: string, cb: SnapCallbacks) => void };
  }
}
export function openSnap(order: PublicOrder, cb: SnapCallbacks) {
  if (order.payment.kind !== "snap") return;
  const { scriptUrl, clientKey, token } = order.payment;
  const run = () => window.snap?.pay(token, cb);
  if (window.snap) return run();
  const s = document.createElement("script");
  s.src = scriptUrl;
  s.setAttribute("data-client-key", clientKey);
  s.onload = run;
  s.onerror = () => cb.onError?.();
  document.head.appendChild(s);
}

/* ---------------- panel pembayaran ---------------- */

const HOWTO: Record<string, string[]> = {
  BCA: [
    "Buka BCA mobile → m-Transfer → BCA Virtual Account.",
    "Tempel nomor VA di atas, pastikan nama toko & nominal sesuai.",
    "Konfirmasi dengan PIN. Dari bank lain: transfer antarbank ke BCA dengan nomor VA ini.",
  ],
  BNI: [
    "Buka BNI Mobile Banking → Transfer → Virtual Account Billing.",
    "Tempel nomor VA di atas, pastikan nominal sesuai.",
    "Konfirmasi transaksi. Dari bank lain: transfer antarbank ke BNI dengan nomor VA ini.",
  ],
};

export function PaymentPanel({ order, onReopenSnap }: { order: PublicOrder; onReopenSnap?: () => void }) {
  const now = useNow(order.status === "pending");
  const left = Date.parse(order.payment.expiresAt) - now;
  const p = order.payment;
  return (
    <div>
      {order.demo && (
        <div className="demo-banner">
          <Icon name="alert" />
          <span>
            <b>Mode demo.</b> Ini bukan pembayaran sungguhan. Tekan <b>Simulasikan pembayaran berhasil</b> untuk melihat alurnya sampai produk terkirim.
          </span>
        </div>
      )}
      {order.sandbox && (
        <div className="demo-banner">
          <Icon name="alert" />
          <span>
            <b>Mode sandbox Midtrans.</b> Bayar memakai simulator: <a href="https://simulator.sandbox.midtrans.com" target="_blank" rel="noopener">simulator.sandbox.midtrans.com</a>
          </span>
        </div>
      )}
      <div className="pay-top">
        <div>
          <small>Total bayar</small>
          <span className="amount">{rp(order.amount)}</span>
        </div>
        <div className={`timer${left < 5 * 60_000 ? " low" : ""}`}>
          <small>Sisa waktu</small>
          <b>{countdown(left)}</b>
        </div>
      </div>
      <div className="pay-card">
        <div className="pay-card-h">
          <span>
            No. pesanan <b>{order.id}</b>
          </span>
          <span>{methodLabel(order.method)}</span>
        </div>
        <div className="pay-card-b">
          {p.kind === "qris" && (
            <>
              <div className="qr-box">
                {p.qrSvg ? <div style={{ width: "100%", height: "100%" }} dangerouslySetInnerHTML={{ __html: p.qrSvg }} /> : p.qrUrl ? <img src={p.qrUrl} alt="Kode QRIS" /> : null}
                <motion.span className="scan" initial={{ top: "8%" }} animate={{ top: ["8%", "90%", "8%"] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }} />
              </div>
              <p className="qr-cap">Scan dengan GoPay, OVO, DANA, ShopeePay, atau m-banking. Nominal sudah terisi otomatis.</p>
            </>
          )}
          {p.kind === "va" && (
            <>
              <div className="va-row">
                <div>
                  <small style={{ display: "block", fontSize: 11.5, color: "var(--muted)" }}>Nomor Virtual Account {p.bank}</small>
                  <span className="no">{groupVA(p.vaNumber)}</span>
                </div>
                <CopyButton text={p.vaNumber} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <CopyButton text={String(order.amount)} label="Salin nominal" />
              </div>
              <ol className="howto">
                {(HOWTO[p.bank] || []).map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </>
          )}
          {p.kind === "snap" && (
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>Halaman pembayaran Midtrans terbuka di atas halaman ini. Kalau tertutup, buka lagi:</p>
              <button className="btn btn-primary" type="button" style={{ marginTop: 12 }} onClick={onReopenSnap}>
                Buka halaman pembayaran
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="wait" role="status">
        <span className="dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <div>
          <b>Menunggu pembayaran…</b>
          <small>Halaman ini otomatis berganti begitu pembayaran masuk. Tidak perlu kirim bukti transfer.</small>
        </div>
      </div>
    </div>
  );
}

/* ---------------- panel lunas ---------------- */

export function PaidPanel({ order }: { order: PublicOrder }) {
  const first = order.buyer.name.split(" ")[0];
  const email = <b>{order.buyer.email}</b>;
  const mail =
    order.email.status === "sent" ? (
      <>Rincian pembelian dan link produk sudah dikirim ke {email}. Cek inbox, atau folder Spam/Promosi kalau belum terlihat.</>
    ) : order.email.status === "pending" ? (
      <>Email rincian pembelian sedang dikirim ke {email}…</>
    ) : order.email.status === "failed" ? (
      <>Email ke {email} belum berhasil terkirim. Link di bawah tetap bisa dipakai, dan admin bisa mengirim ulang lewat WhatsApp.</>
    ) : (
      <>
        {order.demo ? "Mode demo: " : ""}email belum dikirim karena pengirim email (SMTP) belum diatur. Setelah diatur, rincian dan link otomatis dikirim ke {email}.
      </>
    );
  const pageUrl = typeof window !== "undefined" ? window.location.origin + orderPath(order) : orderPath(order);
  return (
    <div className="paid">
      <svg className="big-check" viewBox="0 0 76 76" aria-hidden="true">
        <motion.rect x="3" y="3" width="70" height="70" rx="6" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: EASE }} />
        <motion.path d="M21 39l11 11 23-24" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.55, ease: EASE }} />
      </svg>
      <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        Pembayaran berhasil
      </motion.h3>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>
        Terima kasih, {first}. Produkmu sudah bisa dibuka sekarang.
      </motion.p>
      <motion.div className="mailnote" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}>
        <Icon name="mail" />
        <span>{mail}</span>
      </motion.div>
      <motion.div className="deliv" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.9 } } }}>
        <div className="deliv-h">Akses produk</div>
        {(order.deliveries || []).map((d) => (
          <motion.div key={d.id} className="deliv-row" variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}>
            <b>{d.title}</b>
            <div className="deliv-links">
              {d.links.map((l) => (
                <a key={l.url} className="btn btn-primary sm" href={l.url} target="_blank" rel="noopener">
                  <Icon name={/drive\.google/.test(l.url) ? "drive" : "link"} />
                  {l.label}
                </a>
              ))}
              {!d.links.length && <span style={{ fontSize: 13, color: "var(--muted)" }}>Link dikirim admin lewat email.</span>}
            </div>
            {d.attachments.length > 0 && <small>File {d.attachments.join(", ")} juga terlampir di email.</small>}
          </motion.div>
        ))}
      </motion.div>
      <div className="inv-big">
        {order.id}
        <CopyButton text={pageUrl} label="Salin link pesanan" />
      </div>
    </div>
  );
}

export function StateBox({ order }: { order: PublicOrder }) {
  return (
    <div className="state-box">
      <span className="big">{order.status === "expired" ? "#TIMEOUT" : "#VALUE!"}</span>
      <h3>{order.status === "expired" ? "Waktu pembayaran habis" : "Pembayaran tidak berhasil"}</h3>
      <p>Tidak ada uang yang terpotong untuk pesanan ini. Silakan checkout ulang untuk membuat pembayaran baru.</p>
    </div>
  );
}

export function useOrderRefresh(order: PublicOrder | null, set: (o: PublicOrder) => void) {
  const [checking, setChecking] = useState(false);
  const check = useCallback(async () => {
    if (!order) return;
    setChecking(true);
    try {
      set(await apiGetOrder(order.id, order.token));
    } catch {
      /* abaikan */
    } finally {
      setChecking(false);
    }
  }, [order, set]);
  return { check, checking };
}
