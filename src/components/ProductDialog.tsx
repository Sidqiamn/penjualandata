"use client";

import { useCallback } from "react";
import { bundle } from "@/config/products";
import { site, waLink } from "@/config/site";
import { rp } from "@/lib/format";
import { bundleUnitTotal, discountPct, getItem } from "@/lib/pricing";
import { Dialog } from "./Dialog";
import { Icon } from "./Icon";
import { Preview } from "./Previews";
import { useStore } from "./store";

export function ProductDialog() {
  const { detailId, setDetailId, has, add, setCartOpen, setCheckoutOpen } = useStore();
  const p = detailId ? getItem(detailId) : null;
  const close = useCallback(() => setDetailId(null), [setDetailId]);
  const off = p ? discountPct(p) : 0;
  const inCart = p ? has(p.id) : false;
  return (
    <Dialog open={!!p} onClose={close} labelledBy="dTitle">
      {p && (
        <>
          <div className="l-head">
            <span className="mono">
              {p.category.toUpperCase()} · {p.format}
            </span>
            <button className="close" type="button" onClick={close} aria-label="Tutup">
              <Icon name="x" />
            </button>
          </div>
          <div className="l-body" data-lenis-prevent>
            {p.preview === "bundle" && bundle ? (
              <table className="calc" style={{ border: "1px solid var(--grid)", background: "var(--sheet)" }}>
                <thead>
                  <tr>
                    <th>Isi paket</th>
                    <th>Harga</th>
                  </tr>
                </thead>
                <tbody>
                  {bundle.items.map((id) => {
                    const x = getItem(id)!;
                    return (
                      <tr key={id}>
                        <td>{x.title}</td>
                        <td>{rp(x.price)}</td>
                      </tr>
                    );
                  })}
                  <tr className="sum">
                    <td>Kalau beli satuan</td>
                    <td>
                      <s>{rp(bundleUnitTotal)}</s>
                    </td>
                  </tr>
                  <tr className="pay">
                    <td>Harga paket</td>
                    <td>{rp(bundle.price)}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="d-prev">
                <div className="prev">
                  <Preview kind={p.preview} />
                </div>
              </div>
            )}
            <h3 className="d-title" id="dTitle">
              {p.title}
            </h3>
            <p className="d-desc">{p.longDesc}</p>
            <table className="spec">
              <tbody>
                <tr>
                  <th>Isi</th>
                  <td>
                    <ul className="incl">
                      {p.includes.map((x) => (
                        <li key={x}>
                          <Icon name="check" />
                          <span>{x}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
                <tr>
                  <th>Format</th>
                  <td>{p.format}</td>
                </tr>
                <tr>
                  <th>Pengiriman</th>
                  <td>Otomatis setelah bayar: link tampil di layar dan dikirim ke email</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="l-foot">
            <div className="d-row">
              <div className="price">
                <b>{rp(p.price)}</b>
                <small>
                  {off ? (
                    <>
                      <s>{rp(p.oldPrice)}</s>
                      <em>hemat {off}%</em>
                    </>
                  ) : (
                    "harga normal"
                  )}
                </small>
              </div>
              <div className="d-btns">
                <button
                  className={`btn btn-line add${inCart ? " added" : ""}`}
                  type="button"
                  onClick={(e) => {
                    if (inCart) {
                      close();
                      setCartOpen(true);
                    } else add(p.id, e.currentTarget);
                  }}
                >
                  <Icon name={inCart ? "check" : "plus"} />
                  {inCart ? "Di keranjang" : "Keranjang"}
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => {
                    if (!inCart) add(p.id, null, true);
                    close();
                    setTimeout(() => setCheckoutOpen(true), 220);
                  }}
                >
                  Beli sekarang <Icon name="arrow" className="ic-arrow" />
                </button>
              </div>
            </div>
            <a className="ask" href={waLink(`Halo ${site.name}, saya mau tanya soal "${p.title}".`)} target="_blank" rel="noopener">
              <Icon name="chat" />
              Tanya produk ini di WhatsApp
            </a>
          </div>
        </>
      )}
    </Dialog>
  );
}
