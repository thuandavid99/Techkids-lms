// TIẾN ĐỘ LỚP — tính theo việc thầy bấm "Xong buổi này", KHÔNG tính theo ngày học.
// Ngày học chỉ để thầy ghi lịch tham khảo (lớp chậm có thể học 1 buổi trong 2 tiết).
//   • Đã học    = buổi có da_day = true
//   • Đang học  = buổi đầu tiên (theo thứ tự chương trình) chưa da_day
//   • Chưa học  = các buổi sau đó
// Mở/khóa cho học sinh (hien_thi) là quyết định riêng của thầy cho từng buổi.

export interface BuoiMo { lesson_id: string; nhan_buoi: string; tieu_de: string; ngay_hoc: string | null; hien_thi: boolean; da_mo: boolean; ban_nhap: boolean; da_day: boolean }

/** `ds` phải theo đúng thứ tự chương trình (module → buổi), như buoiLop() trả về. Bỏ buổi bản nháp. */
export function tienDoLop<T extends BuoiMo>(ds: T[]) {
  const ds2 = ds.filter((b) => !b.ban_nhap);
  const i = ds2.findIndex((b) => !b.da_day);
  const soDaHoc = ds2.filter((b) => b.da_day).length;
  return {
    dangHoc: i >= 0 ? ds2[i] : null,               // null = đã học hết chương trình
    tiepTheo: i >= 0 ? ds2[i + 1] ?? null : null,
    buoiTruoc: [...ds2].reverse().find((b) => b.da_day) ?? null, // để "Quay lại"
    viTri: i >= 0 ? i + 1 : ds2.length,             // "Buổi 9/44" (đếm theo dòng)
    soDaHoc,
    soDaMo: ds2.filter((b) => b.da_mo).length,
    tong: ds2.length,
    chuaBatDau: soDaHoc === 0 && ds2.every((b) => !b.da_mo), // lớp mới áp dụng chương trình
  };
}

/** Phân nhóm cho trang Lịch: đã học / đang học / chưa học */
export function nhomTienDo<T extends { da_day: boolean; ban_nhap?: boolean }>(ds: T[]) {
  const i = ds.findIndex((b) => !b.da_day && !b.ban_nhap);
  return {
    daHoc: ds.filter((b) => b.da_day),
    dangHoc: i >= 0 ? ds[i] : null,
    chuaHoc: ds.filter((b, j) => !b.da_day && j !== i),
  };
}
