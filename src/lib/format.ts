const NF = new Intl.NumberFormat("id-ID");

export const num = (n: number) => NF.format(n);
export const rp = (n: number) => "Rp " + NF.format(Math.round(n));
export const pad = (n: number) => String(n).padStart(2, "0");

export function fmtWIB(iso: string | number | Date, withWeekday = false) {
  const d = new Date(iso);
  try {
    return (
      new Intl.DateTimeFormat("id-ID", {
        ...(withWeekday ? { weekday: "long" as const } : {}),
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }).format(d) + " WIB"
    );
  } catch {
    return d.toLocaleString("id-ID");
  }
}

/** Sisa waktu "mm:ss" atau "hh:mm:ss" */
export function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export const maskEmail = (e: string) => {
  const [u, d] = e.split("@");
  if (!d) return e;
  return `${u.slice(0, 2)}${"•".repeat(Math.max(1, u.length - 2))}@${d}`;
};
