"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { site, waLink } from "@/config/site";
import { apiGetOrder, apiSimulate } from "@/lib/api-client";
import type { PublicOrder } from "@/lib/api-types";
import { Icon } from "./Icon";
import { EASE } from "./motion-kit";
import { openSnap, PaidPanel, PaymentPanel, StateBox, useOrderPolling } from "./OrderPanels";
import { useStore } from "./store";

/** Halaman /pesanan/[id]?t=token — dibuka dari email atau setelah pembayaran */
export function OrderView({ id, token }: { id: string; token: string }) {
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { clear, setPending, pending } = useStore();

  useEffect(() => {
    if (!token) {
      setError("Link pesanan tidak lengkap.");
      return;
    }
    apiGetOrder(id, token)
      .then(setOrder)
      .catch((e) => setError(e instanceof Error ? e.message : "Pesanan tidak ditemukan."));
  }, [id, token]);

  const onChange = useCallback(
    (o: PublicOrder) => {
      setOrder(o);
      if (o.status === "paid" && pending?.id === o.id) {
        clear();
        setPending(null);
      }
    },
    [clear, setPending, pending]
  );
  useOrderPolling(order, onChange);

  const simulate = async () => {
    if (!order) return;
    setBusy(true);
    try {
      onChange(await apiSimulate(order.id, order.token));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="order-page">
      <div className="wrap">
        <motion.div className="order-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
          <div className="l-head">
            <h3>{order ? `Pesanan ${order.id}` : "Pesanan"}</h3>
            <span className="mono">{site.name}</span>
          </div>
          <div className="l-body">
            {error ? (
              <div className="state-box">
                <span className="big">#REF!</span>
                <h3>Pesanan tidak ditemukan</h3>
                <p>{error} Pastikan link dari email dibuka lengkap, atau chat admin.</p>
              </div>
            ) : !order ? (
              <div className="state-box">
                <span className="spin" style={{ margin: "0 auto", width: 22, height: 22 }} />
              </div>
            ) : order.status === "paid" ? (
              <PaidPanel order={order} />
            ) : order.status === "pending" ? (
              <PaymentPanel order={order} onReopenSnap={() => openSnap(order, { onSuccess: () => apiGetOrder(order.id, order.token).then(onChange) })} />
            ) : (
              <StateBox order={order} />
            )}
          </div>
          <div className="l-foot">
            {order?.status === "pending" && order.demo && (
              <button className="btn btn-primary block" type="button" disabled={busy} onClick={simulate}>
                <Icon name="bolt" />
                Simulasikan pembayaran berhasil
              </button>
            )}
            <div className="foot-row">
              <a className="btn btn-line" href="/">
                Kembali ke toko
              </a>
              <a className="btn btn-wa" href={waLink(`Halo ${site.name}, saya butuh bantuan untuk pesanan ${id}.`)} target="_blank" rel="noopener">
                <Icon name="chat" />
                Bantuan
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
