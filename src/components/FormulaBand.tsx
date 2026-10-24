"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

type Chip = { kind: "excel" | "sql" | "dax" | "ai"; label: string; code: string };
const ROW1: Chip[] = [
  { kind: "excel", label: "Excel", code: "=XLOOKUP(B8;A2:A5;B2:B5)" },
  { kind: "sql", label: "SQL", code: "SELECT kota, SUM(total)" },
  { kind: "excel", label: "Excel", code: '=SUMIFS(Omzet;Kota;"Jakarta")' },
  { kind: "dax", label: "DAX", code: "CALCULATE([Omzet]; YTD)" },
  { kind: "excel", label: "Excel", code: '=FILTER(Data;Status="Lunas")' },
  { kind: "sql", label: "SQL", code: "LEFT JOIN customers c" },
  { kind: "ai", label: "AI", code: "rangkum insight dari tabel ini" },
];
const ROW2: Chip[] = [
  { kind: "sql", label: "SQL", code: "ROW_NUMBER() OVER (PARTITION BY)" },
  { kind: "excel", label: "Excel", code: "=UNIQUE(A2:A500)" },
  { kind: "dax", label: "DAX", code: "DIVIDE([Profit]; [Omzet])" },
  { kind: "excel", label: "Excel", code: '=LET(x; B2*C2; IF(x>0; x; ""))' },
  { kind: "ai", label: "AI", code: "tulis query untuk churn bulanan" },
  { kind: "sql", label: "SQL", code: "GROUP BY bulan ORDER BY 2 DESC" },
  { kind: "excel", label: "Excel", code: "=PIVOTBY(Kota;Bulan;Omzet;SUM)" },
];

function Row({ chips }: { chips: Chip[] }) {
  const all = [...chips, ...chips, ...chips];
  return (
    <>
      {all.map((c, i) => {
        const fn = c.code.match(/^=?[A-Z_]{2,}(?=\()|^SELECT|^LEFT JOIN|^GROUP BY|^ROW_NUMBER\(\)|^CALCULATE|^DIVIDE/);
        const head = fn ? fn[0] : "";
        return (
          <span key={i} className={`chipf ${c.kind}`}>
            <em>{c.label}</em>
            <span>
              {head && <b>{head}</b>}
              {c.code.slice(head.length)}
            </span>
          </span>
        );
      })}
    </>
  );
}

/** Dua baris rumus yang bergeser berlawanan arah mengikuti scroll */
export function FormulaBand() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x1 = useTransform(scrollYProgress, [0, 1], ["-4%", "-38%"]);
  const x2 = useTransform(scrollYProgress, [0, 1], ["-38%", "-4%"]);
  return (
    <div className="band" ref={ref} aria-hidden="true">
      <motion.div className="band-row" style={{ x: x1 }}>
        <Row chips={ROW1} />
      </motion.div>
      <motion.div className="band-row" style={{ x: x2 }}>
        <Row chips={ROW2} />
      </motion.div>
    </div>
  );
}
