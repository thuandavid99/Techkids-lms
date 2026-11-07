// =====================================================================
// TRẠNG THÁI BÀI NỘP — một nguồn duy nhất cho toàn hệ thống (spec mục 5.1, 5.2, 5.6).
// Đầu vào là dòng thô từ view v_bai_hoc_sinh. Có kiểm thử: tests/status.test.ts
// =====================================================================
import { toDate, vnDateKey } from "./time";

export type TrangThaiGoc = "da_nop" | "da_cham" | "can_nop_lai" | "nop_ngoai_he_thong";
export type TrangThaiCham = "chua_nop" | TrangThaiGoc | "mien_nop";
export type NhanThoiGian = "dung_han" | "tre" | "chua_nop" | "khong_nop_bai";
export type LyDoNhac = "chua_lam_bai" | "chua_lam_duoc";

/** Dữ liệu tối thiểu để tính trạng thái của 1 học sinh với 1 bài tập */
export interface DongBaiTho {
  han_lop: string | null;          // hạn nộp của lớp
  han_nop_rieng: string | null;    // gia hạn riêng cho học sinh
  mien_nop: boolean;
  bat_buoc: boolean;
  trang_thai: TrangThaiGoc | null; // null = chưa có bài nộp
  nop_luc_dau: string | null;
  han_nop_lai: string | null;
  da_mo?: boolean;                 // buổi/bài đã mở cho học sinh
  chua_lam_duoc?: boolean;         // cờ "Em chưa làm được" đang bật
}

export interface KetQuaTrangThai {
  hanHieuLuc: Date | null;
  trangThai: TrangThaiCham;
  nhanThoiGian: NhanThoiGian | null; // null khi miễn nộp / nộp ngoài hệ thống
  daNop: boolean;                    // đã có bài (kể cả ngoài hệ thống)
  quaHanChuaNop: boolean;
  chuaDenHan: boolean;
  denHanHomNay: boolean;
  tinhVaoHoanThanh: boolean;         // có tính vào mẫu số % hoàn thành
  canNhac: LyDoNhac | null;          // lý do vào danh sách nhắc phụ huynh
  coChuaLamDuoc: boolean;
}

export function tinhTrangThai(r: DongBaiTho, now: Date = new Date()): KetQuaTrangThai {
  const han = toDate(r.han_nop_rieng) ?? toDate(r.han_lop);
  const coBai = r.trang_thai !== null;
  const mien = r.mien_nop;
  const ngoai = r.trang_thai === "nop_ngoai_he_thong";

  const trangThai: TrangThaiCham = mien ? "mien_nop" : coBai ? (r.trang_thai as TrangThaiGoc) : "chua_nop";
  const quaHan = han !== null && now.getTime() > han.getTime();

  let nhan: NhanThoiGian | null;
  if (mien || ngoai) nhan = null;
  else if (coBai && r.nop_luc_dau) {
    // Xét theo giờ nộp LẦN ĐẦU; nộp lại sau đó không đổi nhãn
    const dau = toDate(r.nop_luc_dau)!;
    nhan = han === null || dau.getTime() <= han.getTime() ? "dung_han" : "tre";
  } else if (coBai) nhan = "dung_han"; // có bài nhưng thiếu giờ (dữ liệu cũ) → coi như đúng hạn
  else if (quaHan && r.bat_buoc) nhan = "khong_nop_bai";
  else nhan = "chua_nop";

  const quaHanChuaNop = !coBai && !mien && quaHan;
  const chuaDenHan = !coBai && !mien && !quaHan;
  const denHanHomNay = !coBai && !mien && han !== null && !quaHan && vnDateKey(han) === vnDateKey(now);

  let canNhac: LyDoNhac | null = null;
  if (r.bat_buoc && !mien && !ngoai && (r.da_mo ?? true)) {
    if (quaHanChuaNop) canNhac = "chua_lam_bai";
    else if (r.trang_thai === "can_nop_lai") {
      const hanLai = toDate(r.han_nop_lai);
      if (hanLai && now.getTime() > hanLai.getTime()) canNhac = "chua_lam_duoc";
    }
  }

  return {
    hanHieuLuc: han,
    trangThai,
    nhanThoiGian: nhan,
    daNop: coBai,
    quaHanChuaNop,
    chuaDenHan,
    denHanHomNay,
    tinhVaoHoanThanh: r.bat_buoc && !mien && (r.da_mo ?? true),
    canNhac,
    coChuaLamDuoc: !!r.chua_lam_duoc && trangThai !== "da_cham",
  };
}

// ---------- NHÃN HIỂN THỊ (12.3) ----------
export type MauPill = "green" | "blue" | "orange" | "orangeStrong" | "yellow" | "red" | "gray" | "purple";

export const NHAN_CHAM: Record<TrangThaiCham, { text: string; mau: MauPill; icon: string }> = {
  chua_nop: { text: "Chưa nộp", mau: "gray", icon: "circle" },
  da_nop: { text: "Đã nộp – chờ chấm", mau: "blue", icon: "hourglass" },
  da_cham: { text: "Đã chấm", mau: "green", icon: "check" },
  can_nop_lai: { text: "Cần nộp lại", mau: "orangeStrong", icon: "rotate" },
  nop_ngoai_he_thong: { text: "Đã nộp (ngoài hệ thống)", mau: "green", icon: "file" },
  mien_nop: { text: "Miễn nộp", mau: "gray", icon: "minus" },
};

export const NHAN_THOI_GIAN: Record<NhanThoiGian, { text: string; mau: MauPill; icon: string }> = {
  dung_han: { text: "Đúng hạn", mau: "green", icon: "check" },
  tre: { text: "Trễ", mau: "yellow", icon: "alarm" },
  chua_nop: { text: "Chưa nộp", mau: "gray", icon: "circle" },
  khong_nop_bai: { text: "Không nộp bài", mau: "red", icon: "x" },
};

/** Ô ma trận tiến độ: luôn kèm biểu tượng, không chỉ dựa vào màu */
export type KieuO = "da_cham" | "cho_cham" | "canh_bao" | "khong_nop" | "trung_tinh";
export function oMaTran(kq: KetQuaTrangThai, daMo: boolean): { kieu: KieuO; moTa: string } {
  if (!daMo) return { kieu: "trung_tinh", moTa: "Chưa học" };
  switch (kq.trangThai) {
    case "mien_nop": return { kieu: "trung_tinh", moTa: "Miễn nộp" };
    case "da_cham": return { kieu: "da_cham", moTa: kq.nhanThoiGian === "tre" ? "Đã chấm (nộp trễ)" : "Đã chấm" };
    case "nop_ngoai_he_thong": return { kieu: "da_cham", moTa: "Đã nộp (ngoài hệ thống)" };
    case "can_nop_lai": return { kieu: "canh_bao", moTa: "Cần nộp lại" };
    case "da_nop": return kq.nhanThoiGian === "tre"
      ? { kieu: "canh_bao", moTa: "Nộp trễ – chờ chấm" }
      : { kieu: "cho_cham", moTa: "Đã nộp – chờ chấm" };
    default:
      if (kq.nhanThoiGian === "khong_nop_bai") return { kieu: "khong_nop", moTa: "Không nộp bài" };
      return { kieu: "trung_tinh", moTa: kq.quaHanChuaNop ? "Chưa nộp (bài tùy chọn)" : "Chưa đến hạn" };
  }
}
