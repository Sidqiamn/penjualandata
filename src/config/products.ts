/* =====================================================================
   DAFTAR PRODUK (contoh — sesuaikan nama, harga, dan isinya).
   File ini ikut terkirim ke browser, jadi JANGAN taruh link Google Drive di sini.
   Link produk diatur di src/config/delivery.ts
   ===================================================================== */

export type PreviewKind = "formula" | "dashboard" | "sql" | "prompt" | "powerbi" | "video" | "bundle";

export type Product = {
  id: string;
  category: string;
  preview: PreviewKind;
  /** catatan tulisan tangan di pojok kartu, "" = tanpa catatan */
  tag: string;
  title: string;
  desc: string;
  longDesc: string;
  /** harga jual (Rupiah) */
  price: number;
  /** harga coret, 0 = tanpa diskon */
  oldPrice: number;
  format: string;
  includes: string[];
};

export type Bundle = Omit<Product, "oldPrice" | "includes" | "preview"> & {
  /** id produk yang termasuk dalam paket */
  items: string[];
};

export const products: Product[] = [
  {
    id: "cheatsheet-excel",
    category: "Excel",
    preview: "formula",
    tag: "paling sering dibeli",
    title: "Cheat Sheet Rumus Excel untuk Analis",
    desc: "120 rumus yang paling kepakai di kerjaan, lengkap dengan contoh kasus.",
    longDesc:
      "Dari XLOOKUP, FILTER, sampai LET dan LAMBDA. Setiap rumus ada contoh data dan kapan sebaiknya dipakai, jadi tidak cuma hafal sintaks.",
    price: 29000,
    oldPrice: 49000,
    format: "PDF · 24 halaman",
    includes: [
      "120 rumus dikelompokkan per kebutuhan",
      "Contoh kasus untuk tiap rumus",
      "Versi alternatif untuk Excel lama (VLOOKUP, INDEX-MATCH)",
      "File latihan .xlsx",
    ],
  },
  {
    id: "dashboard-excel",
    category: "Excel",
    preview: "dashboard",
    tag: "",
    title: "Template Dashboard Penjualan",
    desc: "Dashboard Excel dengan slicer dan pivot. Tempel data, grafik langsung jalan.",
    longDesc:
      "Cocok untuk laporan mingguan atau bulanan. Cukup tempel data transaksi ke sheet Data, dan KPI, grafik tren, serta ranking produk otomatis terbarui.",
    price: 59000,
    oldPrice: 99000,
    format: ".xlsx · Excel 2019+",
    includes: [
      "File dashboard siap pakai",
      "Sheet panduan langkah demi langkah",
      "Contoh data 6 bulan",
      "Video cara ganti data (8 menit)",
    ],
  },
  {
    id: "latihan-sql",
    category: "SQL",
    preview: "sql",
    tag: "buat persiapan tes kerja",
    title: "60 Soal Latihan SQL Studi Kasus",
    desc: "Latihan dari SELECT dasar sampai window function, pakai dataset e-commerce.",
    longDesc:
      "Soal disusun bertingkat seperti tes teknis rekrutmen data analyst. Dataset bisa dijalankan di MySQL, PostgreSQL, atau BigQuery.",
    price: 49000,
    oldPrice: 79000,
    format: "PDF + dataset .sql",
    includes: [
      "60 soal bertingkat (mudah sampai sulit)",
      "Kunci jawaban dengan penjelasan",
      "Dataset e-commerce siap impor",
      "Catatan JOIN dan window function",
    ],
  },
  {
    id: "prompt-ai",
    category: "AI",
    preview: "prompt",
    tag: "",
    title: "Prompt AI untuk Data Analyst",
    desc: "150 prompt ChatGPT dan Gemini untuk cleaning, analisis, dan bikin laporan.",
    longDesc:
      "Prompt siap salin untuk pekerjaan harian analis: merapikan data, menulis query, menjelaskan hasil analisis ke atasan, sampai menyusun insight dari grafik.",
    price: 39000,
    oldPrice: 0,
    format: "PDF + Notion",
    includes: [
      "150 prompt per kategori pekerjaan",
      "Contoh input dan hasil",
      "Tips supaya jawaban AI tidak ngarang",
      "Update prompt baru gratis",
    ],
  },
  {
    id: "template-powerbi",
    category: "Power BI",
    preview: "powerbi",
    tag: "",
    title: "Template Power BI: KPI Bisnis",
    desc: "Report 4 halaman: ringkasan, tren, produk, dan wilayah. Tinggal sambungkan data.",
    longDesc:
      "Template .pbix dengan model data dan measure DAX yang sudah rapi. Bisa jadi bahan portofolio atau langsung dipakai untuk laporan kantor.",
    price: 79000,
    oldPrice: 129000,
    format: ".pbix · Power BI Desktop",
    includes: [
      "File .pbix 4 halaman",
      "25 measure DAX dengan penjelasan",
      "Panduan sambungkan ke Excel/CSV",
      "Contoh data untuk latihan",
    ],
  },
  {
    id: "kelas-da",
    category: "Kelas",
    preview: "video",
    tag: "buat yang mulai dari nol",
    title: "Kelas Data Analyst dari Nol",
    desc: "18 video dari Excel, SQL, sampai visualisasi, plus grup diskusi.",
    longDesc:
      "Alur belajar yang runtut untuk kamu yang ingin pindah karier atau mulai pegang data di kantor. Setiap modul ada tugas kecil supaya langsung praktik.",
    price: 199000,
    oldPrice: 349000,
    format: "Video online · akses selamanya",
    includes: [
      "18 video (total ± 6 jam)",
      "Tugas praktik setiap modul",
      "Grup diskusi WhatsApp",
      "Template portofolio sederhana",
    ],
  },
];

/** Paket bundling — harga satuan & hemat dihitung otomatis dari items. Isi null kalau tidak ada paket. */
export const bundle: Bundle | null = {
  id: "paket-starter",
  category: "Paket",
  tag: "paling hemat buat mulai",
  title: "Paket Starter Data Analyst",
  desc: "Tiga materi dasar yang paling sering dicari, sekali bayar.",
  longDesc:
    "Gabungan cheat sheet Excel, latihan SQL, dan prompt AI. Urutan belajarnya sudah disarankan di dalam paket.",
  items: ["cheatsheet-excel", "latihan-sql", "prompt-ai"],
  price: 89000,
  format: "3 produk · dikirim sekaligus",
};
