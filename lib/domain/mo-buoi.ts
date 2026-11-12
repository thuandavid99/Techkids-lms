// Chọn "Buổi hôm nay" và "Buổi tiếp theo" cho thẻ mở buổi của giáo viên
import { vnDateKey } from "./time";

export interface BuoiMo { lesson_id: string; nhan_buoi: string; tieu_de: string; ngay_hoc: string | null; hien_thi: boolean; da_mo: boolean; ban_nhap: boolean }

/**
 * - Có buổi học đúng ngày hôm nay → homNay = buổi đó, tiepTheo = buổi ngay sau
 * - Không có → homNay = buổi ngay TRƯỚC buổi chưa mở đầu tiên ("buổi đang học", thường đang mở),
 *   tiepTheo = buổi chưa mở đầu tiên. Gạt mở buổi tiếp theo thì lần sau thẻ tự dịch sang 1 buổi.
 * `ds` phải theo đúng thứ tự chương trình (module → buổi), như buoiLop() trả về.
 */
export function chonBuoiMo<T extends BuoiMo>(ds: T[], now: Date = new Date()) {
  const ds2 = ds.filter((b) => !b.ban_nhap);
  const homNayKey = vnDateKey(now);
  const iNgay = ds2.findIndex((b) => b.ngay_hoc === homNayKey);
  const coLichHomNay = iNgay >= 0;
  let i: number, j: number;
  if (coLichHomNay) { i = iNgay; j = iNgay + 1; }
  else {
    const k = ds2.findIndex((b) => !b.da_mo);
    if (k < 0) { i = -1; j = -1; }            // đã mở hết
    else if (k === 0) { i = 0; j = 1; }        // chưa mở buổi nào
    else { i = k - 1; j = k; }
  }
  return {
    homNay: i >= 0 ? ds2[i] ?? null : null,
    coLichHomNay,
    tiepTheo: j >= 0 ? ds2[j] ?? null : null,
    soDaMo: ds2.filter((b) => b.da_mo).length,
    tong: ds2.length,
  };
}
