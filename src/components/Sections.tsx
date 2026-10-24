"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { faq, site, waLink } from "@/config/site";
import { Icon } from "./Icon";
import { DrawFrame, EASE, Reveal, SectionHead } from "./motion-kit";

const STEPS: { name: string; desc: string; chips?: string[] }[] = [
  { name: "Pilih produk", desc: "Masukkan ke keranjang. Bisa beberapa produk sekaligus, cukup bayar sekali." },
  { name: "Isi nama & email", desc: "Email dipakai untuk mengirim rincian pembelian dan link produk. Tidak perlu bikin akun." },
  { name: "Bayar", desc: "Scan QRIS atau transfer ke nomor Virtual Account yang muncul.", chips: ["QRIS", "VA BCA", "VA BNI"] },
  { name: "Produk langsung terbuka", desc: "Pembayaran terdeteksi otomatis. Link Google Drive langsung tampil di layar dan dikirim ke email kamu." },
];

export function HowToBuy() {
  const ref = useRef<HTMLTableSectionElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [active, setActive] = useState(-1);
  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const t = setInterval(() => {
      setActive(i);
      if (++i >= STEPS.length) clearInterval(t);
    }, 650);
    return () => clearInterval(t);
  }, [inView]);
  return (
    <section className="section" id="cara" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <SectionHead icon="table" tab="Cara beli" title="Bayar, lalu produknya langsung terbuka." sub="Tidak perlu kirim bukti transfer atau menunggu admin. Sistem mengecek pembayaran otomatis." />
        <Reveal className="table-scroll" delay={0.1} y={20}>
          <table className="steps-t" style={{ marginTop: 0 }}>
            <thead>
              <tr>
                <th>No</th>
                <th>Langkah</th>
                <th>Yang terjadi</th>
              </tr>
            </thead>
            <tbody ref={ref}>
              {STEPS.map((s, i) => (
                <motion.tr
                  key={s.name}
                  className={i === active ? "on" : undefined}
                  initial={{ opacity: 0, x: -18 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.55, ease: EASE, delay: i * 0.1 }}
                >
                  <td>{i + 1}</td>
                  <td>{s.name}</td>
                  <td>
                    {s.desc}
                    {s.chips && (
                      <div className="chips">
                        {s.chips.map((c) => (
                          <span key={c}>{c}</span>
                        ))}
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="section" id="faq" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="faq-wrap">
          <div>
            <SectionHead icon="chat" tab="FAQ" title="Sebelum beli, biasanya orang tanya ini." sub="Pertanyaanmu tidak ada di daftar? Chat saja, sama seperti balas komentar di TikTok." />
            <Reveal delay={0.25} y={12}>
              <a className="btn btn-wa" style={{ marginTop: 20 }} href={waLink(`Halo ${site.name}, saya mau tanya soal produknya.`)} target="_blank" rel="noopener">
                <Icon name="chat" />
                Chat admin
              </a>
            </Reveal>
          </div>
          <motion.div
            className="faq"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          >
            {faq.map((f, i) => {
              const isOpen = open === i;
              return (
                <motion.div
                  key={f.q}
                  className={`faq-item${isOpen ? " open" : ""}`}
                  variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}
                >
                  <button className="faq-q" type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                    <span className="rn">{i + 1}</span>
                    <span className="q">{f.q}</span>
                    <Icon name="chev" className="chev" />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        className="faq-a"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: EASE }}
                      >
                        <div className="faq-a-in">
                          <p>{f.a}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function CtaCell() {
  return (
    <section className="section" style={{ paddingTop: 24 }}>
      <div className="wrap">
        <motion.div className="cta-cell" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.8, ease: EASE }}>
          <DrawFrame radius={3} delay={0.2} />
          <motion.span className="ref-tag" initial={{ y: 10, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.9, duration: 0.4 }}>
            A1
          </motion.span>
          <motion.span className="fh" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 1.4, type: "spring", stiffness: 400, damping: 16 }} />
          <div>
            <h2>Belum yakin mulai dari mana?</h2>
            <p>Ceritakan pekerjaanmu dan tools yang dipakai di kantor. Admin bantu pilihkan materi yang paling kepakai, jadi tidak beli yang tidak perlu.</p>
          </div>
          <div className="cta-act">
            <a className="btn btn-primary lg" href={waLink(`Halo ${site.name}, saya mau minta rekomendasi materi.\nPekerjaan saya: \nTools yang dipakai di kantor: `)} target="_blank" rel="noopener">
              <Icon name="chat" />
              Minta rekomendasi
            </a>
            <motion.span
              className="hand"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              whileInView={{ clipPath: "inset(0 0% 0 0)" }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 1.1, ease: EASE }}
            >
              tanya dulu juga boleh kok
            </motion.span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <Reveal className="wrap footer-in" y={12} amount={0.5}>
        <div className="f-brand">
          <img src="/logo.png" alt="" width={36} height={36} />
          <div>
            <b>{site.name}</b>
            <span>© {new Date().getFullYear()} · Belajar bareng soal data &amp; AI</span>
          </div>
        </div>
        <div className="f-links">
          <a href={site.tiktok} target="_blank" rel="noopener">TikTok</a>
          <a href={waLink()} target="_blank" rel="noopener">WhatsApp</a>
          <a href="/#faq">FAQ</a>
        </div>
        <div className="pay-tags" aria-label="Metode pembayaran">
          <span>QRIS</span>
          <span>VA BCA</span>
          <span>VA BNI</span>
        </div>
      </Reveal>
    </footer>
  );
}
