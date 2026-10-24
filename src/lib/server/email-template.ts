import "server-only";
import { site, paymentMethods, waLink } from "@/config/site";
import { fmtWIB, rp } from "@/lib/format";
import type { Order } from "./types";

type Delivered = { title: string; links: { label: string; url: string }[]; attachments: string[] };

const e = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const C = { ink: "#0B1530", muted: "#56637F", faint: "#8692AB", line: "#DAE2EF", soft: "#EDF1F8", blue: "#1641D8", ok: "#0F7F59", bg: "#F1F5FB" };
const FONT = "font-family:Arial,Helvetica,sans-serif;";
const MONO = "font-family:Menlo,Consolas,'Courier New',monospace;";

export function orderEmail(order: Order, delivered: Delivered[], opts: { siteUrl: string; orderUrl: string }) {
  const method = paymentMethods.find((m) => m.id === order.method)?.label ?? order.method;
  const paidAt = order.paidAt ? fmtWIB(order.paidAt) : fmtWIB(new Date());
  const subject = `Pembayaran berhasil · ${order.id} · Akses produk ${site.name}`;
  const first = order.buyer.name.split(" ")[0];

  const itemsRows = order.items
    .map(
      (i) => `<tr>
        <td style="${FONT}padding:10px 14px;border-bottom:1px solid ${C.soft};font-size:14px;color:${C.ink}">${e(i.title)}</td>
        <td align="right" style="${MONO}padding:10px 14px;border-bottom:1px solid ${C.soft};font-size:13px;color:${C.ink};white-space:nowrap">${rp(i.price)}</td>
      </tr>`
    )
    .join("");

  const deliveryBlocks = delivered
    .map(
      (d) => `<tr><td style="padding:0 0 14px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-radius:8px">
          <tr><td style="${FONT}padding:14px 16px 6px;font-size:15px;font-weight:bold;color:${C.ink}">${e(d.title)}</td></tr>
          <tr><td style="padding:4px 16px 14px">
            ${d.links
              .map(
                (l) => `<a href="${e(l.url)}" style="${FONT}display:inline-block;margin:4px 6px 4px 0;padding:10px 16px;background:${C.blue};color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold">${e(l.label)} &rarr;</a>`
              )
              .join("")}
            ${d.attachments.length ? `<div style="${FONT}font-size:12.5px;color:${C.muted};margin-top:6px">Terlampir di email ini: ${d.attachments.map(e).join(", ")}</div>` : ""}
          </td></tr>
        </table>
      </td></tr>`
    )
    .join("");

  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.bg}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">Pembayaran ${e(order.id)} berhasil. Link produkmu ada di email ini.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center" style="padding:28px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
    <tr><td style="padding:0 4px 16px">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td><img src="${e(opts.siteUrl)}/logo.png" width="40" height="40" alt="${e(site.name)}" style="display:block;border-radius:50%"></td>
        <td style="${FONT}padding-left:10px;font-size:18px;font-weight:bold;color:${C.ink}">${e(site.name)} <span style="font-weight:normal;color:${C.faint};font-size:13px">· ${e(site.tagline)}</span></td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#ffffff;border:1px solid ${C.line};border-radius:10px;overflow:hidden">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="background:${C.soft};border-bottom:1px solid ${C.line};padding:10px 16px;${MONO}font-size:12px;color:${C.muted}">
          <span style="color:${C.ok};font-weight:bold">&#10003; LUNAS</span> &nbsp;·&nbsp; ${e(order.id)}
        </td></tr>
        <tr><td style="padding:24px 22px 8px">
          <div style="${FONT}font-size:22px;font-weight:bold;color:${C.ink};line-height:1.25">Halo ${e(first)}, pembayaranmu sudah diterima.</div>
          <div style="${FONT}font-size:15px;color:${C.muted};line-height:1.6;margin-top:8px">Terima kasih sudah belanja di ${e(site.name)}. Semua akses produk ada di bawah. Simpan email ini supaya mudah dibuka lagi.</div>
        </td></tr>
        <tr><td style="padding:16px 22px 4px">
          <div style="${MONO}font-size:11px;letter-spacing:1.5px;color:${C.faint};text-transform:uppercase;margin-bottom:10px">Akses produk</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${deliveryBlocks}</table>
        </td></tr>
        <tr><td style="padding:8px 22px 4px">
          <div style="${MONO}font-size:11px;letter-spacing:1.5px;color:${C.faint};text-transform:uppercase;margin-bottom:10px">Rincian pembelian</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-radius:8px">
            ${itemsRows}
            <tr>
              <td style="${FONT}padding:12px 14px;font-size:14px;font-weight:bold;color:${C.ink}">Total dibayar</td>
              <td align="right" style="${MONO}padding:12px 14px;font-size:15px;font-weight:bold;color:${C.ink};white-space:nowrap">${rp(order.amount)}</td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px">
            <tr><td style="${FONT}font-size:13px;color:${C.muted};padding:3px 0">No. pesanan</td><td align="right" style="${MONO}font-size:13px;color:${C.ink}">${e(order.id)}</td></tr>
            <tr><td style="${FONT}font-size:13px;color:${C.muted};padding:3px 0">Waktu bayar</td><td align="right" style="${FONT}font-size:13px;color:${C.ink}">${e(paidAt)}</td></tr>
            <tr><td style="${FONT}font-size:13px;color:${C.muted};padding:3px 0">Metode</td><td align="right" style="${FONT}font-size:13px;color:${C.ink}">${e(method)}</td></tr>
            <tr><td style="${FONT}font-size:13px;color:${C.muted};padding:3px 0">Atas nama</td><td align="right" style="${FONT}font-size:13px;color:${C.ink}">${e(order.buyer.name)}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:18px 22px 24px">
          <a href="${e(opts.orderUrl)}" style="${FONT}display:inline-block;padding:10px 16px;border:1px solid ${C.line};color:${C.ink};text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold">Buka halaman pesanan</a>
          <div style="${FONT}font-size:12.5px;color:${C.faint};line-height:1.6;margin-top:16px">Link produk khusus untuk pemakaian pribadi, mohon tidak dibagikan. Ada kendala? Balas email ini atau chat <a href="${e(waLink(`Halo ${site.name}, saya butuh bantuan untuk pesanan ${order.id}.`))}" style="color:${C.blue}">WhatsApp admin</a> dengan menyebutkan nomor pesanan.</div>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="${FONT}padding:16px 4px;font-size:12px;color:${C.faint};text-align:center">${e(site.name)} · ${e(site.handle)} · Email ini dikirim otomatis setelah pembayaran terverifikasi.</td></tr>
  </table>
</td></tr></table>
</body></html>`;

  const text = [
    `Halo ${first}, pembayaranmu sudah diterima.`,
    "",
    `No. pesanan: ${order.id}`,
    `Waktu bayar: ${paidAt}`,
    `Metode: ${method}`,
    "",
    "AKSES PRODUK",
    ...delivered.flatMap((d) => [d.title, ...d.links.map((l) => `- ${l.label}: ${l.url}`), ""]),
    "RINCIAN",
    ...order.items.map((i) => `- ${i.title}: ${rp(i.price)}`),
    `Total dibayar: ${rp(order.amount)}`,
    "",
    `Halaman pesanan: ${opts.orderUrl}`,
    `Bantuan: ${waLink()}`,
  ].join("\n");

  return { subject, html, text };
}
