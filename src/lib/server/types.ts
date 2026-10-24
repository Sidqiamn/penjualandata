import "server-only";
import type { PaymentMethodId } from "@/config/site";
import type { OrderItem, OrderStatus, PaymentInfo } from "@/lib/api-types";

export type Order = {
  id: string;
  token: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  amount: number;
  method: PaymentMethodId;
  items: OrderItem[];
  buyer: { name: string; email: string; whatsapp?: string };
  provider: "midtrans" | "demo";
  payment: PaymentInfo;
  paidAt?: string;
  paidVia?: "webhook" | "status-check" | "simulation";
  email: { status: "pending" | "sent" | "failed" | "skipped"; attempts: number; lastAttemptAt?: string; error?: string };
  lastCheckedAt?: number;
};

export type ProviderStatus = { status: OrderStatus; grossAmount?: number; raw?: unknown };
