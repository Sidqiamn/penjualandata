import "server-only";

/* =====================================================================
   PENGIRIMAN PRODUK — RAHASIA, hanya dibaca server.
   Isi link Google Drive untuk setiap produk (id harus sama dengan products.ts).

   Tips Google Drive: klik kanan file/folder → Bagikan → "Siapa saja yang memiliki link"
   → Pelihat. Tempel linknya di bawah.

   attachments (opsional): file kecil (misalnya PDF) yang ikut dilampirkan di email.
   Simpan filenya di folder  private/files/  lalu tulis nama filenya di sini.
   Total lampiran per email dibatasi 15 MB; selebihnya cukup lewat link.

   Paket bundling otomatis mengirim semua link dari produk di dalamnya.
   ===================================================================== */

export type DeliveryLink = { label: string; url: string };
export type Delivery = {
  links: DeliveryLink[];
  attachments?: { filename: string; file: string }[];
};

export const delivery: Record<string, Delivery> = {
  "cheatsheet-excel": {
    links: [{ label: "Buka di Google Drive", url: "https://drive.google.com/drive/folders/GANTI-LINK-CHEATSHEET" }],
    // attachments: [{ filename: "Cheat-Sheet-Excel-BluData.pdf", file: "cheatsheet-excel.pdf" }],
  },
  "dashboard-excel": {
    links: [{ label: "Buka di Google Drive", url: "https://drive.google.com/drive/folders/GANTI-LINK-DASHBOARD" }],
  },
  "latihan-sql": {
    links: [{ label: "Buka di Google Drive", url: "https://drive.google.com/drive/folders/GANTI-LINK-SQL" }],
  },
  "prompt-ai": {
    links: [
      { label: "Buka di Google Drive", url: "https://drive.google.com/drive/folders/GANTI-LINK-PROMPT" },
      { label: "Duplikat template Notion", url: "https://www.notion.so/GANTI-LINK-NOTION" },
    ],
  },
  "template-powerbi": {
    links: [{ label: "Buka di Google Drive", url: "https://drive.google.com/drive/folders/GANTI-LINK-POWERBI" }],
  },
  "kelas-da": {
    links: [
      { label: "Buka materi video (Google Drive)", url: "https://drive.google.com/drive/folders/GANTI-LINK-KELAS" },
      { label: "Gabung grup diskusi WhatsApp", url: "https://chat.whatsapp.com/GANTI-LINK-GRUP" },
    ],
  },
};
