// =====================================================================
// NHẬP PPCT TỪ EXCEL (spec 6.4) — phần nhận diện thuần, không phụ thuộc thư viện Excel.
// Server đọc file .xlsx thành "dòng thô" (lib/server/excel.ts), trình duyệt ghép cột
// và gọi phanTichPPCT() để xem trước cây Module › Chủ đề › Buổi kèm cảnh báo.
// Có kiểm thử: tests/ppct.test.ts
// =====================================================================
import { chuanHoaNhanBuoi, soTrongNhan } from "./naming";

/** Một dòng của trang tính sau khi đọc */
export interface DongExcel {
  dong: number;                    // số dòng trong Excel (1-based) để báo cảnh báo
  o: string[];                     // chữ trong từng ô
  link: (string | null)[];         // hyperlink trong từng ô (nếu có)
  toMau: boolean;                  // dòng có tô màu nền (không phải trắng)
  mau?: string[];                  // các màu nền (ARGB) của ô có chữ — để tìm màu "hiếm" đánh dấu ranh giới module
}

export interface GhepCot { buoi: number; bai: number; noiDung: number; taiLieu: number; loai: number } // -1 = không dùng

export interface LoaiBuoiNhanDien { id: string; ten: string; tu_khoa: string | null; noi_bat: boolean }

/** vaiTro theo tên cột: phiếu bài tập / quiz / tham khảo / tài liệu thường */
export type VaiTroLink = "phieu" | "quiz" | "tham_khao" | "tai_lieu";
export interface TaiLieuLink { tieuDe: string; url: string; vaiTro?: VaiTroLink }

export interface BuoiXemTruoc {
  dong: number;
  nhanBuoi: string;
  tieuDe: string;
  tomTat: string;
  loaiId: string | null;
  loaiTen: string;
  chuDe: string | null;
  taiLieu: TaiLieuLink[];
  noiBat: boolean;
  nhanGoc?: string;                // số buổi ghi trong file (trước khi đánh số lại)
  taoBaiTap?: boolean;             // tạo bài tập nhiều tab (buổi có phiếu bài tập)
}
export interface ModuleXemTruoc { ten: string; buoi: BuoiXemTruoc[] }
export interface CanhBao { dong: number | null; noiDung: string }
export interface KetQuaPPCT { modules: ModuleXemTruoc[]; canhBao: CanhBao[]; tongBuoi: number; lechSo: boolean }

const bo = (s: string) => s.normalize("NFC").toLowerCase();

/** Đoán cột theo tên tiêu đề */
export function doanGhepCot(tieuDe: string[]): GhepCot {
  const tim = (re: RegExp, tru: number[] = []) => tieuDe.findIndex((t, i) => !tru.includes(i) && re.test(bo(t)));
  const buoi = tim(/buổi|tiết|^stt$/);
  const taiLieu = tim(/tài liệu|học liệu|link|tư liệu/, [buoi]);
  const noiDung = tim(/nội dung|mục tiêu|yêu cầu/, [buoi, taiLieu]);
  const loai = tim(/loại|hình thức/, [buoi, taiLieu, noiDung]);
  const bai = tim(/bài|chủ đề|tên/, [buoi, taiLieu, noiDung, loai]);
  return { buoi, bai, noiDung, taiLieu, loai };
}

const gon = (s: string) => bo(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9+]/g, "");

/** Tên loại khớp chữ trong ô? ("Casestudy" ≈ "Case study", "LT + thực hành" không khớp) */
export function timLoaiTheoTen(chu: string, cacLoai: LoaiBuoiNhanDien[]): LoaiBuoiNhanDien | null {
  const g = gon(chu);
  if (!g) return null;
  return cacLoai.find((l) => gon(l.ten) === g) ?? null;
}

/**
 * Đoán cột dựa cả vào DỮ LIỆU: cột mà phần lớn ô ghi đúng tên loại buổi (Lý thuyết / Bài tập / Kiểm tra…)
 * là cột Loại — kể cả khi tiêu đề ghi khác (ví dụ "Tài liệu lý thuyết").
 */
export function doanGhepCotDayDu(rows: DongExcel[], hd: number, cacLoai: LoaiBuoiNhanDien[]): GhepCot {
  const tieuDe = rows[hd]?.o ?? [];
  const g = doanGhepCot(tieuDe);
  const duLieu = rows.slice(hd + 1, hd + 200);
  let tot = -1, tiLe = 0;
  for (let j = 0; j < tieuDe.length; j++) {
    if (j === g.buoi || j === g.bai || j === g.noiDung) continue;
    const vals = duLieu.map((r) => String(r.o[j] ?? "").trim()).filter(Boolean);
    if (vals.length < 3) continue;
    const t = vals.filter((v) => timLoaiTheoTen(v, cacLoai)).length / vals.length;
    if (t > tiLe) { tiLe = t; tot = j; }
  }
  if (tot >= 0 && tiLe >= 0.6) {
    g.loai = tot;
    if (g.taiLieu === tot) g.taiLieu = -1;
  }
  return g;
}

/** Vai trò của link theo tên cột chứa nó (và theo địa chỉ) */
export function vaiTroLink(tenCot: string, url: string): VaiTroLink {
  const t = bo(tenCot);
  if (/quiz|kahoot|wayground|blooket/.test(t) || /quizizz\.com|wayground\.com|kahoot\.(it|com)|blooket\.com/i.test(url)) return "quiz";
  if (/tham khảo/.test(t)) return "tham_khao";
  if (/bài tập|phiếu|^bt$/.test(t)) return "phieu";
  return "tai_lieu";
}

/** Tên file → tên dễ đọc: "Phieu_bai_tap_Python_Bai_2.docx" → "Phieu bai tap Python Bai 2" */
export function tenDep(s: string): string {
  return s.trim().replace(/\.(docx?|pdf|pptx?|xlsx?|txt|py)$/i, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
}

const TEN_MAC_DINH: Record<VaiTroLink, string> = { phieu: "Phiếu bài tập", quiz: "Làm Quiz", tham_khao: "Tham khảo", tai_lieu: "Tài liệu" };

/** Số buổi kiểu Excel: 12.0 → "12"; 10.11 (gõ nhầm "10,11") → "10–11" */
export function nhanTuExcel(raw: string): string {
  const s = String(raw ?? "").trim();
  const m = /^(\d+)\.(\d+)$/.exec(s);
  if (m) {
    if (/^0+$/.test(m[2])) return m[1];
    const a = Number(m[1]), b = Number(m[2]);
    if (b > a && b - a <= 3) return `${a}–${b}`;
  }
  return chuanHoaNhanBuoi(s);
}

/** Tìm dòng tiêu đề trong 15 dòng đầu (dòng có chữ "Buổi" và "Bài"/"Nội dung") */
export function timDongTieuDe(rows: DongExcel[]): number {
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const t = rows[i].o.map(bo);
    if (t.some((x) => /buổi|tiết/.test(x)) && t.some((x) => /bài|nội dung|chủ đề/.test(x))) return i;
  }
  return 0;
}

const URL_RE = /https?:\/\/[^\s<>"')]+/gi;

function laUrlHopLe(u: string): boolean {
  try { const x = new URL(u); return x.protocol === "http:" || x.protocol === "https:"; } catch { return false; }
}

/** Nhận diện loại buổi theo từ khóa (ưu tiên loại nổi bật: Kiểm tra, Contest) */
export function nhanDienLoai(chu: string, loaiCot: string, cacLoai: LoaiBuoiNhanDien[], macDinh: LoaiBuoiNhanDien | null) {
  const nguon = bo(`${loaiCot} ${chu}`);
  const xepHang = [...cacLoai].sort((a, b) => Number(b.noi_bat) - Number(a.noi_bat));
  // Cột "Loại" ghi đúng tên loại → dùng luôn
  if (loaiCot.trim()) {
    const dung = cacLoai.find((l) => bo(l.ten) === bo(loaiCot.trim()));
    if (dung) return dung;
  }
  for (const l of xepHang) {
    const tk = (l.tu_khoa ?? l.ten).split(",").map((x) => bo(x.trim())).filter(Boolean);
    if (tk.some((k) => nguon.includes(k))) return l;
  }
  return macDinh;
}

const LA_TIEU_DE_MODULE = /^\s*(module|chương|phần|chủ đề lớn)\s*\d+/i;
const LA_KIEM_TRA_MODULE = /kiểm tra\s*(module|chương|giữa|cuối)/i;

export function phanTichPPCT(
  rows: DongExcel[],
  ghep: GhepCot,
  cacLoai: LoaiBuoiNhanDien[],
  opts: { batDauTuDong?: number; macDinhLoaiId?: string | null; danhSoLai?: boolean; tieuDeCot?: string[] } = {},
): KetQuaPPCT {
  const canhBao: CanhBao[] = [];
  const macDinh = cacLoai.find((l) => l.id === opts.macDinhLoaiId) ?? cacLoai[0] ?? null;
  const lay = (r: DongExcel, i: number) => (i >= 0 ? (r.o[i] ?? "").toString().trim() : "");
  const layLink = (r: DongExcel, i: number) => (i >= 0 ? r.link[i] ?? null : null);

  const duLieu = rows.slice(opts.batDauTuDong ?? 0).filter((r) => r.o.some((x) => String(x ?? "").trim() !== ""));

  // Màu nền: chỉ màu "hiếm" (≤ 25% số dòng) mới coi là đánh dấu nổi bật / ranh giới module.
  // Bảng tô nền nhạt cho cả bảng (rất hay gặp) thì màu đó bị bỏ qua.
  const nguong = Math.max(3, duLieu.length * 0.25);
  const coMauChiTiet = duLieu.some((r) => r.mau !== undefined);
  let laNoiBat: (r: DongExcel) => boolean;
  if (coMauChiTiet) {
    const dem = new Map<string, number>();
    for (const r of duLieu) for (const c of new Set(r.mau ?? [])) dem.set(c, (dem.get(c) ?? 0) + 1);
    const hiem = new Set([...dem].filter(([, n]) => n <= nguong).map(([c]) => c));
    laNoiBat = (r) => (r.mau ?? []).some((c) => hiem.has(c));
  } else {
    const soToMau = duLieu.filter((r) => r.toMau).length;
    const dungMau = soToMau > 0 && soToMau <= nguong;
    if (soToMau > 0 && !dungMau) canhBao.push({ dong: null, noiDung: "Bảng tô màu nhiều dòng nên hệ thống không dùng màu để chia module. Hãy kiểm tra ranh giới module ở bước xem trước." });
    laNoiBat = (r) => dungMau && r.toMau;
  }

  const modules: ModuleXemTruoc[] = [];
  let hienTai: ModuleXemTruoc | null = null;
  let ketThucModule = false;
  const moModule = (ten?: string) => {
    hienTai = { ten: ten ?? `Module ${modules.length + 1}`, buoi: [] };
    modules.push(hienTai);
    ketThucModule = false;
  };

  for (const r of duLieu) {
    const buoiRaw = lay(r, ghep.buoi);
    const bai = lay(r, ghep.bai);
    const noiDung = lay(r, ghep.noiDung);
    const taiLieuChu = lay(r, ghep.taiLieu);
    const loaiCot = lay(r, ghep.loai);
    const caDong = r.o.join(" ").trim();

    // Dòng tiêu đề module (không có số buổi, có chữ "Module N")
    if (!buoiRaw && (LA_TIEU_DE_MODULE.test(bai) || LA_TIEU_DE_MODULE.test(caDong))) {
      const ten = (LA_TIEU_DE_MODULE.test(bai) ? bai : r.o.find((x) => LA_TIEU_DE_MODULE.test(String(x))) ?? caDong).toString().trim();
      moModule(ten);
      continue;
    }
    if (!buoiRaw && !bai && !noiDung) continue;

    if (!hienTai || ketThucModule) moModule();
    const nhan = nhanTuExcel(buoiRaw);
    // "1. Hello word" → "Hello word" (bỏ số thứ tự gõ tay ở đầu tên bài)
    const tieuDe = (bai || noiDung.split("\n")[0] || "").replace(/^\s*\d{1,3}\s*[.)]\s+/, "").trim();
    if (!tieuDe) canhBao.push({ dong: r.dong, noiDung: `Buổi ${nhan || "?"} thiếu tên bài.` });
    if (!nhan) canhBao.push({ dong: r.dong, noiDung: `Dòng ${r.dong} chưa có số buổi.` });

    // Ưu tiên: cột Loại ghi đúng tên → từ khóa trong TÊN BÀI → từ khóa trong nội dung → loại mặc định
    const loai = timLoaiTheoTen(loaiCot, cacLoai) ?? nhanDienLoai(bai, "", cacLoai, null) ?? nhanDienLoai(`${bai} ${noiDung}`, loaiCot, cacLoai, macDinh);

    // Tài liệu: hyperlink trong ô + link viết thẳng trong chữ
    const taiLieu: TaiLieuLink[] = [];
    const themLink = (url: string, tieu: string, vaiTro: VaiTroLink) => {
      if (!laUrlHopLe(url)) { canhBao.push({ dong: r.dong, noiDung: `Link không hợp lệ: ${url}` }); return; }
      const khoa = (u: string) => u.replace(/[?#].*$/, "").replace(/\/(edit|view)$/, "");
      if (taiLieu.some((t) => khoa(t.url) === khoa(url))) return;
      let ten = tieu || TEN_MAC_DINH[vaiTro];
      const trung = taiLieu.filter((t) => t.tieuDe === ten || t.tieuDe.startsWith(ten + " (")).length;
      if (trung) ten = `${ten} (${trung + 1})`;
      taiLieu.push({ tieuDe: ten, url, vaiTro });
    };
    const tenCot = (i: number) => String(opts.tieuDeCot?.[i] ?? "");
    for (let i = 0; i < r.link.length; i++) {
      const u = layLink(r, i)?.trim();
      if (!u) continue;
      const vt = i === ghep.taiLieu ? (vaiTroLink(tenCot(i), u) === "quiz" ? "quiz" : "tai_lieu") : vaiTroLink(tenCot(i), u);
      const chu = String(r.o[i] ?? "").trim();
      themLink(u, chu && !/https?:/i.test(chu) ? tenDep(chu) : vt === "tai_lieu" && taiLieuChu && !/^https?:/i.test(taiLieuChu) ? taiLieuChu : TEN_MAC_DINH[vt], vt);
    }
    // Link gõ thẳng trong chữ (không phải hyperlink) ở các ô
    r.o.forEach((chu, i) => {
      for (const u of String(chu ?? "").match(URL_RE) ?? []) {
        const vt = i === ghep.taiLieu || i === ghep.noiDung ? (vaiTroLink("", u) === "quiz" ? "quiz" : "tai_lieu") : vaiTroLink(tenCot(i), u);
        themLink(u, i === ghep.taiLieu ? taiLieuChu.replace(URL_RE, "").trim() : "", vt);
      }
    });

    const toNoiBat = laNoiBat(r);
    const noiBat = !!loai?.noi_bat || toNoiBat;
    hienTai!.buoi.push({
      dong: r.dong, nhanBuoi: nhan, tieuDe: tieuDe || "(chưa có tên)", tomTat: bai ? noiDung : noiDung.split("\n").slice(1).join("\n"),
      loaiId: loai?.id ?? null, loaiTen: loai?.ten ?? "", chuDe: null, taiLieu, noiBat,
      nhanGoc: nhan, taoBaiTap: taiLieu.some((t) => t.vaiTro === "phieu"),
    });

    // Ranh giới module: "Kiểm tra module N" hoặc dòng tô màu nổi bật
    if (LA_KIEM_TRA_MODULE.test(`${bai} ${noiDung}`) || toNoiBat) ketThucModule = true;
  }

  // Gom chủ đề: các buổi liên tiếp cùng tên bài trong một module
  for (const m of modules) {
    let i = 0;
    while (i < m.buoi.length) {
      let j = i;
      while (j + 1 < m.buoi.length && m.buoi[j + 1].tieuDe === m.buoi[i].tieuDe && m.buoi[i].tieuDe !== "(chưa có tên)") j++;
      if (j > i) for (let k = i; k <= j; k++) m.buoi[k].chuDe = m.buoi[i].tieuDe;
      i = j + 1;
    }
  }

  // Cảnh báo số buổi trùng / lệch thứ tự (chỉ cảnh báo, không từ chối)
  const canhBaoSo = kiemTraSoBuoi(modules);
  const lechSo = canhBaoSo.length > 0;
  if (opts.danhSoLai) {
    // Đánh số lại 1, 2, 3… theo thứ tự dòng; buổi gộp ("10–11", "43, 44") vẫn chiếm 2 số
    let so = 1; const doi: string[] = [];
    for (const m of modules) for (const b of m.buoi) {
      const rong = Math.max(1, soTrongNhan(b.nhanBuoi).length);
      const moi = rong === 1 ? String(so) : `${so}–${so + rong - 1}`;
      if (moi !== b.nhanBuoi) doi.push(`dòng ${b.dong}: ${b.nhanBuoi || "?"} → ${moi}`);
      b.nhanBuoi = moi; so += rong;
    }
    if (doi.length) canhBao.push({ dong: null, noiDung: `Đã đánh số lại ${doi.length} buổi theo thứ tự dòng (${doi.slice(0, 8).join("; ")}${doi.length > 8 ? "; …" : ""}).` });
  } else canhBao.push(...canhBaoSo);

  const kq = modules.filter((m) => m.buoi.length > 0);
  if (kq.length === 0) canhBao.push({ dong: null, noiDung: "Không tìm thấy buổi học nào. Kiểm tra lại trang tính và cách ghép cột." });
  return { modules: kq, canhBao, tongBuoi: kq.reduce((s, m) => s + m.buoi.length, 0), lechSo };
}

function kiemTraSoBuoi(modules: ModuleXemTruoc[]): CanhBao[] {
  const canhBao: CanhBao[] = [];
  const daCo = new Map<number, number>();
  let truoc = 0;
  for (const m of modules) for (const b of m.buoi) {
    const so = soTrongNhan(b.nhanBuoi);
    for (const s of so) {
      if (daCo.has(s)) canhBao.push({ dong: b.dong, noiDung: `Buổi ${s} bị trùng (đã có ở dòng ${daCo.get(s)}).` });
      else daCo.set(s, b.dong);
    }
    if (so.length && so[0] !== truoc + 1 && truoc > 0) {
      canhBao.push({ dong: b.dong, noiDung: so[0] <= truoc ? `Buổi ${b.nhanBuoi} lệch thứ tự (đứng sau buổi ${truoc}).` : `Thiếu buổi ${truoc + 1}${so[0] - 1 > truoc + 1 ? `–${so[0] - 1}` : ""} (nhảy từ ${truoc} lên ${so[0]}).` });
    }
    if (so.length) truoc = Math.max(truoc, so[so.length - 1]);
  }
  return canhBao;
}
