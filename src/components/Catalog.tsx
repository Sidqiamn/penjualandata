"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { bundle, products, type Product } from "@/config/products";
import { rp } from "@/lib/format";
import { bundleItem, bundleUnitTotal, catalog, discountPct, getItem } from "@/lib/pricing";
import { Icon } from "./Icon";
import { DrawFrame, EASE, Reveal, SectionHead, Ticker } from "./motion-kit";
import { Preview } from "./Previews";
import { useStore } from "./store";

type Sort = "rec" | "low" | "high" | "disc";

function AddButton({ id, className = "btn btn-line sm add" }: { id: string; className?: string }) {
  const { has, add, setCartOpen } = useStore();
  const inCart = has(id);
  return (
    <button
      type="button"
      className={`${className}${inCart ? " added" : ""}`}
      onClick={(e) => (inCart ? setCartOpen(true) : add(id, e.currentTarget))}
    >
      <Icon name={inCart ? "check" : "plus"} />
      {inCart ? "Di keranjang" : "Tambah"}
    </button>
  );
}

function ProductCard({ p, index }: { p: Product; index: number }) {
  const { setDetailId } = useStore();
  const off = discountPct(p);
  return (
    <motion.article
      layout
      className="card"
      initial={{ opacity: 0, y: 44, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.75, ease: EASE, delay: (index % 3) * 0.08, layout: { duration: 0.5, ease: EASE } }}
    >
      <div className="prev" onClick={() => setDetailId(p.id)}>
        <Preview kind={p.preview} />
      </div>
      {p.tag && (
        <motion.span
          className="tag"
          initial={{ opacity: 0, y: -8, rotate: -4 }}
          whileInView={{ opacity: 1, y: 0, rotate: 3 }}
          viewport={{ once: true, amount: 1 }}
          transition={{ delay: 0.5 + (index % 3) * 0.08, type: "spring", stiffness: 260, damping: 14 }}
        >
          {p.tag}
        </motion.span>
      )}
      <div className="c-body">
        <div className="c-meta">
          <span className="cat">{p.category}</span>
          <span>{p.format}</span>
        </div>
        <h3 onClick={() => setDetailId(p.id)}>{p.title}</h3>
        <p className="desc">{p.desc}</p>
        <div className="c-foot">
          <div className="price">
            <b>{rp(p.price)}</b>
            <small>
              {off ? (
                <>
                  <s>{rp(p.oldPrice)}</s>
                  <em>hemat {off}%</em>
                </>
              ) : (
                "harga normal"
              )}
            </small>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-line sm" type="button" onClick={() => setDetailId(p.id)} aria-label={`Detail ${p.title}`}>
              Detail
            </button>
            <AddButton id={p.id} />
          </div>
        </div>
      </div>
      <span className="fh" />
    </motion.article>
  );
}

function BundleCard() {
  const { has, add, setCartOpen, setDetailId } = useStore();
  if (!bundle || !bundleItem) return null;
  const rows = bundle.items.map((id) => getItem(id)!).filter(Boolean);
  const save = bundleUnitTotal - bundle.price;
  const inCart = has(bundle.id);
  return (
    <motion.article
      layout
      className="bundle"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <DrawFrame delay={0.3} />
      <motion.span className="fh" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 1.5, type: "spring", stiffness: 400, damping: 18 }} />
      <div className="b-main">
        {bundle.tag && (
          <motion.span
            className="b-note hand"
            initial={{ opacity: 0, y: -10, rotate: -6 }}
            whileInView={{ opacity: 1, y: 0, rotate: 3 }}
            viewport={{ once: true }}
            transition={{ delay: 0.9, type: "spring", stiffness: 260, damping: 14 }}
          >
            {bundle.tag}
          </motion.span>
        )}
        <span className="cat">
          {bundle.category} · {bundle.format}
        </span>
        <h3>{bundle.title}</h3>
        <p>{bundle.longDesc}</p>
        <div className="b-cta">
          <button className="btn btn-primary" type="button" onClick={(e) => (inCart ? setCartOpen(true) : add(bundle!.id, e.currentTarget))}>
            <Icon name={inCart ? "check" : "plus"} />
            {inCart ? "Paket di keranjang" : "Ambil paketnya"}
          </button>
          <button className="btn btn-line" type="button" onClick={() => setDetailId(bundle!.id)}>
            Lihat isi paket
          </button>
        </div>
      </div>
      <div className="b-calc">
        <table className="calc">
          <thead>
            <tr>
              <th>Isi paket</th>
              <th>Harga</th>
            </tr>
          </thead>
          <motion.tbody initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.5 }} variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.4 } } }}>
            {rows.map((p) => (
              <motion.tr key={p.id} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                <td>{p.title}</td>
                <td>{rp(p.price)}</td>
              </motion.tr>
            ))}
            <motion.tr className="sum" variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}>
              <td>Kalau beli satuan</td>
              <td>
                <code>=SUM</code>
                <motion.span className="strike" variants={{ hidden: { ["--s" as string]: 0 }, show: { ["--s" as string]: 1 } }}>
                  {rp(bundleUnitTotal)}
                </motion.span>
              </td>
            </motion.tr>
            <motion.tr className="pay" variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}>
              <td>Harga paket</td>
              <td>{rp(bundle.price)}</td>
            </motion.tr>
            {save > 0 && (
              <motion.tr className="save" variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}>
                <td>Kamu hemat</td>
                <td>
                  <Ticker value={save} prefix="Rp " />
                </td>
              </motion.tr>
            )}
          </motion.tbody>
        </table>
      </div>
    </motion.article>
  );
}

export function Catalog() {
  const [cat, setCat] = useState("Semua");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("rec");
  const searchRef = useRef<HTMLInputElement>(null);
  const { dialogOpen } = useStore();

  const cats = useMemo(() => ["Semua", ...new Set(products.map((p) => p.category)), ...(bundle ? [bundle.category] : [])], []);
  const countFor = (c: string) => (c === "Semua" ? catalog.length : catalog.filter((p) => p.category === c).length);
  const match = (p: { title: string; desc: string; category: string; includes?: string[] }) => {
    const s = q.trim().toLowerCase();
    return (cat === "Semua" || p.category === cat) && (!s || `${p.title} ${p.desc} ${p.category} ${(p.includes || []).join(" ")}`.toLowerCase().includes(s));
  };
  let list = products.filter(match);
  if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
  if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
  if (sort === "disc") list = [...list].sort((a, b) => discountPct(b) - discountPct(a));
  const showBundle = !!bundleItem && match(bundleItem);
  const minPrice = Math.min(...catalog.map((p) => p.price));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || dialogOpen || /INPUT|TEXTAREA|SELECT/.test((document.activeElement as HTMLElement)?.tagName)) return;
      e.preventDefault();
      searchRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      searchRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialogOpen]);

  return (
    <section className="section" id="produk">
      <div className="wrap">
        <SectionHead
          icon="grid"
          tab="Produk"
          title="Materi yang sering ditanya di kolom komentar, versi lengkapnya."
          sub={`${catalog.length} produk, mulai ${rp(minPrice)}. Klik kartu untuk lihat isinya sebelum beli.`}
        />
        <Reveal className="toolbar" delay={0.1} y={16}>
          <div className="seg-scroll">
            <div className="seg" role="group" aria-label="Filter kategori">
              {cats.map((c) => (
                <button key={c} type="button" aria-pressed={c === cat} onClick={() => setCat(c)}>
                  {c === cat && <motion.span layoutId="seg-ind" className="seg-ind" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  {c}
                  <span className="n">{countFor(c)}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="tools-r">
            <label className="search">
              <Icon name="search" />
              <input ref={searchRef} type="search" placeholder="Cari: pivot, SQL, prompt…" autoComplete="off" aria-label="Cari produk" value={q} onChange={(e) => setQ(e.target.value)} />
              <kbd>/</kbd>
            </label>
            <label className="sort">
              Urutkan
              <select aria-label="Urutkan produk" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="rec">Rekomendasi</option>
                <option value="low">Harga terendah</option>
                <option value="high">Harga tertinggi</option>
                <option value="disc">Diskon terbesar</option>
              </select>
            </label>
          </div>
        </Reveal>

        <AnimatePresence mode="popLayout">{showBundle && <BundleCard key="bundle" />}</AnimatePresence>

        <motion.div className="grid" layout transition={{ layout: { duration: 0.5, ease: EASE } }}>
          <AnimatePresence mode="popLayout">
            {list.map((p, i) => (
              <ProductCard key={p.id} p={p} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
        <AnimatePresence>
          {!list.length && !showBundle && (
            <motion.div className="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <b>#N/A</b>
              Produk yang kamu cari belum ada. Coba kata lain, atau tanya admin.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
