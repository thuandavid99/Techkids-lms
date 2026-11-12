// Nội dung bài nộp lưu trong cột code_text:
//  - Bài một ô code (như trước): code thuần
//  - Bài nhiều tab hoặc nộp bằng link: JSON {"lms":1,"tabs":["…","…"],"link":"https://…"}
// Đọc/ghi qua 2 hàm dưới để mọi màn hiểu giống nhau.

export interface NoiDungNop { tabs: string[]; link: string | null }
export type KetQuaTab = "d" | "s" | null; // d = đúng, s = sai, null = chưa chấm

const DAU = '{"lms":1';

export function docNop(codeText: string | null | undefined, soBai = 1): NoiDungNop {
  const s = codeText ?? "";
  let tabs: string[] = [s];
  let link: string | null = null;
  if (s.startsWith(DAU)) {
    try {
      const j = JSON.parse(s) as { tabs?: unknown; link?: unknown };
      tabs = Array.isArray(j.tabs) ? j.tabs.map((x) => (typeof x === "string" ? x : "")) : [];
      link = typeof j.link === "string" && j.link ? j.link : null;
    } catch { tabs = [s]; }
  }
  const n = Math.max(1, Math.min(50, Math.round(soBai) || 1), tabs.length);
  while (tabs.length < n) tabs.push("");
  return { tabs, link };
}

export function ghiNop(n: NoiDungNop): string {
  const tabs = [...n.tabs];
  while (tabs.length > 1 && !tabs[tabs.length - 1].trim()) tabs.pop(); // bỏ tab trống ở cuối cho gọn
  if (!n.link && tabs.length <= 1) return tabs[0] ?? "";
  return JSON.stringify({ lms: 1, tabs, link: n.link || null });
}

/** Tab "đã làm" = có ít nhất một dòng không phải chú thích */
export function tabDaLam(code: string): boolean {
  return code.split("\n").some((d) => { const t = d.trim(); return t !== "" && !t.startsWith("#"); });
}

export function demDaLam(n: NoiDungNop, soBai: number): number {
  return n.tabs.slice(0, Math.max(soBai, 1)).filter(tabDaLam).length;
}

export function coNoiDung(n: NoiDungNop): boolean {
  return !!n.link || n.tabs.some((t) => t.trim().length > 0);
}

/** Đọc kết quả chấm từng tab (cột cham_tabs) */
export function docChamTabs(v: unknown, soBai: number): KetQuaTab[] {
  const a = Array.isArray(v) ? v : [];
  return Array.from({ length: Math.max(1, soBai) }, (_, i) => (a[i] === "d" || a[i] === "s" ? a[i] : null));
}

/** Gợi ý điểm = số bài đúng / tổng số bài × điểm tối đa (làm tròn 0,5 gần nhất… theo 1 chữ số) */
export function goiYDiem(ketQua: KetQuaTab[], diemToiDa: number): number | null {
  if (!ketQua.length || ketQua.every((x) => x === null)) return null;
  const dung = ketQua.filter((x) => x === "d").length;
  return Math.round((dung / ketQua.length) * diemToiDa * 10) / 10;
}

/** File văn bản khi thầy tải bài nhiều tab về: các bài nối nhau, có tiêu đề */
export function noiThanhFile(n: NoiDungNop): string {
  if (n.tabs.length <= 1 && !n.link) return n.tabs[0] ?? "";
  const phan = n.tabs.map((t, i) => `# ===== Bài ${i + 1} =====\n${t.trimEnd()}\n`);
  if (n.link) phan.unshift(`# Link bài làm: ${n.link}\n`);
  return phan.join("\n");
}

/** Link nộp bài hợp lệ: http(s), không quá dài */
export function linkHopLe(s: string): boolean {
  if (s.length > 500) return false;
  try { const u = new URL(s); return u.protocol === "https:" || u.protocol === "http:"; } catch { return false; }
}
