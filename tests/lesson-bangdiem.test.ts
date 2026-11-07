import { describe, it, expect } from "vitest";
import { trangThaiBuoi, baiCanLamGanNhat } from "@/lib/domain/lesson-status";
import { lapBangDiem } from "@/lib/domain/bang-diem";
import type { DongBai } from "@/lib/domain/stats";

const NOW = new Date("2026-11-10T03:00:00Z"); // 10:00 sáng 10/11 giờ VN
const r = (x: Partial<DongBai & { loai_nop: string; student_id: string; ma_hs: string; ho_ten: string }> = {}) => ({
  assignment_id: "a", lesson_id: "l", ma: "1.1", tieu_de: "B", han_lop: "2026-11-12T14:00:00Z", han_nop_rieng: null, mien_nop: false, bat_buoc: true,
  trang_thai: null, nop_luc_dau: null, han_nop_lai: null, da_mo: true, diem: null, diem_toi_da: 10, he_so: 1, hoc_ky: 1, tinh_diem: true,
  loai_nop: "code", student_id: "s1", ma_hs: "HS001", ho_ten: "An", module_id: "m1", ...x,
}) as DongBai & { loai_nop: string; student_id: string; ma_hs: string; ho_ten: string };

describe("Trạng thái buổi (danh sách buổi học)", () => {
  it("đã nộp đủ → Đã hoàn thành; chưa nộp → Chưa làm", () => {
    expect(trangThaiBuoi({ ngay_hoc: "2026-11-09", da_day: true }, [r({ trang_thai: "da_nop", nop_luc_dau: "2026-11-09T00:00:00Z" })], NOW).text).toBe("Đã hoàn thành");
    expect(trangThaiBuoi({ ngay_hoc: "2026-11-09", da_day: true }, [r()], NOW).text).toBe("Chưa làm");
  });
  it("hạn hôm nay → Đến hạn hôm nay; quá hạn → Quá hạn; ngày học tương lai → Chưa đến hạn", () => {
    expect(trangThaiBuoi({ ngay_hoc: "2026-11-09", da_day: true }, [r({ han_lop: "2026-11-10T14:00:00Z" })], NOW).text).toBe("Đến hạn hôm nay");
    expect(trangThaiBuoi({ ngay_hoc: "2026-11-01", da_day: true }, [r({ han_lop: "2026-11-05T14:00:00Z" })], NOW).text).toBe("Quá hạn");
    expect(trangThaiBuoi({ ngay_hoc: "2026-11-20", da_day: false }, [r({ han_lop: "2026-11-25T14:00:00Z" })], NOW).text).toBe("Chưa đến hạn");
  });
  it("buổi không có bài: đã dạy → hoàn thành", () => {
    expect(trangThaiBuoi({ ngay_hoc: "2026-11-01", da_day: true }, [], NOW).xong).toBe(true);
    expect(trangThaiBuoi({ ngay_hoc: "2026-11-30", da_day: false }, [], NOW).xong).toBe(false);
  });
  it("bài cần làm gần nhất: ưu tiên bài còn hạn sớm nhất, bỏ bài ngoài hệ thống", () => {
    const ds = [r({ assignment_id: "x", han_lop: "2026-11-20T14:00:00Z" }), r({ assignment_id: "y", han_lop: "2026-11-11T14:00:00Z" }), r({ assignment_id: "z", han_lop: "2026-11-10T20:00:00Z", loai_nop: "ngoai_he_thong" })];
    expect(baiCanLamGanNhat(ds, NOW)?.assignment_id).toBe("y");
  });
});

describe("Bảng điểm học kỳ", () => {
  it("cột theo bài, TB module và TB học kỳ có hệ số; miễn nộp ghi 'Miễn'", () => {
    const rows = [
      r({ assignment_id: "a1", ma: "1.1", trang_thai: "da_cham", diem: 8, module_id: "m1" }),
      r({ assignment_id: "a2", ma: "2.1", trang_thai: "da_cham", diem: 10, he_so: 2, module_id: "m2" }),
      r({ assignment_id: "a3", ma: "2.2", mien_nop: true, module_id: "m2" }),
      r({ assignment_id: "a4", ma: "9.1", hoc_ky: 2, trang_thai: "da_cham", diem: 1 }),
    ];
    const bd = lapBangDiem(rows, [{ id: "m1", ten: "Module 1" }, { id: "m2", ten: "Module 2" }], 1);
    expect(bd.cot.map((c) => c.ma)).toEqual(["1.1", "2.1", "2.2"]);
    expect(bd.hs[0].diem).toEqual({ a1: "8", a2: "10", a3: "Miễn" });
    expect(bd.hs[0].tbModule).toEqual({ m1: 8, m2: 10 });
    expect(bd.hs[0].tb).toBe(9.3); // (8 + 20) / 3
  });
});
