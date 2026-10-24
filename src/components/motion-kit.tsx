"use client";

import { animate, motion, useInView, type Variants } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { num } from "@/lib/format";
import { Icon, type IconName } from "./Icon";

export const EASE = [0.2, 0.8, 0.2, 1] as const;

/** Muncul dari bawah saat discroll ke layar */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 26,
  as = "div",
  amount = 0.25,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "p" | "section" | "li";
  amount?: number;
}) {
  const M = motion[as];
  return (
    <M
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </M>
  );
}

const wordParent: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.045 } } };
const wordChild: Variants = {
  hidden: { y: "110%" },
  show: { y: "0%", transition: { duration: 0.75, ease: EASE } },
};

/** Judul yang muncul kata per kata */
export function SplitWords({ text, className, as = "h2" }: { text: string; className?: string; as?: "h2" | "h3" }) {
  const M = motion[as];
  const words = text.split(" ");
  return (
    <M className={className} variants={wordParent} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.6 }} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden="true">
          <span className="w">
            <motion.span variants={wordChild}>{w}</motion.span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </M>
  );
}

/** Garis tab seperti sheet Excel — garisnya tergambar saat discroll */
export function TabLine({ icon, label }: { icon: IconName; label: string }) {
  return (
    <div className="tabline">
      <motion.span
        className="rule"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 1 }}
        transition={{ duration: 1.1, ease: EASE }}
      />
      <motion.span
        className="tab"
        initial={{ y: 14, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 1 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
      >
        <Icon name={icon} />
        {label}
      </motion.span>
    </div>
  );
}

export function SectionHead({ icon, tab, title, sub }: { icon: IconName; tab: string; title: string; sub?: ReactNode }) {
  return (
    <>
      <TabLine icon={icon} label={tab} />
      <SplitWords className="sec-title" text={title} />
      {sub ? (
        <Reveal as="p" className="sec-sub" delay={0.2} y={14}>
          {sub}
        </Reveal>
      ) : null}
    </>
  );
}

/** Bingkai "sel terpilih" yang tergambar mengelilingi elemen */
export function DrawFrame({ radius = 9, delay = 0 }: { radius?: number; delay?: number }) {
  return (
    <svg className="frame" aria-hidden="true">
      <motion.rect
        x="1"
        y="1"
        rx={radius}
        style={{ width: "calc(100% - 2px)", height: "calc(100% - 2px)" }}
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1.4, ease: EASE, delay }}
      />
    </svg>
  );
}

/** Angka yang menghitung naik saat terlihat */
export function Ticker({ value, prefix = "", className }: { value: number; prefix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 1 });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const el = ref.current;
    const c = animate(0, value, {
      duration: 1.2,
      ease: EASE,
      onUpdate: (v) => (el.textContent = prefix + num(Math.round(v / 100) * 100)),
      onComplete: () => (el.textContent = prefix + num(value)),
    });
    return () => c.stop();
  }, [inView, value, prefix]);
  return (
    <span ref={ref} className={className}>
      {prefix + num(value)}
    </span>
  );
}
