/* =====================================================================
   PENGATURAN TOKO — identitas, kontak, dan metode pembayaran.
   Data produk ada di src/config/products.ts
   Link Google Drive / file produk ada di src/config/delivery.ts (rahasia, hanya di server)
   ===================================================================== */

export const site = {
  name: "BluData",
  tagline: "Bicara Data & AI",
  handle: "@bludata09",
  tiktok: "https://www.tiktok.com/@bludata09",
  /** GANTI: nomor WhatsApp admin, format 62..., tanpa + / spasi / strip */
  whatsapp: "6282319830019",
  /** Jam admin online (WIB) — hanya untuk status di halaman */
  adminHours: { open: 8, close: 21 },
  description:
    "Cheat sheet, template, dan kelas singkat soal Excel, SQL, Power BI, dan AI dari BluData (@bludata09). Bayar pakai QRIS, VA BCA, atau VA BNI, produk langsung dikirim ke email.",
  heroLead:
    "Cheat sheet, template, dan kelas singkat soal Excel, SQL, Power BI, dan AI. Isinya versi lengkap dari materi yang dibahas di TikTok, disusun supaya langsung kepakai buat kerja.",
};

export type PaymentMethodId = "qris" | "bca" | "bni";

export const paymentMethods: {
  id: PaymentMethodId;
  label: string;
  sub: string;
  badge: string;
}[] = [
  { id: "qris", label: "QRIS", sub: "Scan dari GoPay, OVO, DANA, ShopeePay, atau m-banking", badge: "QRIS" },
  { id: "bca", label: "Virtual Account BCA", sub: "Bayar dari BCA mobile, KlikBCA, atau ATM BCA", badge: "BCA" },
  { id: "bni", label: "Virtual Account BNI", sub: "Bayar dari BNI Mobile, ATM, atau transfer bank lain", badge: "BNI" },
];

/** Batas waktu pembayaran (menit) */
export const paymentExpiry = { qris: 30, va: 24 * 60 };

export const faq: { q: string; a: string }[] = [
  {
    q: "Setelah bayar, produknya dikirim ke mana?",
    a: "Begitu pembayaran terkonfirmasi otomatis, halaman ini langsung menampilkan link produk, dan email berisi rincian pembelian serta link (dan file PDF bila ada) dikirim ke alamat email yang kamu isi.",
  },
  {
    q: "Perlu konfirmasi atau kirim bukti transfer?",
    a: "Tidak perlu. QRIS dan Virtual Account terverifikasi otomatis oleh sistem pembayaran, biasanya dalam hitungan detik setelah kamu bayar.",
  },
  {
    q: "Email belum masuk, bagaimana?",
    a: "Cek folder Spam atau Promosi dulu. Link produk juga selalu bisa dibuka lagi dari halaman pesanan. Kalau tetap tidak ada, chat admin dengan menyebutkan nomor pesanan.",
  },
  {
    q: "Saya pemula, sebaiknya mulai dari mana?",
    a: "Mulai dari Cheat Sheet Excel atau Paket Starter. Kalau masih ragu, chat admin dan ceritakan pekerjaanmu, nanti dibantu pilih.",
  },
  {
    q: "Template Excel bisa dibuka di versi lama?",
    a: "Sebagian rumus seperti XLOOKUP dan FILTER butuh Excel 2021 atau Microsoft 365. Untuk Excel lama, cheat sheet menyertakan rumus alternatifnya.",
  },
  {
    q: "Bisa bayar pakai apa saja?",
    a: "QRIS (dari GoPay, OVO, DANA, ShopeePay, atau m-banking mana pun), Virtual Account BCA, dan Virtual Account BNI.",
  },
];

export const waLink = (text?: string) =>
  `https://wa.me/${site.whatsapp.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
