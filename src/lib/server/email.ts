import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import nodemailer, { type Transporter } from "nodemailer";
import { site } from "@/config/site";
import { env, smtpConfigured } from "./env";
import { orderEmail } from "./email-template";
import { deliveriesFor } from "./fulfillment";
import type { Order } from "./types";

let transporter: Transporter | null = null;
function transport() {
  if (!smtpConfigured()) return null;
  transporter ??= nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
    connectionTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return transporter;
}

const FILES_DIR = path.join(process.cwd(), "private", "files");
const MAX_ATTACH = 15 * 1024 * 1024;

async function attachmentsFor(order: Order) {
  const out: { filename: string; path: string }[] = [];
  let total = 0;
  for (const d of deliveriesFor(order.items)) {
    for (const a of d.attachmentFiles) {
      const p = path.join(FILES_DIR, path.basename(a.file));
      try {
        const st = await fs.stat(p);
        if (total + st.size > MAX_ATTACH) continue;
        total += st.size;
        out.push({ filename: a.filename, path: p });
      } catch {
        console.warn(`[email] lampiran tidak ditemukan: private/files/${a.file}`);
      }
    }
  }
  return out;
}

export async function sendOrderEmail(order: Order): Promise<{ status: "sent" | "skipped" | "failed"; error?: string }> {
  const orderUrl = `${env.siteUrl}/pesanan/${order.id}?t=${order.token}`;
  const delivered = deliveriesFor(order.items).map((d) => ({
    title: d.title,
    links: d.links,
    attachments: d.attachmentFiles.map((a) => a.filename),
  }));
  const attachments = await attachmentsFor(order);
  const attached = new Set(attachments.map((a) => a.filename));
  delivered.forEach((d) => (d.attachments = d.attachments.filter((f) => attached.has(f))));
  const mail = orderEmail(order, delivered, { siteUrl: env.siteUrl, orderUrl });

  const t = transport();
  if (!t) {
    // Belum ada SMTP: simpan pratinjau email saat development supaya bisa dilihat
    if (!env.isProd) {
      const dir = path.join(process.cwd(), ".emails");
      await fs.mkdir(dir, { recursive: true }).catch(() => {});
      await fs.writeFile(path.join(dir, `${order.id}.html`), mail.html).catch(() => {});
      console.info(`[email] SMTP belum diatur. Pratinjau disimpan di .emails/${order.id}.html`);
    }
    return { status: "skipped" };
  }
  try {
    await t.sendMail({
      from: env.smtp.from || `${site.name} <${env.smtp.user}>`,
      to: `${order.buyer.name.replace(/[<>"]/g, "")} <${order.buyer.email}>`,
      replyTo: env.smtp.replyTo || undefined,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      attachments,
    });
    return { status: "sent" };
  } catch (err) {
    console.error("[email] gagal kirim", err);
    return { status: "failed", error: err instanceof Error ? err.message : String(err) };
  }
}
