import { describe, it, expect } from "vitest";
import { keyBetween, keysBetween } from "@/lib/domain/order";
import { chuanHoaNhanBuoi, soTrongNhan, tenFileTaiVe, tenBuoi, tenBaiTap } from "@/lib/domain/naming";
import { tinhNgayHoc, doiLich } from "@/lib/domain/schedule";
import { kiemTraFile } from "@/lib/domain/files";
import { taoMatKhauTam, kiemTraMatKhauMoi } from "@/lib/domain/password";
import { fromVNInput, toVNInput, fmtDateTime, fmtDate } from "@/lib/domain/time";

describe("Khóa sắp xếp (chèn giữa không đánh lại)", () => {
  it("tạo khóa giữa, đầu, cuối", () => {
    const a = keyBetween(null, null);
    const b = keyBetween(a, null);
    const c = keyBetween(null, a);
    const m = keyBetween(c, a);
    expect(c < m && m < a && a < b).toBe(true);
  });
  it("chèn giữa liên tục 200 lần vẫn đúng thứ tự", () => {
    let lo = keyBetween(null, null), hi = keyBetween(lo, null);
    for (let i = 0; i < 200; i++) { const k = keyBetween(lo, hi); expect(lo < k && k < hi).toBe(true); hi = k; }
  });
  it("khóa cũ có số 0 ở cuối (dữ liệu mẫu 'a0','a1')", () => {
    const k = keyBetween("a0", "a1");
    expect("a0" < k && k < "a1").toBe(true);
  });
  it("sinh n khóa tăng dần", () => {
    const ks = keysBetween(null, null, 50);
    expect(ks.length).toBe(50);
    expect([...ks].sort()).toEqual(ks);
    expect(new Set(ks).size).toBe(50);
  });
});

describe("Tên hiển thị", () => {
  it("nhãn buổi", () => {
    expect(chuanHoaNhanBuoi("10,11")).toBe("10–11");
    expect(chuanHoaNhanBuoi("43, 44")).toBe("43–44");
    expect(chuanHoaNhanBuoi("10 - 11")).toBe("10–11");
    expect(chuanHoaNhanBuoi("7")).toBe("7");
    expect(chuanHoaNhanBuoi(7)).toBe("7");
    expect(chuanHoaNhanBuoi("7.0")).toBe("7");
    expect(chuanHoaNhanBuoi("3,5")).toBe("3, 5");
    expect(soTrongNhan("10–11")).toEqual([10, 11]);
  });
  it("tên buổi / bài tập / file tải về", () => {
    expect(tenBuoi("7", "Cấu trúc rẽ nhánh")).toBe("Buổi 7: Cấu trúc rẽ nhánh");
    expect(tenBaiTap("7.1", "Kiểm tra số chẵn lẻ")).toBe("Bài tập 7.1: Kiểm tra số chẵn lẻ");
    expect(tenFileTaiVe("6A1", "HS001", "Nguyễn Ân", "7.1", "py")).toBe("6A1_HS001_NguyenAn_Bai7.1.py");
  });
});

describe("Lịch học", () => {
  it("điền ngày theo thứ 2 và thứ 5; buổi gộp chiếm 2 ca", () => {
    // 02/11/2026 là Thứ 2
    expect(tinhNgayHoc("2026-11-02", [1, 4], ["1", "2", "3–4", "5"])).toEqual(["2026-11-02", "2026-11-05", "2026-11-09", "2026-11-16"]);
  });
  it("dời lịch các buổi sau thêm 7 ngày", () => {
    expect(doiLich(["2026-11-02", "2026-11-05", null], 1, 7)).toEqual(["2026-11-02", "2026-11-12", null]);
  });
});

describe("Kiểm tra file thật", () => {
  const enc = new TextEncoder();
  it("nhận .py là văn bản UTF-8 (có tiếng Việt)", () => {
    const b = enc.encode('print("Xin chào")');
    expect(kiemTraFile("bai.py", b.length, b, "code").ok).toBe(true);
  });
  it("từ chối file nhị phân đổi đuôi .py", () => {
    const b = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03]);
    expect(kiemTraFile("virus.py", 5, b, "code").ok).toBe(false);
  });
  it("từ chối .exe, file quá lớn, PDF giả", () => {
    expect(kiemTraFile("a.exe", 10, new Uint8Array(10), "bai_nop_file").ok).toBe(false);
    expect(kiemTraFile("a.py", 2 * 1024 * 1024, enc.encode("x"), "code").ok).toBe(false);
    expect(kiemTraFile("a.pdf", 100, enc.encode("hello"), "tai_lieu").ok).toBe(false);
    expect(kiemTraFile("a.pdf", 100, enc.encode("%PDF-1.7"), "tai_lieu").ok).toBe(true);
    expect(kiemTraFile("a.docx", 100, new Uint8Array([0x50, 0x4b, 3, 4]), "bai_nop_file").ok).toBe(true);
  });
});

describe("Mật khẩu", () => {
  it("mật khẩu tạm ngẫu nhiên, khác nhau, không ký tự dễ nhầm", () => {
    const ds = Array.from({ length: 200 }, () => taoMatKhauTam());
    expect(new Set(ds).size).toBe(200);
    for (const m of ds) { expect(m).toHaveLength(8); expect(/[0O1lI]/.test(m)).toBe(false); expect(/[0-9]/.test(m)).toBe(true); }
  });
  it("kiểm tra mật khẩu mới", () => {
    expect(kiemTraMatKhauMoi("abc")).not.toBeNull();
    expect(kiemTraMatKhauMoi("abcdefg")).not.toBeNull();
    expect(kiemTraMatKhauMoi("python12")).toBeNull();
  });
});

describe("Giờ Việt Nam", () => {
  it("nhập 21:00 giờ VN → 14:00 UTC và ngược lại", () => {
    expect(fromVNInput("2026-10-30T21:00")).toBe("2026-10-30T14:00:00.000Z");
    expect(toVNInput("2026-10-30T14:00:00.000Z")).toBe("2026-10-30T21:00");
    expect(fmtDateTime("2026-10-28T02:45:00Z")).toBe("09:45 - 28/10/2026");
    expect(fmtDate("2026-10-30T20:00:00Z")).toBe("31/10/2026"); // 03:00 sáng hôm sau giờ VN
    expect(fmtDate("2026-10-30")).toBe("30/10/2026");
  });
});
