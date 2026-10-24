import { NextResponse } from "next/server";
import { env, redisConfigured, smtpConfigured } from "@/lib/server/env";

export const dynamic = "force-dynamic";

/** Cek cepat konfigurasi (tanpa menampilkan rahasia): buka /api/health */
export async function GET() {
  return NextResponse.json({
    siteUrl: env.siteUrl,
    payment: {
      provider: env.provider,
      integration: env.provider === "midtrans" ? env.midtrans.integration : null,
      mode: env.provider === "midtrans" ? (env.midtrans.isProduction ? "production" : "sandbox") : "demo",
      serverKey: Boolean(env.midtrans.serverKey),
      clientKey: Boolean(env.midtrans.clientKey),
    },
    database: redisConfigured() ? "upstash-redis" : "memory (hanya untuk uji coba lokal)",
    email: smtpConfigured() ? `smtp ${env.smtp.host}:${env.smtp.port}` : "belum diatur",
  });
}
