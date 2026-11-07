// Thời gian: lưu UTC trong database, nhập/hiển thị theo giờ Việt Nam (UTC+7, không đổi giờ mùa hè).
export const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, "0");

export function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Các thành phần ngày giờ theo giờ Việt Nam */
export function vnParts(v: string | Date) {
  const d = toDate(v)!;
  const x = new Date(d.getTime() + VN_OFFSET_MS);
  return {
    y: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate(),
    h: x.getUTCHours(), mi: x.getUTCMinutes(), dow: x.getUTCDay(), // 0 = Chủ nhật
  };
}

/** "06/11/2026" */
export function fmtDate(v: string | Date | null | undefined): string {
  if (!v) return "—";
  // Cột kiểu date ("2026-11-06") không có giờ → hiển thị nguyên ngày
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split("-");
    return `${d}/${m}/${y}`;
  }
  const p = vnParts(v);
  return `${pad(p.d)}/${pad(p.m)}/${p.y}`;
}

/** "09:45" */
export function fmtTime(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const p = vnParts(v);
  return `${pad(p.h)}:${pad(p.mi)}`;
}

/** "09:45 - 28/10/2026" */
export function fmtDateTime(v: string | Date | null | undefined): string {
  if (!v) return "—";
  return `${fmtTime(v)} - ${fmtDate(v)}`;
}

/** "28/10 09:45" (dòng hàng đợi chấm) */
export function fmtShort(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const p = vnParts(v);
  return `${pad(p.d)}/${pad(p.m)} ${pad(p.h)}:${pad(p.mi)}`;
}

/** Ngày (YYYY-MM-DD) theo giờ VN của một thời điểm */
export function vnDateKey(v: string | Date): string {
  const p = vnParts(v);
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
}

/** Giá trị cho ô <input type="datetime-local"> (giờ VN) */
export function toVNInput(v: string | Date | null | undefined): string {
  if (!v) return "";
  const p = vnParts(v);
  return `${p.y}-${pad(p.m)}-${pad(p.d)}T${pad(p.h)}:${pad(p.mi)}`;
}

/** "2026-11-06T21:00" (giờ VN do thầy nhập) → ISO UTC để lưu */
export function fromVNInput(s: string | null | undefined): string | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const utc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - VN_OFFSET_MS;
  return new Date(utc).toISOString();
}

/** "2 giờ trước", "1 ngày trước" */
export function fmtAgo(v: string | Date | null | undefined, now: Date = new Date()): string {
  const d = toDate(v);
  if (!d) return "";
  const s = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 1000));
  if (s < 60) return "vừa xong";
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} ngày trước`;
  return fmtDate(d);
}

/** Cộng ngày cho chuỗi YYYY-MM-DD */
export function addDays(dateKey: string, n: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const x = new Date(Date.UTC(y, m - 1, d + n));
  return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}`;
}

/** Thứ trong tuần kiểu ISO của chuỗi YYYY-MM-DD: 1 = Thứ 2 ... 7 = Chủ nhật */
export function isoDow(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return w === 0 ? 7 : w;
}

export const TEN_THU: Record<number, string> = { 1: "Thứ 2", 2: "Thứ 3", 3: "Thứ 4", 4: "Thứ 5", 5: "Thứ 6", 6: "Thứ 7", 7: "Chủ nhật" };
