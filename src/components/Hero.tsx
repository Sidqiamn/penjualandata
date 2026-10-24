"use client";

import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { site, waLink } from "@/config/site";
import { Icon } from "./Icon";
import { LiveSheet } from "./LiveSheet";
import { EASE } from "./motion-kit";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function ColHead({ progress }: { progress: MotionValue<number> }) {
  const [active, setActive] = useState(-1);
  useMotionValueEvent(progress, "change", (v) => setActive(v < 0.02 ? -1 : Math.min(LETTERS.length - 1, Math.floor(v * 14))));
  return (
    <div className="colhead" aria-hidden="true">
      {LETTERS.map((l, i) => (
        <span key={l} className={i === active ? "on" : undefined}>
          {l}
        </span>
      ))}
    </div>
  );
}

function AdminStatus() {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => {
    const run = () => {
      let h = 12;
      try {
        h = parseInt(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Jakarta" }).format(new Date()), 10);
      } catch {}
      setOn(h >= site.adminHours.open && h < site.adminHours.close);
    };
    run();
    const t = setInterval(run, 60_000);
    return () => clearInterval(t);
  }, []);
  const { open, close } = site.adminHours;
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    <span className={`status${on ? " on" : ""}`}>
      <i />
      {on === null ? `Admin ${p(open)}.00–${p(close)}.00 WIB` : on ? `Admin online · ${p(open)}.00–${p(close)}.00 WIB` : `Admin offline · dibalas mulai ${p(open)}.00 WIB`}
    </span>
  );
}

const rise = (i: number) => ({
  initial: { y: "105%" },
  animate: { y: "0%" },
  transition: { duration: 0.9, ease: EASE, delay: 0.12 + i * 0.1 },
});
const fade = (d: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: EASE, delay: d },
});

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Parallax: teks naik lebih cepat, lembar Excel turun & miring sedikit saat discroll
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.25]);
  const sheetY = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const sheetRot = useTransform(scrollYProgress, [0, 1], [0, 12]);
  const sheetScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);

  return (
    <section className="hero" id="top" ref={ref}>
      <ColHead progress={scrollYProgress} />
      <div className="hero-bg" aria-hidden="true" />
      <div className="wrap hero-in">
        <motion.div style={{ y: copyY, opacity: copyOpacity }}>
          <motion.div className="profile" {...fade(0)}>
            <img src="/logo.png" alt="Logo BluData" width={48} height={48} />
            <div className="pf-txt">
              <b>
                {site.name} <em>· {site.tagline}</em>
              </b>
              <div className="pf-meta">
                <a className="link" href={site.tiktok} target="_blank" rel="noopener">
                  <Icon name="note" />
                  {site.handle}
                </a>
                <AdminStatus />
              </div>
            </div>
          </motion.div>

          <h1>
            <span className="ln">
              <motion.span {...rise(0)}>Berhenti bingung sama data.</motion.span>
            </span>
            <span className="ln">
              <motion.span {...rise(1)}>
                Mulai <span className="hl">naik kelas</span> di kantor,
              </motion.span>
            </span>
            <span className="ln">
              <motion.span {...rise(2)}>
                dengan dashboard yang <span className="hl">dipuji atasan.</span>
              </motion.span>
            </span>
          </h1>

          <motion.p className="lead" {...fade(0.45)}>
            {site.heroLead}
          </motion.p>

          <motion.div className="cta-row" {...fade(0.55)}>
            <a className="btn btn-primary lg" href="#produk">
              Beli sekarang <Icon name="arrow" className="ic-arrow" />
            </a>
            <a className="btn btn-line lg" href={waLink(`Halo ${site.name}, saya mau tanya soal produknya.`)} target="_blank" rel="noopener">
              <Icon name="chat" />
              Tanya via WhatsApp
            </a>
          </motion.div>

          <motion.dl className="facts" {...fade(0.65)}>
            <div>
              <dt>Topik</dt>
              <dd>Excel · SQL · Power BI · AI</dd>
            </div>
            <div>
              <dt>Pengiriman</dt>
              <dd>Otomatis ke email</dd>
            </div>
            <div>
              <dt>Bayar</dt>
              <dd>QRIS · VA BCA · VA BNI</dd>
            </div>
          </motion.dl>
        </motion.div>

        <motion.div className="demo-col" style={{ y: sheetY, rotateX: sheetRot, scale: sheetScale }}>
          <motion.div initial={{ opacity: 0, y: 30, rotateX: 8 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 1.1, ease: EASE, delay: 0.3 }}>
            <LiveSheet />
          </motion.div>
          <motion.p className="demo-hint" {...fade(1.2)}>
            Klik sel mana saja untuk melihat rumusnya.
          </motion.p>
          <motion.p className="demo-note hand" initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }} animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }} transition={{ duration: 1.2, ease: EASE, delay: 1.6 }}>
            rumus kayak gini dibahas
            <br />
            lengkap di cheat sheet
            <svg viewBox="0 0 50 50" aria-hidden="true">
              <motion.path d="M8 6c14 2 26 12 28 34" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 2.2 }} />
              <motion.path d="M28 34l8 8 6-10" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 2.9 }} />
            </svg>
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}