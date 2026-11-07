// Trạng thái một BUỔI học đối với học sinh (pill ở danh sách buổi học / trang chủ)
import { tinhTrangThai, type DongBaiTho, type MauPill } from "./status";
import { vnDateKey } from "./time";

/** Bài cần làm gần nhất: chưa nộp (hoặc cần nộp lại), không miễn, nộp trên web; hạn sớm nhất trước */
export function baiCanLamGanNhat<T extends DongBaiTho & { loai_nop: string }>(rows: T[], now: Date = new Date()): T | null {
  const ung = rows
    .map((r) => ({ r, k: tinhTrangThai(r, now) }))
    .filter(({ r, k }) => r.loai_nop !== "ngoai_he_thong" && !r.mien_nop && (!k.daNop || k.trangThai === "can_nop_lai"))
    .sort((a, b) => (a.k.hanHieuLuc?.getTime() ?? Infinity) - (b.k.hanHieuLuc?.getTime() ?? Infinity));
  // Ưu tiên bài còn hạn; nếu không còn bài nào còn hạn thì lấy bài quá hạn sớm nhất
  const conHan = ung.find(({ k }) => !k.hanHieuLuc || k.hanHieuLuc.getTime() >= now.getTime());
  return (conHan ?? ung[0])?.r ?? null;
}

export interface TrangThaiBuoi { text: string; mau: MauPill; icon: string; xong: boolean }

export function trangThaiBuoi(
  buoi: { ngay_hoc: string | null; da_day: boolean },
  baiCuaBuoi: DongBaiTho[],
  now: Date = new Date(),
): TrangThaiBuoi {
  const homNay = vnDateKey(now);
  const kq = baiCuaBuoi.map((r) => tinhTrangThai(r, now)).filter((k) => k.tinhVaoHoanThanh);
  const tuongLai = buoi.ngay_hoc !== null && buoi.ngay_hoc > homNay;

  if (kq.length === 0) {
    if (buoi.da_day || (buoi.ngay_hoc !== null && !tuongLai)) return { text: "Đã hoàn thành", mau: "green", icon: "check", xong: true };
    return { text: "Chưa đến hạn", mau: "gray", icon: "calendar", xong: false };
  }
  if (kq.every((k) => k.daNop)) {
    if (kq.some((k) => k.trangThai === "can_nop_lai")) return { text: "Cần nộp lại", mau: "orangeStrong", icon: "rotate", xong: true };
    return { text: "Đã hoàn thành", mau: "green", icon: "check", xong: true };
  }
  if (kq.some((k) => k.trangThai === "can_nop_lai")) return { text: "Cần nộp lại", mau: "orangeStrong", icon: "rotate", xong: false };
  if (kq.some((k) => k.denHanHomNay)) return { text: "Đến hạn hôm nay", mau: "blue", icon: "alarm", xong: false };
  if (kq.some((k) => k.nhanThoiGian === "khong_nop_bai")) return { text: "Quá hạn", mau: "red", icon: "x", xong: false };
  if (tuongLai) return { text: "Chưa đến hạn", mau: "gray", icon: "calendar", xong: false };
  return { text: "Chưa làm", mau: "orange", icon: "fire", xong: false };
}
