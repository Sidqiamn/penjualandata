"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { paymentMethods, type PaymentMethodId } from "@/config/site";
import { apiCreateOrder, apiGetOrder, apiSimulate } from "@/lib/api-client";
import type { PublicOrder } from "@/lib/api-types";
import { rp } from "@/lib/format";
import { getItem } from "@/lib/pricing";
import { Dialog } from "./Dialog";
import { Icon } from "./Icon";
import { EASE } from "./motion-kit";
import { openSnap, PaidPanel, PaymentPanel, StateBox, useOrderPolling } from "./OrderPanels";
import { useStore } from "./store";

type Buyer = { name: string; email: string; whatsapp: string };
const BUYER_KEY = "bd-buyer";
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const normWa = (v: string) => {
  let d = v.replace(/\D/g, "");
  if (d.startsWith("62")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return d;
};
const same = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

const TABS = ["Data", "Metode", "Bayar"];

export function CheckoutDialog() {
  const { checkoutOpen, setCheckoutOpen, ids, priced, clear, pending, setPending, toast } = useStore();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [buyer, setBuyer] = useState<Buyer>({ name: "", email: "", whatsapp: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Buyer, string>>>({});
  const [method, setMethod] = useState<PaymentMethodId | null>(null);
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState("");
  const close = useCallback(() => setCheckoutOpen(false), [setCheckoutOpen]);
  const wasOpen = useRef(false);

  useEffect(() => {
    try {
      const b = JSON.parse(localStorage.getItem(BUYER_KEY) || "null");
      if (b) setBuyer({ name: b.name || "", email: b.email || "", whatsapp: b.whatsapp || "" });
    } catch {}
  }, []);

  const go = (s: number) => {
    setDir(s >= step ? 1 : -1);
    setStep(s);
    setFormErr("");
  };

  // Saat dibuka: lanjutkan pesanan yang masih menunggu, atau mulai checkout baru
  useEffect(() => {
    if (!checkoutOpen) {
      if (wasOpen.current && order?.status !== "pending") {
        setOrder(null);
        setStep(1);
      }
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    if (pending && (!ids.length || same(pending.items, ids))) {
      setBusy(true);
      apiGetOrder(pending.id, pending.token)
        .then((o) => {
          setOrder(o);
          setMethod(o.method);
          setDir(1);
          setStep(o.status === "paid" ? 4 : 3);
          if (o.status !== "pending") setPending(null);
        })
        .catch(() => {
          setPending(null);
          setStep(1);
        })
        .finally(() => setBusy(false));
      return;
    }
    if (!ids.length) {
      setCheckoutOpen(false);
      toast("Keranjang masih kosong", "cart");
      return;
    }
    if (order && order.status === "pending" && !same(order.items.map((i) => i.id), ids)) setOrder(null);
    setStep(order && order.status === "pending" ? 3 : 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutOpen]);

  const onPaid = useCallback(
    (o: PublicOrder) => {
      setOrder(o);
      if (o.status === "paid") {
        setDir(1);
        setStep(4);
        clear();
        setPending(null);
        toast("Pembayaran berhasil", "check");
      } else if (o.status !== "pending") setPending(null);
    },
    [clear, setPending, toast]
  );
  useOrderPolling(order, onPaid, checkoutOpen);

  const validate = () => {
    const e: Partial<Record<keyof Buyer, string>> = {};
    if (buyer.name.trim().length < 2) e.name = "Isi nama lengkap kamu.";
    if (!emailRe.test(buyer.email.trim())) e.email = "Email belum benar. Link produk akan dikirim ke sini.";
    const wa = normWa(buyer.whatsapp);
    if (wa && !/^8\d{7,12}$/.test(wa)) e.whatsapp = "Nomor WhatsApp belum benar. Contoh: 812 3456 7890";
    setErrors(e);
    if (Object.keys(e).length) return false;
    try {
      localStorage.setItem(BUYER_KEY, JSON.stringify(buyer));
    } catch {}
    return true;
  };

  const pay = async () => {
    if (!method || busy) return;
    setBusy(true);
    setFormErr("");
    try {
      const o = await apiCreateOrder({
        items: ids,
        method,
        buyer: { name: buyer.name.trim(), email: buyer.email.trim(), whatsapp: buyer.whatsapp.trim() || undefined },
      });
      setOrder(o);
      setPending({ id: o.id, token: o.token, expiresAt: o.payment.expiresAt, items: ids });
      go(3);
      if (o.payment.kind === "snap") startSnap(o);
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : "Gagal membuat pembayaran.");
    } finally {
      setBusy(false);
    }
  };

  const refresh = useCallback(async () => {
    if (!order) return;
    try {
      onPaid(await apiGetOrder(order.id, order.token));
    } catch {}
  }, [order, onPaid]);

  const startSnap = (o: PublicOrder) =>
    openSnap(o, {
      onSuccess: () => apiGetOrder(o.id, o.token).then(onPaid).catch(() => {}),
      onPending: () => apiGetOrder(o.id, o.token).then(onPaid).catch(() => {}),
      onError: () => setFormErr("Halaman pembayaran gagal dibuka. Coba lagi."),
    });

  const simulate = async () => {
    if (!order) return;
    setBusy(true);
    try {
      onPaid(await apiSimulate(order.id, order.token));
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : "Simulasi gagal.");
    } finally {
      setBusy(false);
    }
  };

  const items = order ? order.items : ids.map((id) => getItem(id)!).filter(Boolean);
  const total = order ? order.amount : priced.subtotal;
  const field = (k: keyof Buyer) => ({
    value: buyer[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setBuyer((b) => ({ ...b, [k]: e.target.value }));
      if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
    },
  });

  let body: React.ReactNode = null;
  let foot: React.ReactNode = null;
  if (step === 1) {
    body = (
      <form
        id="buyerForm"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (validate()) go(2);
        }}
      >
        <h3 className="co-h">Data pembeli</h3>
        <p className="co-sub">Rincian pembelian dan link produk dikirim ke email ini.</p>
        <div className="mini-sum">
          <span>{items.length} produk</span>
          <b>{rp(total)}</b>
        </div>
        <div className="fields">
          <div className={`field${errors.name ? " bad" : ""}`}>
            <label htmlFor="f-name">Nama lengkap</label>
            <input id="f-name" autoComplete="name" placeholder="Nama kamu" {...field("name")} />
            {errors.name && <p className="err">{errors.name}</p>}
          </div>
          <div className={`field${errors.email ? " bad" : ""}`}>
            <label htmlFor="f-email">Email</label>
            <input id="f-email" type="email" inputMode="email" autoComplete="email" placeholder="nama@email.com" {...field("email")} />
            {errors.email ? <p className="err">{errors.email}</p> : <p className="hint">Pastikan benar, link produk dikirim otomatis ke sini.</p>}
          </div>
          <div className={`field${errors.whatsapp ? " bad" : ""}`}>
            <label htmlFor="f-wa">
              Nomor WhatsApp <span className="opt">(opsional)</span>
            </label>
            <div className="prefix">
              <span>+62</span>
              <input id="f-wa" inputMode="tel" autoComplete="tel-national" placeholder="812 3456 7890" {...field("whatsapp")} />
            </div>
            {errors.whatsapp ? <p className="err">{errors.whatsapp}</p> : <p className="hint">Untuk bantuan kalau ada kendala.</p>}
          </div>
        </div>
        <button type="submit" hidden />
      </form>
    );
    foot = (
      <button className="btn btn-primary block lg" type="submit" form="buyerForm">
        Pilih pembayaran <Icon name="arrow" className="ic-arrow" />
      </button>
    );
  } else if (step === 2) {
    body = (
      <div>
        <h3 className="co-h">Metode pembayaran</h3>
        <p className="co-sub">
          Total belanja <b style={{ color: "var(--ink)" }}>{rp(total)}</b>
        </p>
        <div className="methods" role="radiogroup" aria-label="Metode pembayaran">
          {paymentMethods.map((m) => (
            <label key={m.id} className="method">
              <input type="radio" name="pm" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} />
              <span className="m-logo">{m.badge}</span>
              <span className="m-txt">
                <b>{m.label}</b>
                <small>{m.sub}</small>
              </span>
              <span className="m-radio" />
            </label>
          ))}
        </div>
        <div className="auto-note">
          <Icon name="bolt" />
          <span>Pembayaran terverifikasi otomatis. Begitu kamu bayar, link produk langsung terbuka di sini dan dikirim ke email.</span>
        </div>
        {formErr && <p className="form-err">{formErr}</p>}
      </div>
    );
    foot = (
      <div className="foot-row">
        <button className="btn btn-line" type="button" onClick={() => go(1)}>
          Kembali
        </button>
        <button className="btn btn-primary" type="button" disabled={!method || busy} onClick={pay}>
          {busy ? <span className="spin" /> : null}
          {busy ? "Menyiapkan…" : `Bayar ${rp(total)}`}
        </button>
      </div>
    );
  } else if (step === 3 && order) {
    body =
      order.status === "pending" ? (
        <>
          <PaymentPanel order={order} onReopenSnap={() => startSnap(order)} />
          {formErr && <p className="form-err">{formErr}</p>}
        </>
      ) : order.status === "paid" ? (
        <PaidPanel order={order} />
      ) : (
        <StateBox order={order} />
      );
    foot =
      order.status === "pending" ? (
        <>
          {order.demo ? (
            <button className="btn btn-primary block lg" type="button" disabled={busy} onClick={simulate}>
              {busy ? <span className="spin" /> : <Icon name="bolt" />}
              Simulasikan pembayaran berhasil
            </button>
          ) : (
            <button className="btn btn-line block" type="button" onClick={refresh}>
              Sudah bayar? Cek status sekarang
            </button>
          )}
          <button
            className="text-btn"
            type="button"
            onClick={() => {
              setOrder(null);
              setPending(null);
              go(2);
            }}
          >
            Ganti metode pembayaran
          </button>
        </>
      ) : (
        <button
          className="btn btn-primary block"
          type="button"
          onClick={() => {
            setOrder(null);
            go(ids.length ? 1 : 1);
            if (!ids.length) close();
          }}
        >
          {ids.length ? "Checkout ulang" : "Tutup"}
        </button>
      );
  } else if (step === 4 && order) {
    body = <PaidPanel order={order} />;
    foot = (
      <button className="btn btn-primary block lg" type="button" onClick={close}>
        Selesai
      </button>
    );
  } else if (busy) {
    body = (
      <div className="state-box">
        <span className="spin" style={{ margin: "0 auto", width: 22, height: 22 }} />
      </div>
    );
  }

  const tabIndex = Math.min(step, 3) - 1;
  return (
    <Dialog open={checkoutOpen} onClose={close} labelledBy="coTitle">
      <div className="l-head">
        <h3 id="coTitle">{step === 4 ? "Pesanan selesai" : "Checkout"}</h3>
        <button className="close" type="button" onClick={close} aria-label="Tutup checkout">
          <Icon name="x" />
        </button>
      </div>
      <div className="co-tabs">
        {TABS.map((t, i) => (
          <span key={t} className={i === tabIndex && step !== 4 ? "on" : i < tabIndex || step === 4 ? "done" : undefined}>
            <b>{i < tabIndex || step === 4 ? "✓" : i + 1}</b>
            <i style={{ fontStyle: "normal" }}>{t}</i>
            {i === tabIndex && step !== 4 && <motion.span layoutId="co-ul" className="ul" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
          </span>
        ))}
      </div>
      <div className="l-body" data-lenis-prevent>
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={step + (order?.status ?? "")}
            custom={dir}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 26 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -26 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: EASE }}
          >
            {body}
          </motion.div>
        </AnimatePresence>
      </div>
      {foot && <div className="l-foot">{foot}</div>}
    </Dialog>
  );
}
