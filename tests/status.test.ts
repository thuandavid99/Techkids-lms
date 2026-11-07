import { describe, it, expect } from "vitest";
import { tinhTrangThai, oMaTran, type DongBaiTho } from "@/lib/domain/status";

// Mốc thời gian (UTC). Hạn nộp: 30/10 21:00 giờ VN = 30/10 14:00 UTC
const HAN = "2026-10-30T14:00:00.000Z";
const TRUOC_HAN = "2026-10-29T02:45:00.000Z";
const SAU_HAN = "2026-10-31T01:00:00.000Z";
const NOW_SAU = new Date("2026-11-02T00:00:00.000Z");
const NOW_TRUOC = new Date("2026-10-28T00:00:00.000Z");

const base = (x: Partial<DongBaiTho> = {}): DongBaiTho => ({
  han_lop: HAN, han_nop_rieng: null, mien_nop: false, bat_buoc: true,
  trang_thai: null, nop_luc_dau: null, han_nop_lai: null, da_mo: true, ...x,
});

describe("Nhãn Đúng hạn / Trễ / Không nộp bài (mục 5.6)", () => {
  it("nộp đúng hạn", () => {
    const k = tinhTrangThai(base({ trang_thai: "da_nop", nop_luc_dau: TRUOC_HAN }), NOW_SAU);
    expect(k.nhanThoiGian).toBe("dung_han");
    expect(k.trangThai).toBe("da_nop");
    expect(k.canNhac).toBeNull();
  });

  it("nộp đúng phút hạn chót vẫn là đúng hạn", () => {
    expect(tinhTrangThai(base({ trang_thai: "da_nop", nop_luc_dau: HAN }), NOW_SAU).nhanThoiGian).toBe("dung_han");
  });

  it("nộp trễ", () => {
    const k = tinhTrangThai(base({ trang_thai: "da_nop", nop_luc_dau: SAU_HAN }), NOW_SAU);
    expect(k.nhanThoiGian).toBe("tre");
    expect(k.canNhac).toBeNull(); // đã nộp thì không nhắc phụ huynh
  });

  it("nộp lại sau khi bị trễ: vẫn là Trễ (xét lần nộp đầu)", () => {
    const k = tinhTrangThai(base({ trang_thai: "da_nop", nop_luc_dau: SAU_HAN }), new Date("2026-11-20T00:00:00Z"));
    expect(k.nhanThoiGian).toBe("tre");
  });

  it("nộp đúng hạn rồi nộp lại sau hạn: vẫn Đúng hạn", () => {
    const k = tinhTrangThai(base({ trang_thai: "da_cham", nop_luc_dau: TRUOC_HAN }), NOW_SAU);
    expect(k.nhanThoiGian).toBe("dung_han");
  });

  it("chưa nộp, còn hạn → Chưa nộp (xám), chưa đến hạn", () => {
    const k = tinhTrangThai(base(), NOW_TRUOC);
    expect(k.nhanThoiGian).toBe("chua_nop");
    expect(k.chuaDenHan).toBe(true);
    expect(k.canNhac).toBeNull();
  });

  it("chưa nộp, quá hạn, bài bắt buộc → Không nộp bài + nhắc phụ huynh", () => {
    const k = tinhTrangThai(base(), NOW_SAU);
    expect(k.nhanThoiGian).toBe("khong_nop_bai");
    expect(k.quaHanChuaNop).toBe(true);
    expect(k.canNhac).toBe("chua_lam_bai");
  });

  it("bài tùy chọn quá hạn chưa nộp → chỉ Chưa nộp, không nhắc, không tính % hoàn thành", () => {
    const k = tinhTrangThai(base({ bat_buoc: false }), NOW_SAU);
    expect(k.nhanThoiGian).toBe("chua_nop");
    expect(k.canNhac).toBeNull();
    expect(k.tinhVaoHoanThanh).toBe(false);
  });

  it("miễn nộp → nhãn Miễn nộp, không xét đúng hạn/trễ, không nhắc", () => {
    const k = tinhTrangThai(base({ mien_nop: true }), NOW_SAU);
    expect(k.trangThai).toBe("mien_nop");
    expect(k.nhanThoiGian).toBeNull();
    expect(k.canNhac).toBeNull();
    expect(k.tinhVaoHoanThanh).toBe(false);
  });

  it("nộp ngoài hệ thống → không xét đúng hạn/trễ, không nhắc", () => {
    const k = tinhTrangThai(base({ trang_thai: "nop_ngoai_he_thong" }), NOW_SAU);
    expect(k.nhanThoiGian).toBeNull();
    expect(k.daNop).toBe(true);
    expect(k.canNhac).toBeNull();
  });

  it("gia hạn riêng: nộp sau hạn lớp nhưng trước hạn riêng → Đúng hạn", () => {
    const k = tinhTrangThai(base({ han_nop_rieng: "2026-11-05T14:00:00Z", trang_thai: "da_nop", nop_luc_dau: SAU_HAN }), NOW_SAU);
    expect(k.nhanThoiGian).toBe("dung_han");
  });

  it("gia hạn riêng: chưa nộp, đã qua hạn lớp nhưng còn hạn riêng → chưa nhắc", () => {
    const k = tinhTrangThai(base({ han_nop_rieng: "2026-11-05T14:00:00Z" }), NOW_SAU);
    expect(k.nhanThoiGian).toBe("chua_nop");
    expect(k.canNhac).toBeNull();
  });

  it("không có hạn nộp → không bao giờ quá hạn", () => {
    const k = tinhTrangThai(base({ han_lop: null }), NOW_SAU);
    expect(k.quaHanChuaNop).toBe(false);
    expect(k.nhanThoiGian).toBe("chua_nop");
  });
});

describe("Hạn nộp lại (mục 5.2)", () => {
  it("cần nộp lại, chưa quá hạn nộp lại → chưa nhắc", () => {
    const k = tinhTrangThai(base({ trang_thai: "can_nop_lai", nop_luc_dau: TRUOC_HAN, han_nop_lai: "2026-11-06T14:00:00Z" }), NOW_SAU);
    expect(k.canNhac).toBeNull();
    expect(k.nhanThoiGian).toBe("dung_han");
  });
  it("cần nộp lại, đã quá hạn nộp lại → nhắc 'chưa làm được'", () => {
    const k = tinhTrangThai(base({ trang_thai: "can_nop_lai", nop_luc_dau: TRUOC_HAN, han_nop_lai: "2026-11-01T14:00:00Z" }), NOW_SAU);
    expect(k.canNhac).toBe("chua_lam_duoc");
  });
  it("bài tùy chọn cần nộp lại quá hạn → không nhắc", () => {
    const k = tinhTrangThai(base({ bat_buoc: false, trang_thai: "can_nop_lai", nop_luc_dau: TRUOC_HAN, han_nop_lai: "2026-11-01T14:00:00Z" }), NOW_SAU);
    expect(k.canNhac).toBeNull();
  });
});

describe("Cờ Em chưa làm được (mục 5.8)", () => {
  it("cờ không đổi nhãn thời gian; tắt khi đã chấm", () => {
    const a = tinhTrangThai(base({ chua_lam_duoc: true }), NOW_SAU);
    expect(a.coChuaLamDuoc).toBe(true);
    expect(a.nhanThoiGian).toBe("khong_nop_bai");
    const b = tinhTrangThai(base({ chua_lam_duoc: true, trang_thai: "da_cham", nop_luc_dau: TRUOC_HAN }), NOW_SAU);
    expect(b.coChuaLamDuoc).toBe(false);
  });
});

describe("Ô ma trận", () => {
  it("chưa mở → trung tính; quá hạn → đỏ; chờ chấm; đã chấm", () => {
    expect(oMaTran(tinhTrangThai(base(), NOW_SAU), false).kieu).toBe("trung_tinh");
    expect(oMaTran(tinhTrangThai(base(), NOW_SAU), true).kieu).toBe("khong_nop");
    expect(oMaTran(tinhTrangThai(base({ trang_thai: "da_nop", nop_luc_dau: TRUOC_HAN }), NOW_SAU), true).kieu).toBe("cho_cham");
    expect(oMaTran(tinhTrangThai(base({ trang_thai: "da_nop", nop_luc_dau: SAU_HAN }), NOW_SAU), true).kieu).toBe("canh_bao");
    expect(oMaTran(tinhTrangThai(base({ trang_thai: "da_cham", nop_luc_dau: TRUOC_HAN }), NOW_SAU), true).kieu).toBe("da_cham");
  });
});
