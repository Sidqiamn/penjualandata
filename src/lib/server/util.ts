import "server-only";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** BD-261024-7K3QXA — mudah dibaca, unik per pesanan */
export function newOrderId(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).formatToParts(now);
  const g = (t: string) => parts.find((p) => p.type === t)!.value;
  let r = "";
  for (let i = 0; i < 6; i++) r += ALPHA[randomInt(ALPHA.length)];
  return `BD-${g("year")}${g("month")}${g("day")}-${r}`;
}

export const newToken = () => randomBytes(24).toString("base64url");

export function randomDigits(n: number) {
  let s = "";
  for (let i = 0; i < n; i++) s += randomInt(10);
  return s;
}

export function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export const sha512 = (s: string) => createHash("sha512").update(s).digest("hex");

/** "2026-10-24 19:30:00 +0700" — format waktu yang diminta Midtrans */
export function midtransTime(d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Jakarta",
  }).formatToParts(d);
  const g = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${g("year")}-${g("month")}-${g("day")} ${g("hour")}:${g("minute")}:${g("second")} +0700`;
}

export function clientIp(req: Request) {
  const h = req.headers;
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "local").trim();
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
