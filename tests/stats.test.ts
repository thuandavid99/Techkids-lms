import { describe, it, expect } from "vitest";
import { phanTramHoanThanh, diemTrungBinh, hanhTrinh, tinhHuyHieu, boHaiBaiLienTiep, mucCanNhac, dienMauTin, lamTron, type DongBai } from "@/lib/domain/stats";

const NOW = new Date("2026-11-20T00:00:00Z");
let n = 0;
const bai = (x: Partial<DongBai> = {}): DongBai => {
  n++;
  return {
    assignment_id: `a${n}`, lesson_id: x.lesson_id ?? `l${n}`, ma: `${n}.1`, tieu_de: `Bài ${n}`,
    han_lop: new Date(Date.UTC(2026, 9, 1) + n * 3600_000).toISOString(), han_nop_rieng: null, mien_nop: false, bat_buoc: true,
    trang_thai: null, nop_luc_dau: null, han_nop_lai: null, da_mo: true,
    diem: null, diem_toi_da: 10, he_so: 1, hoc_ky: 1, tinh_diem: true, ...x,
  };
};

describe("% hoàn thành (9.4)", () => {
  it("chỉ tính bài bắt buộc đã mở, bỏ miễn nộp và tùy chọn", () => {
    const rows = [
      bai({ trang_thai: "da_nop", nop_luc_dau: "2026-11-01T00:00:00Z" }),
      bai({ trang_thai: "da_cham", nop_luc_dau: "2026-11-01T00:00:00Z", diem: 9 }),
      bai(), // chưa nộp
      bai({ bat_buoc: false }), // tùy chọn: không tính
      bai({ mien_nop: true }),  // miễn: không tính
      bai({ da_mo: false }),    // chưa mở: không tính
    ];
    expect(phanTramHoanThanh(rows, NOW)).toEqual({ daNop: 2, tong: 3, phanTram: 67 });
  });
  it("không có bài → 0%", () => expect(phanTramHoanThanh([], NOW).phanTram).toBe(0));
});

describe("Điểm TB có hệ số (9.5)", () => {
  it("Σ(điểm × hệ số) / Σ hệ số, làm tròn 1 chữ số", () => {
    const rows = [
      bai({ trang_thai: "da_cham", diem: 8, he_so: 1 }),
      bai({ trang_thai: "da_cham", diem: 9, he_so: 2 }),
      bai({ trang_thai: "da_cham", diem: 7, he_so: 3 }),
    ];
    // (8 + 18 + 21) / 6 = 7.833 → 7.8
    expect(diemTrungBinh(rows)).toBe(7.8);
  });
  it("bỏ bài chưa chấm, miễn nộp, không tính điểm; quy điểm về thang 10", () => {
    const rows = [
      bai({ trang_thai: "da_cham", diem: 15, diem_toi_da: 20 }), // = 7.5
      bai({ trang_thai: "da_nop", diem: null }),
      bai({ trang_thai: "da_cham", diem: 2, mien_nop: true }),
      bai({ trang_thai: "da_cham", diem: 1, tinh_diem: false }),
      bai({ trang_thai: "nop_ngoai_he_thong", diem: 9.5 }),
    ];
    expect(diemTrungBinh(rows)).toBe(8.5);
  });
  it("lọc theo học kỳ; chưa có điểm → null", () => {
    const rows = [bai({ trang_thai: "da_cham", diem: 10, hoc_ky: 2 }), bai({ trang_thai: "da_cham", diem: 4, hoc_ky: 1 })];
    expect(diemTrungBinh(rows, { hocKy: 2 })).toBe(10);
    expect(diemTrungBinh([bai()])).toBeNull();
  });
  it("làm tròn nửa lên", () => { expect(lamTron(8.25, 1)).toBe(8.3); expect(lamTron(8.249, 1)).toBe(8.2); });
});

describe("Hành trình học tập", () => {
  it("buổi xong khi nộp đủ bài bắt buộc; buổi không có bài xong khi đã dạy", () => {
    const rows = [
      bai({ lesson_id: "B1", trang_thai: "da_nop", nop_luc_dau: "2026-11-01T00:00:00Z" }),
      bai({ lesson_id: "B1", bat_buoc: false }),
      bai({ lesson_id: "B2" }),
    ];
    const buoi = [
      { lesson_id: "B1", da_mo: true, da_day: true, ngay_hoc: "2026-11-01" },
      { lesson_id: "B2", da_mo: true, da_day: true, ngay_hoc: "2026-11-03" },
      { lesson_id: "B3", da_mo: true, da_day: true, ngay_hoc: "2026-11-05" }, // không có bài
      { lesson_id: "B4", da_mo: false, da_day: false, ngay_hoc: "2026-12-01" },
    ];
    expect(hanhTrinh(buoi, rows, NOW)).toEqual({ xong: 2, tong: 3, phanTram: 67 });
  });
});

describe("Huy hiệu & cảnh báo sớm", () => {
  it("5 bài đúng hạn liên tiếp → Học sinh chăm chỉ", () => {
    const rows = Array.from({ length: 5 }, () => bai({ trang_thai: "da_nop", nop_luc_dau: "2026-10-01T00:00:00Z" }));
    expect(tinhHuyHieu(rows, NOW).map((h) => h.ma)).toContain("cham_chi");
  });
  it("bỏ 2 bài liên tiếp → cảnh báo; xen kẽ có nộp → không", () => {
    expect(boHaiBaiLienTiep([bai(), bai()], NOW)).toBe(true);
    expect(boHaiBaiLienTiep([bai(), bai({ trang_thai: "da_nop", nop_luc_dau: "2026-10-01T00:00:00Z" }), bai()], NOW)).toBe(false);
  });
});

describe("Danh sách nhắc phụ huynh + mẫu tin", () => {
  it("gom các bài cần nhắc của một học sinh và điền mẫu", () => {
    const rows = [
      bai({ ma: "3.1", tieu_de: "Chẵn lẻ" }),
      bai({ ma: "4.1", tieu_de: "Vòng lặp", trang_thai: "can_nop_lai", nop_luc_dau: "2026-10-01T00:00:00Z", han_nop_lai: "2026-11-10T14:00:00Z" }),
      bai({ ma: "5.1", tieu_de: "Không bắt buộc", bat_buoc: false }),
    ];
    const muc = mucCanNhac(rows, NOW);
    expect(muc.map((m) => m.lyDo)).toEqual(["chua_lam_bai", "chua_lam_duoc"]);
    const tin = dienMauTin("Em {ten_hs} lớp {lop} chưa xong: {danh_sach_bai}. Hạn {han_nop}.", { ten_hs: "Nguyễn An", lop: "6A1", muc });
    expect(tin).toContain("Nguyễn An");
    expect(tin).toContain("Bài tập 3.1: Chẵn lẻ; Bài tập 4.1: Vòng lặp");
    expect(tin).not.toContain("{");
  });
});
