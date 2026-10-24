import "server-only";

const clean = (v?: string) => (v ?? "").trim();

function siteUrl() {
  const explicit = clean(process.env.NEXT_PUBLIC_SITE_URL);
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = clean(process.env.VERCEL_PROJECT_PRODUCTION_URL) || clean(process.env.VERCEL_URL);
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

const serverKey = clean(process.env.MIDTRANS_SERVER_KEY);
const providerRaw = clean(process.env.PAYMENT_PROVIDER).toLowerCase();

export const env = {
  siteUrl: siteUrl(),
  isProd: process.env.NODE_ENV === "production",
  provider: (providerRaw === "midtrans" || (!providerRaw && serverKey) ? "midtrans" : "demo") as "midtrans" | "demo",
  midtrans: {
    serverKey,
    clientKey: clean(process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY) || clean(process.env.MIDTRANS_CLIENT_KEY),
    isProduction: clean(process.env.MIDTRANS_IS_PRODUCTION) === "true",
    integration: (clean(process.env.MIDTRANS_INTEGRATION).toLowerCase() === "core" ? "core" : "snap") as "snap" | "core",
  },
  redis: {
    url: clean(process.env.UPSTASH_REDIS_REST_URL) || clean(process.env.KV_REST_API_URL),
    token: clean(process.env.UPSTASH_REDIS_REST_TOKEN) || clean(process.env.KV_REST_API_TOKEN),
  },
  smtp: {
    host: clean(process.env.SMTP_HOST),
    port: Number(clean(process.env.SMTP_PORT) || 465),
    user: clean(process.env.SMTP_USER),
    pass: clean(process.env.SMTP_PASS),
    from: clean(process.env.EMAIL_FROM),
    replyTo: clean(process.env.EMAIL_REPLY_TO),
  },
};

export const smtpConfigured = () => Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
export const redisConfigured = () => Boolean(env.redis.url && env.redis.token);
