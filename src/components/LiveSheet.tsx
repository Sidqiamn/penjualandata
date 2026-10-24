"use client";

import { useReducedMotion } from "motion/react";
import { memo, useEffect, useRef } from "react";

const MONTHS: [string, number, number][] = [
  ["Jul", 82, 75],
  ["Agu", 64, 75],
  ["Sep", 91, 80],
  ["Okt", 77, 80],
];
const COLS = "ABCD";
const NF = new Intl.NumberFormat("id-ID");
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const STEPS = [
  { r: "B6", f: "=SUM(B2:B5)", hold: 2200 },
  { r: "B2:B5", f: "82", hold: 2400 },
  { r: "D3", f: '=IF(B3>=C3;"Tercapai";"Belum")', hold: 2200 },
  { r: "C8", f: "=XLOOKUP(B8;A2:A5;B2:B5)", hold: 600, look: true },
  { r: "D6", f: '=IF(B6>=C6;"Tercapai";"Belum")', hold: 2200 },
];

/** Lembar Excel mini yang "hidup": sel terpilih berpindah, rumus diketik, XLOOKUP mencari bulan. */
export const LiveSheet = memo(function LiveSheet() {
  const root = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = root.current!;
    const $ = <T extends Element>(s: string) => el.querySelector(s) as T;
    const wrap = $<HTMLDivElement>(".grid-wrap");
    const table = $<HTMLTableElement>(".mini");
    const sel = $<HTMLDivElement>(".sel");
    const nameBox = $<HTMLSpanElement>(".namebox");
    const fxEl = $<HTMLSpanElement>(".formula");
    const stat = $<HTMLDivElement>(".stat");
    const chart = $<HTMLDivElement>(".chart");
    const refs = [1, 2, 3].map((i) => $<HTMLDivElement>(`.ref.c${i}`));
    const cell = (r: string) => table.querySelector<HTMLTableCellElement>(`[data-c="${r}"]`);
    const parse = (r: string) => {
      const m = /^([A-Z])(\d+)$/.exec(r)!;
      return { c: m[1], r: +m[2] };
    };
    const span = (range: string) => {
      const [a, b = a] = range.split(":");
      return [parse(a), parse(b)] as const;
    };
    const box = (range: string) => {
      const [a, b] = range.split(":");
      const ea = cell(a);
      const eb = cell(b || a);
      if (!ea || !eb) return null;
      const w = wrap.getBoundingClientRect();
      const ra = ea.getBoundingClientRect();
      const rb = eb.getBoundingClientRect();
      return {
        x: Math.min(ra.left, rb.left) - w.left,
        y: Math.min(ra.top, rb.top) - w.top,
        w: Math.max(ra.right, rb.right) - Math.min(ra.left, rb.left),
        h: Math.max(ra.bottom, rb.bottom) - Math.min(ra.top, rb.top),
      };
    };
    const put = (node: HTMLElement, range: string) => {
      const b = box(range);
      if (!b) return;
      node.style.transform = `translate(${b.x}px,${b.y}px)`;
      node.style.width = b.w + 1 + "px";
      node.style.height = b.h + 1 + "px";
    };
    const headers = (range: string) => {
      table.querySelectorAll(".hl").forEach((x) => x.classList.remove("hl"));
      const [a, b] = span(range);
      const c2 = range === "C8" ? "D" : b.c;
      for (let i = COLS.indexOf(a.c); i <= COLS.indexOf(c2); i++) table.querySelector(`th[data-col="${COLS[i]}"]`)?.classList.add("hl");
      for (let r = a.r; r <= b.r; r++) table.querySelector(`th[data-row="${r}"]`)?.classList.add("hl");
    };
    const refPat = /\b[A-D]\d(?::[A-D]\d)?\b/g;
    const hi = (src: string, order: string[]) => {
      const out: string[] = [];
      const re = /("[^"]*"?)|([A-Z]{2,}(?=\())|([A-D]\d(?::[A-D]\d)?)|([^"A-Z]+|[A-Z])/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) {
        if (m[1]) out.push(`<span class="str">${esc(m[1])}</span>`);
        else if (m[2]) out.push(`<span class="fn">${esc(m[2])}</span>`);
        else if (m[3]) {
          const k = order.indexOf(m[3]);
          out.push(`<span class="r${k >= 0 ? (k % 3) + 1 : 1}">${esc(m[3])}</span>`);
        } else out.push(esc(m[4]));
      }
      return out.join("");
    };
    const statFor = (range: string) => {
      const [a, b] = span(range);
      const vals: number[] = [];
      for (let r = a.r; r <= b.r; r++)
        for (let i = COLS.indexOf(a.c); i <= COLS.indexOf(b.c); i++) {
          const e = cell(COLS[i] + r);
          const v = e ? parseFloat(e.textContent || "") : NaN;
          if (!isNaN(v) && e!.classList.contains("num")) vals.push(v);
        }
      if (!vals.length) return "Siap";
      const s = vals.reduce((x, y) => x + y, 0);
      return vals.length > 1 ? `Rata-rata: ${NF.format(s / vals.length)}   Hitungan: ${vals.length}   Jumlah: ${NF.format(s)}` : `Jumlah: ${NF.format(s)}`;
    };

    let tok = 0;
    let typing: ReturnType<typeof setInterval> | undefined;
    let current = "B6";
    const select = (range: string, formula: string, instant = false) => {
      const my = ++tok;
      clearInterval(typing);
      current = range;
      put(sel, range);
      sel.classList.toggle("range", range.includes(":"));
      headers(range);
      nameBox.textContent = range.split(":")[0];
      const list = formula.startsWith("=") ? [...new Set(formula.match(refPat) || [])] : [];
      refs.forEach((r, i) => {
        if (list[i]) {
          put(r, list[i]);
          r.classList.add("on");
        } else r.classList.remove("on");
      });
      stat.textContent = statFor(range);
      if (instant || reduce || !formula.startsWith("=")) {
        fxEl.innerHTML = hi(formula, list) + '<span class="caret"></span>';
        return Promise.resolve(my);
      }
      return new Promise<number>((res) => {
        let n = 1;
        typing = setInterval(() => {
          if (my !== tok) return clearInterval(typing);
          fxEl.innerHTML = hi(formula.slice(0, n), list) + '<span class="caret"></span>';
          if (++n > formula.length) {
            clearInterval(typing);
            res(my);
          }
        }, 34);
      });
    };
    const lookup = (month: string) => {
      const row = MONTHS.findIndex((m) => m[0] === month);
      const b8 = cell("B8")!;
      const c8 = cell("C8")!;
      b8.textContent = month;
      c8.textContent = String(MONTHS[row][1]);
      [b8, c8].forEach((e) => {
        e.classList.remove("flash");
        void e.offsetWidth;
        e.classList.add("flash");
      });
      table.querySelectorAll("tr.row-on").forEach((t) => t.classList.remove("row-on"));
      table.querySelector(`tr[data-r="${row + 2}"]`)?.classList.add("row-on");
      chart.classList.add("focus");
      chart.querySelectorAll<HTMLElement>(".bar").forEach((x) => x.classList.toggle("on", x.dataset.m === month));
    };
    const clearLookup = () => {
      table.querySelectorAll("tr.row-on").forEach((t) => t.classList.remove("row-on"));
      chart.classList.remove("focus");
      chart.querySelectorAll(".bar.on").forEach((x) => x.classList.remove("on"));
    };

    let alive = true;
    let paused = 0;
    let visible = true;
    let idx = 0;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const loop = async () => {
      await wait(1800);
      while (alive) {
        if (!visible || document.hidden || Date.now() < paused) {
          await wait(500);
          continue;
        }
        const s = STEPS[idx % STEPS.length];
        clearLookup();
        const my = await select(s.r, s.f);
        if (my !== tok) continue;
        await wait(s.hold);
        if (s.look) {
          for (const m of ["Jul", "Okt", "Sep"]) {
            if (my !== tok || Date.now() < paused || !alive) break;
            lookup(m);
            await wait(1300);
          }
          if (my === tok) {
            await wait(500);
            clearLookup();
          }
        }
        idx++;
      }
    };

    select("B6", "=SUM(B2:B5)", true);
    document.fonts?.ready.then(() => alive && put(sel, current));
    const ro = new ResizeObserver(() => put(sel, current));
    ro.observe(wrap);
    const io = new IntersectionObserver((es) => (visible = es[0].isIntersecting));
    io.observe(wrap);
    const onClick = (e: MouseEvent) => {
      const td = (e.target as HTMLElement).closest<HTMLTableCellElement>("td[data-c]");
      if (!td) return;
      paused = Date.now() + 9000;
      clearLookup();
      select(td.dataset.c!, td.dataset.f || td.textContent?.trim() || "");
    };
    table.addEventListener("click", onClick);
    if (!reduce) loop();
    return () => {
      alive = false;
      tok++;
      clearInterval(typing);
      ro.disconnect();
      io.disconnect();
      table.removeEventListener("click", onClick);
    };
  }, [reduce]);

  return (
    <div ref={root}>
      <figure className="sheet" aria-label="Contoh lembar kerja penjualan per bulan dengan rumus SUM, IF, dan XLOOKUP">
        <div className="fx-bar mono">
          <span className="namebox">B6</span>
          <span className="fx">fx</span>
          <span className="formula" />
        </div>
        <div className="grid-wrap">
          <table className="mini">
            <colgroup>
              <col style={{ width: 32 }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "27%" }} />
              <col style={{ width: "22%" }} />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th />
                {[..."ABCD"].map((c) => (
                  <th key={c} data-col={c}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th data-row="1">1</th>
                <td className="h" data-c="A1">Bulan</td>
                <td className="h" data-c="B1">Penjualan (jt)</td>
                <td className="h" data-c="C1">Target</td>
                <td className="h" data-c="D1">Status</td>
              </tr>
              {MONTHS.map(([m, v, t], i) => (
                <tr key={m} data-r={i + 2}>
                  <th data-row={i + 2}>{i + 2}</th>
                  <td data-c={`A${i + 2}`}>{m}</td>
                  <td className="num" data-c={`B${i + 2}`}>{v}</td>
                  <td className="num" data-c={`C${i + 2}`}>{t}</td>
                  <td data-c={`D${i + 2}`} data-f={`=IF(B${i + 2}>=C${i + 2};"Tercapai";"Belum")`}>
                    <span className={`pill ${v >= t ? "ok" : "no"}`}>{v >= t ? "Tercapai" : "Belum"}</span>
                  </td>
                </tr>
              ))}
              <tr className="total">
                <th data-row="6">6</th>
                <td data-c="A6">Total</td>
                <td className="num" data-c="B6" data-f="=SUM(B2:B5)">314</td>
                <td className="num" data-c="C6" data-f="=SUM(C2:C5)">310</td>
                <td data-c="D6" data-f='=IF(B6>=C6;"Tercapai";"Belum")'>
                  <span className="pill ok">Tercapai</span>
                </td>
              </tr>
              <tr>
                <th data-row="7">7</th>
                <td data-c="A7" />
                <td data-c="B7" />
                <td data-c="C7" />
                <td data-c="D7" />
              </tr>
              <tr>
                <th data-row="8">8</th>
                <td className="h" data-c="A8">Cari</td>
                <td className="inp" data-c="B8">Sep</td>
                <td className="num" colSpan={2} data-c="C8" data-f="=XLOOKUP(B8;A2:A5;B2:B5)">91</td>
              </tr>
            </tbody>
          </table>
          <div className="ref c1" />
          <div className="ref c2" />
          <div className="ref c3" />
          <div className="sel">
            <i />
          </div>
        </div>
        <div className="chart" aria-hidden="true">
          <div className="axis">
            <span>100</span>
            <span>50</span>
            <span>0</span>
          </div>
          {MONTHS.map(([m, v, t], k) => (
            <div key={m} className="bar" data-m={m} style={{ ["--v" as string]: v, ["--t" as string]: t, ["--k" as string]: k }}>
              <div className="track">
                <i />
                <b />
                <span className="v">{v}</span>
              </div>
              <em>{m}</em>
            </div>
          ))}
        </div>
        <div className="chart-legend" aria-hidden="true">
          <span>
            <i />
            Penjualan
          </span>
          <span>
            <i className="t" />
            Target
          </span>
        </div>
        <div className="statusbar mono">
          <div className="tabs">
            <span className="on">Penjualan_Q3</span>
            <span>Target</span>
          </div>
          <div className="stat">Jumlah: 314</div>
        </div>
      </figure>
    </div>
  );
});
