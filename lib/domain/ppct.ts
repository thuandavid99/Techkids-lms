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
  toMau: boolean;                  // dòng có tô màu nền nổi bật
}

export interface GhepCot { buoi: number; bai: number; noiDung: number; taiLieu: number; loai: number } // -1 = không dùng

export interface LoaiBuoiNhanDien { id: string; ten: string; tu_khoa: string | null; noi_bat: boolean }

export interface TaiLieuLink { tieuDe: string; url: string }

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
}
export interface ModuleXemTruoc { ten: string; buoi: BuoiXemTruoc[] }
export interface CanhBao { dong: number | null; noiDung: string }
export interface KetQuaPPCT { modules: ModuleXemTruoc[]; canhBao: CanhBao[]; tongBuoi: number }

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
  opts: { batDauTuDong?: number; macDinhLoaiId?: string | null } = {},
): KetQuaPPCT {
  const canhBao: CanhBao[] = [];
  const macDinh = cacLoai.find((l) => l.id === opts.macDinhLoaiId) ?? cacLoai[0] ?? null;
  const lay = (r: DongExcel, i: number) => (i >= 0 ? (r.o[i] ?? "").toString().trim() : "");
  const layLink = (r: DongExcel, i: number) => (i >= 0 ? r.link[i] ?? null : null);

  const duLieu = rows.slice(opts.batDauTuDong ?? 0).filter((r) => r.o.some((x) => String(x ?? "").trim() !== ""));

  // Màu nền: nếu quá nhiều dòng tô màu (bảng tô xen kẽ) thì bỏ qua tín hiệu màu
  const soToMau = duLieu.filter((r) => r.toMau).length;
  const dungMau = soToMau > 0 && soToMau <= Math.max(3, duLieu.length * 0.25);
  if (soToMau > 0 && !dungMau) canhBao.push({ dong: null, noiDung: "Bảng tô màu nhiều dòng nên hệ thống không dùng màu để chia module. Hãy kiểm tra ranh giới module ở bước xem trước." });

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
    const nhan = chuanHoaNhanBuoi(buoiRaw);
    const tieuDe = bai || noiDung.split("\n")[0] || "";
    if (!tieuDe) canhBao.push({ dong: r.dong, noiDung: `Buổi ${nhan || "?"} thiếu tên bài.` });
    if (!nhan) canhBao.push({ dong: r.dong, noiDung: `Dòng ${r.dong} chưa có số buổi.` });

    const loai = nhanDienLoai(`${bai} ${noiDung}`, loaiCot, cacLoai, macDinh);

    // Tài liệu: hyperlink trong ô + link viết thẳng trong chữ
    const taiLieu: TaiLieuLink[] = [];
    const themLink = (url: string, tieu: string) => {
      if (!laUrlHopLe(url)) { canhBao.push({ dong: r.dong, noiDung: `Link không hợp lệ: ${url}` }); return; }
      if (!taiLieu.some((t) => t.url === url)) taiLieu.push({ tieuDe: tieu || "Tài liệu", url });
    };
    for (let i = 0; i < r.link.length; i++) {
      const u = layLink(r, i);
      if (u) themLink(u.trim(), (r.o[i] ?? "").toString().trim() && !/^https?:/i.test(String(r.o[i])) ? String(r.o[i]).trim() : taiLieuChu || "Tài liệu");
    }
    for (const u of `${taiLieuChu} ${noiDung}`.match(URL_RE) ?? []) themLink(u, taiLieuChu.replace(URL_RE, "").trim() || "Tài liệu");

    const noiBat = !!loai?.noi_bat || (dungMau && r.toMau);
    hienTai!.buoi.push({
      dong: r.dong, nhanBuoi: nhan, tieuDe: tieuDe || "(chưa có tên)", tomTat: bai ? noiDung : noiDung.split("\n").slice(1).join("\n"),
      loaiId: loai?.id ?? null, loaiTen: loai?.ten ?? "", chuDe: null, taiLieu, noiBat,
    });

    // Ranh giới module: "Kiểm tra module N" hoặc dòng tô màu nổi bật
    if (LA_KIEM_TRA_MODULE.test(`${bai} ${noiDung}`) || (dungMau && r.toMau)) ketThucModule = true;
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

  const kq = modules.filter((m) => m.buoi.length > 0);
  if (kq.length === 0) canhBao.push({ dong: null, noiDung: "Không tìm thấy buổi học nào. Kiểm tra lại trang tính và cách ghép cột." });
  return { modules: kq, canhBao, tongBuoi: kq.reduce((s, m) => s + m.buoi.length, 0) };
}
