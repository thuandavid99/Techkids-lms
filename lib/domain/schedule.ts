// Áp dụng chương trình cho lớp: tự điền ngày học theo ngày bắt đầu + các thứ học (spec 6.5)
import { addDays, isoDow } from "./time";
import { soTrongNhan } from "./naming";

/**
 * Trả về ngày học (YYYY-MM-DD) cho từng buổi theo thứ tự.
 * Buổi gộp ("10–11") chiếm nhiều ca học: ngày học = ca đầu, các ca sau bị bỏ qua.
 * @param thu  các thứ học, kiểu ISO: 1 = Thứ 2 ... 7 = Chủ nhật
 */
export function tinhNgayHoc(ngayBatDau: string, thu: number[], nhanCacBuoi: string[]): string[] {
  const tap = new Set(thu.filter((t) => t >= 1 && t <= 7));
  if (tap.size === 0) throw new Error("Chưa chọn thứ học trong tuần");
  const out: string[] = [];
  let ngay = ngayBatDau;
  const caKe = () => { while (!tap.has(isoDow(ngay))) ngay = addDays(ngay, 1); const d = ngay; ngay = addDays(ngay, 1); return d; };
  for (const nhan of nhanCacBuoi) {
    const soCa = Math.max(1, soTrongNhan(nhan).length);
    out.push(caKe());
    for (let i = 1; i < soCa; i++) caKe();
  }
  return out;
}

/** Dời lịch: cộng N ngày cho mọi buổi từ vị trí `tuViTri` trở đi */
export function doiLich(ngayHoc: (string | null)[], tuViTri: number, soNgay: number): (string | null)[] {
  return ngayHoc.map((d, i) => (i >= tuViTri && d ? addDays(d, soNgay) : d));
}
