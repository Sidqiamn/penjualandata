import "server-only";
import { Redis } from "@upstash/redis";
import { env, redisConfigured } from "./env";

/** Penyimpanan kecil key-value. Produksi: Upstash Redis. Lokal tanpa Redis: memori (hilang saat restart). */
interface KV {
  kind: "redis" | "memory";
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSec?: number): Promise<void>;
  /** set hanya kalau belum ada (untuk kunci/lock). true = berhasil mengunci */
  setNX(key: string, value: unknown, ttlSec: number): Promise<boolean>;
  incr(key: string, ttlSec: number): Promise<number>;
  del(key: string): Promise<void>;
}

function redisKV(): KV {
  const r = new Redis({ url: env.redis.url, token: env.redis.token });
  return {
    kind: "redis",
    async get<T>(key: string) {
      return ((await r.get<T>(key)) ?? null) as T | null;
    },
    async set(key, value, ttlSec) {
      if (ttlSec) await r.set(key, value, { ex: ttlSec });
      else await r.set(key, value);
    },
    async setNX(key, value, ttlSec) {
      const res = await r.set(key, value, { nx: true, ex: ttlSec });
      return res === "OK";
    },
    async incr(key, ttlSec) {
      const n = await r.incr(key);
      if (n === 1) await r.expire(key, ttlSec);
      return n;
    },
    async del(key) {
      await r.del(key);
    },
  };
}

type MemEntry = { v: string; exp: number };
const g = globalThis as unknown as { __bdMem?: Map<string, MemEntry> };
function memoryKV(): KV {
  const m = (g.__bdMem ??= new Map());
  const alive = (k: string) => {
    const e = m.get(k);
    if (!e) return undefined;
    if (e.exp && e.exp < Date.now()) {
      m.delete(k);
      return undefined;
    }
    return e;
  };
  return {
    kind: "memory",
    async get<T>(key: string) {
      const e = alive(key);
      return e ? (JSON.parse(e.v) as T) : null;
    },
    async set(key, value, ttlSec) {
      m.set(key, { v: JSON.stringify(value), exp: ttlSec ? Date.now() + ttlSec * 1000 : 0 });
    },
    async setNX(key, value, ttlSec) {
      if (alive(key)) return false;
      m.set(key, { v: JSON.stringify(value), exp: Date.now() + ttlSec * 1000 });
      return true;
    },
    async incr(key, ttlSec) {
      const e = alive(key);
      const n = (e ? Number(JSON.parse(e.v)) : 0) + 1;
      m.set(key, { v: JSON.stringify(n), exp: e?.exp || Date.now() + ttlSec * 1000 });
      return n;
    },
    async del(key) {
      m.delete(key);
    },
  };
}

let kv: KV | null = null;
export function store(): KV {
  if (!kv) kv = redisConfigured() ? redisKV() : memoryKV();
  return kv;
}
