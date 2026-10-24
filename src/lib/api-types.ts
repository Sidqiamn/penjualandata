import type { PaymentMethodId } from "@/config/site";

export type OrderStatus = "pending" | "paid" | "expired" | "failed";

export type PaymentInfo =
  | { kind: "qris"; provider: "midtrans" | "demo"; qrSvg: string; qrUrl?: string; expiresAt: string }
  | { kind: "va"; provider: "midtrans" | "demo"; bank: "BCA" | "BNI"; vaNumber: string; expiresAt: string }
  | {
      kind: "snap";
      provider: "midtrans";
      token: string;
      redirectUrl: string;
      scriptUrl: string;
      clientKey: string;
      expiresAt: string;
    };

export type OrderItem = { id: string; title: string; category: string; price: number };

export type PublicOrder = {
  id: string;
  token: string;
  status: OrderStatus;
  amount: number;
  method: PaymentMethodId;
  items: OrderItem[];
  buyer: { name: string; email: string };
  createdAt: string;
  paidAt?: string;
  payment: PaymentInfo;
  email: { status: "pending" | "sent" | "failed" | "skipped" };
  deliveries?: { id: string; title: string; links: { label: string; url: string }[]; attachments: string[] }[];
  demo: boolean;
  sandbox: boolean;
};

export type CreateOrderBody = {
  items: string[];
  method: PaymentMethodId;
  buyer: { name: string; email: string; whatsapp?: string };
};

export type ApiError = { error: string };
