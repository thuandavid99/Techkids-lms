import { describe, it, expect } from "vitest";
import { viecCanLam, soLieuHs, type DongBai } from "@/lib/domain/stats";

const NOW = new Date("2026-11-12T03:00:00Z"); // 10:00 giờ VN
let n = 0;
const bai = (x: Partial<DongBai> = {}): DongBai => {
  n++;
  return {
    assignment_id: `a${n}`, lesson_id: `l${n}`, ma: `${n}`, tieu_de: `Bài ${n}`,
    han_lop: null, han_nop_rieng: null, mien_nop: false, bat_buoc: true,
    trang_thai: null, nop_luc_dau: null, han_nop_lai: null, da_mo: true,
    diem: null, diem_toi_da: 10, he_so: 1, hoc_ky: 1, tinh_diem: true, ...x,
  };
};

describe("Hôm nay em cần làm", () => {
  it("ưu tiên: buổi đang học → nộp lại → quá hạn → sắp hạn (≤3 ngày)", () => {
    const rows = [
      bai({ tieu_de: "sap", han_lop: "2026-11-14T10:00:00Z" }),
      bai({ tieu_de: "xa", han_lop: "2026-11-30T10:00:00Z" }),
      bai({ tieu_de: "qua", han_lop: "2026-11-10T10:00:00Z" }),
      bai({ tieu_de: "lai", trang_thai: "can_nop_lai", nop_luc_dau: "2026-11-01T00:00:00Z" }),
      bai({ tieu_de: "mien", mien_nop: true, han_lop: "2026-11-10T10:00:00Z" }),
      bai({ tieu_de: "khoa", da_mo: false, han_lop: "2026-11-13T10:00:00Z" }),
      bai({ tieu_de: "xong", trang_thai: "da_nop", nop_luc_dau: "2026-11-11T00:00:00Z", han_lop: "2026-11-13T10:00:00Z" }),
    ];
    const buoi = [{ lesson_id: "L0", da_mo: true, da_day: true, ngay_hoc: null }, { lesson_id: "L1", da_mo: true, da_day: false, ngay_hoc: "2026-10-01", ten: "Buổi 8" }, { lesson_id: "L2", da_mo: true, da_day: false, ngay_hoc: null }];
    const v = viecCanLam(buoi, rows, NOW);
    expect(v.map((x) => x.kieu)).toEqual(["dang_hoc", "nop_lai", "qua_han", "sap_han"]);
    expect(v[0].href).toBe("/buoi-hoc/L1");
    expect(v[3].tieuDe).toContain("sap");
  });
  it("không có việc → mảng rỗng", () => expect(viecCanLam([], [], NOW)).toEqual([]));
});

describe("Số liệu thống nhất", () => {
  it("trả về buổi x/y và bài a/b", () => {
    const rows = [bai({ trang_thai: "da_nop", nop_luc_dau: "2026-11-01T00:00:00Z", lesson_id: "L1" }), bai({ lesson_id: "L2" })];
    const s = soLieuHs([{ lesson_id: "L1", da_mo: true, da_day: false, ngay_hoc: null }, { lesson_id: "L2", da_mo: true, da_day: false, ngay_hoc: null }], rows, NOW);
    expect(s).toEqual({ buoi: { xong: 1, tong: 2 }, bai: { xong: 1, tong: 2 } });
  });
});
