# BluData Store — Next.js + pembayaran & pengiriman otomatis

Toko produk digital BluData: animasi scroll (Motion + Lenis), pembayaran **QRIS, Virtual Account BCA, dan Virtual Account BNI** lewat Midtrans, lalu produk **langsung terbuka di layar dan dikirim ke email** tanpa konfirmasi manual.

## Cara kerjanya

```
Pembeli checkout ──► /api/orders          harga dihitung ulang di server, pesanan disimpan (Upstash Redis)
                 ──► Midtrans             membuat QRIS / nomor VA
Pembeli bayar    ──► Midtrans kirim notifikasi ──► /api/payments/midtrans
                                              cek signature + nominal + status → LUNAS
                                              kirim email: rincian pembelian + link Google Drive (+ PDF terlampir)
Halaman checkout cek status tiap 3 detik ──► begitu lunas, link Google Drive langsung tampil
```

Kalau notifikasi Midtrans terlambat atau belum diatur, website juga menanyakan status langsung ke Midtrans, jadi pesanan tetap terdeteksi lunas.

---

## 1. Coba di komputer (mode demo)

Butuh Node.js 20 atau lebih baru.

```bash
npm install
npm run dev
```

Buka http://localhost:3000. Tanpa pengaturan apa pun website berjalan dalam **mode demo**: checkout menampilkan QR/VA contoh dan tombol **Simulasikan pembayaran berhasil**. Pratinjau email tersimpan di folder `.emails/`.

## 2. Ganti isi toko

| File | Isi |
|---|---|
| `src/config/site.ts` | Nama toko, nomor WhatsApp admin, jam admin, teks, FAQ |
| `src/config/products.ts` | Daftar produk, harga, harga coret, paket bundling |
| `src/config/delivery.ts` | **Link Google Drive** tiap produk + lampiran PDF (opsional) |
| `private/files/` | File PDF kecil yang ikut dilampirkan di email |
| `public/logo.png` | Logo |

Link Google Drive hanya dibaca server dan baru dikirim ke pembeli setelah lunas. **Buat repository GitHub sebagai Private** supaya link di `delivery.ts` tidak terlihat orang lain.

## 3. Siapkan tiga layanan

### a. Midtrans (pembayaran)
1. Daftar di midtrans.com. Akun perorangan butuh KTP dan NPWP.
2. Di dashboard **Sandbox**: Settings → Access Keys → salin *Server Key* dan *Client Key*.
3. Settings → Payment → Notification URL, isi: `https://DOMAIN-KAMU/api/payments/midtrans`
4. Pastikan QRIS, BCA VA, dan BNI VA aktif di akunmu. Metode yang tersedia bisa berbeda antara akun perorangan dan badan usaha, jadi cek di dashboard saat pendaftaran.

`MIDTRANS_INTEGRATION=snap` (bawaan) memakai halaman bayar Midtrans yang muncul di atas website; ini langsung bisa dipakai. `core` menampilkan QR dan nomor VA langsung di desain website, tetapi untuk production perlu minta aktivasi Core API ke Midtrans.

### b. Upstash Redis (database pesanan)
Di Vercel: Project → Storage / Marketplace → **Upstash for Redis** → buat database → Connect ke project. Variabel `KV_REST_API_URL` dan `KV_REST_API_TOKEN` terisi otomatis. Paket gratisnya cukup untuk toko kecil.

### c. Email otomatis (SMTP)
Cara termudah pakai Gmail:
1. Aktifkan verifikasi 2 langkah di akun Google.
2. Buka myaccount.google.com/apppasswords → buat App password.
3. Isi `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER=emailkamu@gmail.com`, `SMTP_PASS=<app password>`.

Gmail punya batas kirim harian. Kalau nanti punya domain sendiri (misalnya bludata.id), bisa pindah ke SMTP Brevo atau Resend cukup dengan mengganti 4 variabel itu.

## 4. Deploy ke Vercel
1. Upload proyek ini ke GitHub (repository **Private**). Jangan upload folder `node_modules` dan `.next`.
2. vercel.com → Add New → Project → pilih repository → **Deploy**.
3. Project → Settings → Environment Variables → isi sesuai `.env.example` → Redeploy.
4. Buka `https://DOMAIN-KAMU/api/health` untuk memastikan pembayaran, database, dan email sudah terbaca.

> **Penting soal paket Vercel:** paket Hobby (gratis) hanya untuk pemakaian pribadi non-komersial. Website yang menerima pembayaran termasuk komersial, jadi untuk toko ini perlu paket **Pro**. Lihat Fair Use Guidelines Vercel.

## 5. Uji dengan sandbox
1. Set `PAYMENT_PROVIDER=midtrans`, `MIDTRANS_IS_PRODUCTION=false`, isi key sandbox, Redeploy.
2. Beli satu produk di websitemu.
3. Bayar di simulator: https://simulator.sandbox.midtrans.com (pilih QRIS atau VA, masukkan nomor/QR dari halaman pembayaran).
4. Halaman checkout otomatis berubah ke **Pembayaran berhasil**, link Google Drive tampil, dan email masuk.

## 6. Mulai jualan sungguhan
Ganti ke key **Production** di dashboard Midtrans, set `MIDTRANS_IS_PRODUCTION=true`, isi Notification URL production, lalu Redeploy.

---

## Struktur

```
src/app/page.tsx                    halaman toko
src/app/pesanan/[id]/page.tsx       halaman pesanan (link dari email)
src/app/api/orders                  buat pesanan & cek status
src/app/api/payments/midtrans       notifikasi pembayaran dari Midtrans
src/lib/server/                     pembayaran, database, email, pengiriman
src/components/                     tampilan & animasi
```

## Keamanan yang sudah ditangani
- Harga dihitung ulang di server; harga dari browser tidak dipakai.
- Notifikasi Midtrans dicek signature SHA512 + nominal, lalu dikonfirmasi ulang ke API status.
- Notifikasi ganda tidak mengirim email dua kali.
- Halaman pesanan dan link produk hanya terbuka dengan token rahasia di link.
- Pembatasan percobaan pembuatan pesanan per IP.
