// =====================================================================
// SỐ LIỆU HIỂN THỊ (spec 9.4, 9.5, 9.2): % hoàn thành, điểm TB có hệ số,
// hành trình học tập, huy hiệu, cảnh báo sớm, danh sách nhắc phụ huynh, mẫu tin.
// Có kiểm thử: tests/stats.test.ts
// =====================================================================
import { tinhTrangThai, type DongBaiTho, type KetQuaTrangThai, type LyDoNhac } from "./status";
import { fmtDate } from "./time";

export interface DongBai extends DongBaiTho {
  assignment_id: string;
  lesson_id: string;
  ma: string;
  tieu_de: string;
  diem: number | null;
  diem_toi_da: number;
  he_so: number;
  hoc_ky: number;
  tinh_diem: boolean;
  module_id?: string | null;
}

/** Làm tròn "nửa lên" với số chữ số thập phân cho trước */
export function lamTron(x: number, soChuSo = 1): number {
  const k = Math.pow(10, soChuSo);
  return Math.round((x + Number.EPSILON) * k) / k;
}

/** % hoàn thành = số bài đã nộp / số bài BẮT BUỘC đã mở (không tính miễn nộp, bài tùy chọn) */
export function phanTramHoanThanh(rows: DongBai[], now = new Date()) {
  let tong = 0, daNop = 0;
  for (const r of rows) {
    const kq = tinhTrangThai(r, now);
    if (!kq.tinhVaoHoanThanh) continue;
    tong++;
    if (kq.daNop) daNop++;
  }
  return { daNop, tong, phanTram: tong === 0 ? 0 : Math.round((daNop / tong) * 100) };
}

/** Điểm TB = Σ(điểm quy về thang 10 × hệ số) / Σ hệ số; chỉ bài đã chấm, không tính miễn nộp */
export function diemTrungBinh(rows: DongBai[], opts: { hocKy?: number; soChuSo?: number } = {}): number | null {
  let tu = 0, mau = 0;
  for (const r of rows) {
    if (opts.hocKy && r.hoc_ky !== opts.hocKy) continue;
    if (r.mien_nop || !r.tinh_diem || r.diem === null || r.diem === undefined) continue;
    if (r.trang_thai !== "da_cham" && r.trang_thai !== "nop_ngoai_he_thong") continue;
    const diem10 = (Number(r.diem) / Number(r.diem_toi_da || 10)) * 10;
    tu += diem10 * Number(r.he_so || 1);
    mau += Number(r.he_so || 1);
  }
  if (mau === 0) return null;
  return lamTron(tu / mau, opts.soChuSo ?? 1);
}

export interface BuoiTho { lesson_id: string; da_mo: boolean; da_day: boolean; ngay_hoc: string | null }

/** Hành trình: buổi hoàn thành khi nộp đủ bài bắt buộc; buổi không có bài thì tính khi lớp đã học xong (da_day) — không theo ngày */
export function hanhTrinh(buoi: BuoiTho[], rows: DongBai[], now = new Date()) {
  let tong = 0, xong = 0;
  for (const b of buoi) {
    if (!b.da_mo) continue;
    tong++;
    const bai = rows.filter((r) => r.lesson_id === b.lesson_id).map((r) => tinhTrangThai(r, now));
    const batBuoc = bai.filter((k) => k.tinhVaoHoanThanh);
    if (batBuoc.length === 0) {
      if (b.da_day) xong++;
    } else if (batBuoc.every((k) => k.daNop)) xong++;
  }
  return { xong, tong, phanTram: tong === 0 ? 0 : Math.round((xong / tong) * 100) };
}

function sapTheoHan(rows: DongBai[], now: Date) {
  return rows
    .map((r) => ({ r, kq: tinhTrangThai(r, now) }))
    .filter((x) => x.kq.hanHieuLuc !== null)
    .sort((a, b) => a.kq.hanHieuLuc!.getTime() - b.kq.hanHieuLuc!.getTime());
}

export interface HuyHieu { ma: string; ten: string; moTa: string }

/** Huy hiệu cố định cho MVP */
export function tinhHuyHieu(rows: DongBai[], now = new Date()): HuyHieu[] {
  const out: HuyHieu[] = [];
  // 1. Nộp đúng hạn 5 bài liên tiếp (theo thứ tự hạn nộp, chỉ bài đã có kết luận)
  let chuoi = 0, maxChuoi = 0;
  for (const { kq } of sapTheoHan(rows.filter((r) => r.bat_buoc), now)) {
    if (kq.nhanThoiGian === "dung_han") { chuoi++; maxChuoi = Math.max(maxChuoi, chuoi); }
    else if (kq.nhanThoiGian === "tre" || kq.nhanThoiGian === "khong_nop_bai") chuoi = 0;
  }
  if (maxChuoi >= 5) out.push({ ma: "cham_chi", ten: "Học sinh chăm chỉ", moTa: "Nộp đúng hạn 5 bài liên tiếp" });

  // 2. Hoàn thành 100% một module (mọi bài bắt buộc của module đã mở và đã nộp)
  const theoModule = new Map<string, DongBai[]>();
  for (const r of rows) if (r.module_id) theoModule.set(r.module_id, [...(theoModule.get(r.module_id) ?? []), r]);
  for (const ds of theoModule.values()) {
    const bb = ds.filter((r) => r.bat_buoc && !r.mien_nop);
    if (bb.length > 0 && bb.every((r) => (r.da_mo ?? true) && r.trang_thai !== null)) {
      out.push({ ma: "xong_module", ten: "Hoàn thành module", moTa: "Hoàn thành 100% bài của một module" });
      break;
    }
  }

  // 3. Điểm cao: TB ≥ 9 với ít nhất 3 bài đã chấm
  const daCham = rows.filter((r) => r.trang_thai === "da_cham" && r.diem !== null).length;
  const tb = diemTrungBinh(rows);
  if (daCham >= 3 && tb !== null && tb >= 9) out.push({ ma: "xuat_sac", ten: "Ngôi sao Python", moTa: "Điểm trung bình từ 9 trở lên" });
  return out;
}

/** Cảnh báo sớm: bỏ 2 bài bắt buộc liên tiếp (không nộp bài) */
export function boHaiBaiLienTiep(rows: DongBai[], now = new Date()): boolean {
  let chuoi = 0;
  for (const { kq } of sapTheoHan(rows.filter((r) => r.bat_buoc), now)) {
    if (kq.nhanThoiGian === "khong_nop_bai") { chuoi++; if (chuoi >= 2) return true; }
    else if (kq.nhanThoiGian === "dung_han" || kq.nhanThoiGian === "tre") chuoi = 0;
  }
  return false;
}

export interface MucNhac { assignment_id: string; ma: string; tieu_de: string; lyDo: LyDoNhac; han: Date | null }

/** Các bài của 1 học sinh cần nhắc phụ huynh (gom theo học sinh: một bạn thiếu nhiều bài = một tin) */
export function mucCanNhac(rows: DongBai[], now = new Date()): MucNhac[] {
  const out: MucNhac[] = [];
  for (const r of rows) {
    const kq: KetQuaTrangThai = tinhTrangThai(r, now);
    if (!kq.canNhac) continue;
    out.push({
      assignment_id: r.assignment_id, ma: r.ma, tieu_de: r.tieu_de, lyDo: kq.canNhac,
      han: kq.canNhac === "chua_lam_duoc" ? (r.han_nop_lai ? new Date(r.han_nop_lai) : null) : kq.hanHieuLuc,
    });
  }
  return out;
}

/** Điền mẫu tin nhắn: {ten_hs} {danh_sach_bai} {han_nop} {lop} */
export function dienMauTin(mau: string, bien: { ten_hs: string; lop: string; muc: MucNhac[] }): string {
  const ds = bien.muc.map((m) => `Bài tập ${m.ma}: ${m.tieu_de}`).join("; ");
  const hanSom = bien.muc.map((m) => m.han).filter((h): h is Date => !!h).sort((a, b) => a.getTime() - b.getTime())[0];
  return mau
    .replaceAll("{ten_hs}", bien.ten_hs)
    .replaceAll("{lop}", bien.lop)
    .replaceAll("{danh_sach_bai}", ds || "(không có)")
    .replaceAll("{han_nop}", hanSom ? fmtDate(hanSom) : "sớm nhất có thể");
}

// ---------- SỐ LIỆU THỐNG NHẤT BÊN HỌC SINH ----------
// Mọi trang học sinh hiển thị CÙNG hai con số: "Buổi học x/y" và "Bài tập a/b" (không dùng % riêng lẻ).
export function soLieuHs(buoi: BuoiTho[], rows: DongBai[], now = new Date()) {
  const b = hanhTrinh(buoi, rows, now);
  const t = phanTramHoanThanh(rows, now);
  return { buoi: { xong: b.xong, tong: b.tong }, bai: { xong: t.daNop, tong: t.tong } };
}

export type KieuViec = "dang_hoc" | "nop_lai" | "qua_han" | "sap_han";
export interface ViecCanLam { kieu: KieuViec; tieuDe: string; href: string; han: Date | null }

/**
 * "Hôm nay em cần làm": buổi lớp đang học (buổi mở đầu tiên chưa học xong), bài cần nộp lại, bài quá hạn (bắt buộc, chưa nộp),
 * bài còn hạn trong 3 ngày tới. Thứ tự ưu tiên như trên; tối đa `toiDa` mục.
 */
export function viecCanLam(
  buoi: (BuoiTho & { tieu_de?: string; ten?: string })[],
  rows: (DongBai & { loai_nop?: string })[],
  now = new Date(),
  toiDa = 5,
): ViecCanLam[] {
  const out: ViecCanLam[] = [];
  const dang = buoi.find((b) => b.da_mo && !b.da_day);
  if (dang) out.push({ kieu: "dang_hoc", tieuDe: dang.ten ?? dang.tieu_de ?? "Buổi đang học", href: `/buoi-hoc/${dang.lesson_id}`, han: null });
  const nhom: Record<Exclude<KieuViec, "dang_hoc">, ViecCanLam[]> = { nop_lai: [], qua_han: [], sap_han: [] };
  for (const r of rows) {
    if (r.mien_nop || r.loai_nop === "ngoai_he_thong" || r.da_mo === false) continue;
    const k = tinhTrangThai(r, now);
    const ten = r.ma ? `${r.ma}. ${r.tieu_de}` : r.tieu_de;
    const href = `/bai-tap/${r.assignment_id}/lam-bai`;
    if (k.trangThai === "can_nop_lai") nhom.nop_lai.push({ kieu: "nop_lai", tieuDe: ten, href, han: toDateHan(r.han_nop_lai) ?? k.hanHieuLuc });
    else if (k.quaHanChuaNop && r.bat_buoc) nhom.qua_han.push({ kieu: "qua_han", tieuDe: ten, href, han: k.hanHieuLuc });
    else if (k.chuaDenHan && k.hanHieuLuc && k.hanHieuLuc.getTime() - now.getTime() <= 3 * 864e5) nhom.sap_han.push({ kieu: "sap_han", tieuDe: ten, href, han: k.hanHieuLuc });
  }
  const theoHan = (a: ViecCanLam, b: ViecCanLam) => (a.han?.getTime() ?? Infinity) - (b.han?.getTime() ?? Infinity);
  out.push(...nhom.nop_lai.sort(theoHan), ...nhom.qua_han.sort(theoHan), ...nhom.sap_han.sort(theoHan));
  return out.slice(0, toiDa);
}

function toDateHan(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
