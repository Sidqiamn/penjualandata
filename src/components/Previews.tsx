import type { PreviewKind } from "@/config/products";
import { Icon } from "./Icon";

/** Ilustrasi isi produk di kartu (bukan gambar, digambar dengan HTML/CSS) */
export function Preview({ kind }: { kind: PreviewKind }) {
  switch (kind) {
    case "formula":
      return (
        <div className="pv pv-formula">
          <div className="page">
            <span className="pt">Rumus pencarian &amp; filter</span>
            {[
              ["=XLOOKUP", "78%"],
              ["=FILTER", "60%"],
              ["=SUMIFS", "84%"],
              ["=LET", "50%"],
              ["=TEXTSPLIT", "66%"],
            ].map(([c, w], k) => (
              <div key={c} className="pf" style={{ ["--k" as string]: k }}>
                <code>{c}</code>
                <i style={{ ["--w" as string]: w }} />
              </div>
            ))}
          </div>
        </div>
      );
    case "dashboard": {
      const a = [42, 58, 50, 66, 61, 74, 70, 86];
      const b = [50, 46, 64, 58, 72, 66, 84, 78];
      return (
        <div className="pv pv-dash">
          <div className="kpis">
            <div><small>Omzet</small><b>1,2 M</b></div>
            <div><small>Order</small><b>8.430</b></div>
            <div><small>AOV</small><b>142 rb</b></div>
          </div>
          <div className="dbars">
            {a.map((v, i) => (
              <i key={i} style={{ ["--v" as string]: v, ["--v2" as string]: b[i] }} />
            ))}
          </div>
        </div>
      );
    }
    case "sql":
      return (
        <div className="pv pv-code">
          <pre>
            <span className="l"><span className="kw">SELECT</span> kota,</span>
            <span className="l">  <span className="fn">SUM</span>(total) <span className="kw">AS</span> omzet</span>
            <span className="l"><span className="kw">FROM</span> orders</span>
            <span className="l"><span className="kw">WHERE</span> status = <span className="s">&apos;paid&apos;</span></span>
            <span className="l"><span className="kw">GROUP BY</span> kota</span>
            <span className="l"><span className="kw">ORDER BY</span> omzet <span className="kw">DESC</span>;<i className="cur" /></span>
          </pre>
        </div>
      );
    case "prompt":
      return (
        <div className="pv pv-chat">
          <div className="bub me">Rapikan kolom tanggal yang formatnya campur, lalu buat ringkasan omzet per bulan.</div>
          <div className="bub ai">
            <span className="who">AI</span>
            <i style={{ ["--w" as string]: "92%" }} />
            <i style={{ ["--w" as string]: "70%" }} />
            <div className="typing"><span /><span /><span /></div>
          </div>
        </div>
      );
    case "powerbi":
      return (
        <div className="pv pv-bi">
          <div className="box kpi"><small>Revenue YTD</small><b>4,8 M</b><em>+12%</em></div>
          <div className="box donut"><span /></div>
          <div className="box" style={{ padding: 6 }}>
            <svg viewBox="0 0 200 64" preserveAspectRatio="none">
              <path className="ar" d="M4 52 L32 44 L60 47 L88 32 L116 36 L144 22 L172 26 L196 10 L196 62 L4 62Z" />
              <path className="ln" d="M4 52 L32 44 L60 47 L88 32 L116 36 L144 22 L172 26 L196 10" />
            </svg>
          </div>
        </div>
      );
    case "video":
      return (
        <div className="pv pv-video">
          <div className="screen">
            <span className="play"><Icon name="play" /></span>
            <span className="dur">12:40</span>
            <span className="prog"><i /></span>
          </div>
          <ol className="chap">
            <li className="done"><b />Excel untuk analisis</li>
            <li className="done"><b />Pivot &amp; dashboard</li>
            <li><b />SQL dasar</li>
            <li><b />JOIN &amp; agregasi</li>
            <li><b />Visualisasi data</li>
          </ol>
        </div>
      );
    default:
      return null;
  }
}
