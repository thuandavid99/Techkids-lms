import { describe, it, expect } from "vitest";
import { phanTichPPCT, doanGhepCot, doanGhepCotDayDu, timDongTieuDe, type DongExcel, type LoaiBuoiNhanDien } from "@/lib/domain/ppct";

const LOAI: LoaiBuoiNhanDien[] = [
  { id: "lt", ten: "Lý thuyết", tu_khoa: "lý thuyết", noi_bat: false },
  { id: "bt", ten: "Bài tập", tu_khoa: "bài tập,luyện tập", noi_bat: false },
  { id: "ot", ten: "Ôn tập", tu_khoa: "ôn tập", noi_bat: false },
  { id: "kt", ten: "Kiểm tra", tu_khoa: "kiểm tra,đánh giá", noi_bat: true },
  { id: "ct", ten: "Contest", tu_khoa: "contest", noi_bat: true },
  { id: "cs", ten: "Case study", tu_khoa: "case study", noi_bat: false },
];

let dongSo = 0;
const d = (o: string[], link: (string | null)[] = [], toMau = false): DongExcel => ({ dong: ++dongSo, o, link, toMau });

// Bảng giống PPCT của thầy: Buổi | Bài | Nội dung | Tài liệu lý thuyết
const BANG: DongExcel[] = [
  d(["PHÂN PHỐI CHƯƠNG TRÌNH PYTHON", "", "", ""]),
  d(["Buổi", "Bài", "Nội dung", "Tài liệu lý thuyết"]),
  d(["1", "Làm quen với Python", "Cài đặt, print()", "Slide 1"], [null, null, null, "https://drive.google.com/file/d/abc"]),
  d(["2", "Biến và kiểu dữ liệu", "int, float, str", "Slide 2"], [null, null, null, "https://drive.google.com/file/d/def"]),
  d(["3", "Biến và kiểu dữ liệu", "Bài tập luyện tập", ""]),
  d(["4", "Kiểm tra module 1", "Đánh giá", ""], [], true),
  d(["5", "Cấu trúc rẽ nhánh", "if", ""]),
  d(["6", "Cấu trúc rẽ nhánh", "if-else", ""]),
  d(["7", "Cấu trúc rẽ nhánh", "if-elif-else", ""]),
  d(["8,9", "Ôn tập module 2", "", "Xem tại https://example.com/on-tap"]),
  d(["", "", "", ""]),
  d(["10", "Contest module 2", "Thi trên hệ thống chấm", ""], [], true),
  d(["11", "", "", ""]),
  d(["13", "", "Case study", ""]),
  d(["13", "Dự án nhỏ", "Case study", "link hỏng"], [null, null, null, "javascript:alert(1)"]),
];

describe("Nhập PPCT từ Excel (mục 6.4)", () => {
  const hd = timDongTieuDe(BANG);
  const ghep = doanGhepCot(BANG[hd].o);
  const kq = phanTichPPCT(BANG, ghep, LOAI, { batDauTuDong: hd + 1, macDinhLoaiId: "lt" });

  it("tìm dòng tiêu đề và đoán cột", () => {
    expect(hd).toBe(1);
    expect(ghep).toMatchObject({ buoi: 0, bai: 1, noiDung: 2, taiLieu: 3 });
  });

  it("chia module theo dòng 'Kiểm tra module' / tô màu", () => {
    expect(kq.modules.map((m) => m.buoi.length)).toEqual([4, 5, 3]);
    expect(kq.modules[0].buoi[3].loaiId).toBe("kt");
    expect(kq.modules[0].buoi[3].noiBat).toBe(true);
  });

  it("nhãn '8,9' → '8–9' và loại Ôn tập; Contest nổi bật", () => {
    const b = kq.modules[1].buoi.find((x) => x.nhanBuoi === "8–9")!;
    expect(b).toBeTruthy();
    expect(b.loaiId).toBe("ot");
    expect(kq.modules[1].buoi.at(-1)!.loaiId).toBe("ct");
  });

  it("gom chủ đề cho các dòng liên tiếp cùng tên bài", () => {
    const m2 = kq.modules[1].buoi;
    expect(m2.slice(0, 3).every((b) => b.chuDe === "Cấu trúc rẽ nhánh")).toBe(true);
    expect(kq.modules[0].buoi[1].chuDe).toBe("Biến và kiểu dữ liệu");
    expect(kq.modules[0].buoi[0].chuDe).toBeNull();
  });

  it("hyperlink trong ô và link trong chữ → tài liệu dạng link", () => {
    expect(kq.modules[0].buoi[0].taiLieu).toEqual([{ tieuDe: "Slide 1", url: "https://drive.google.com/file/d/abc", vaiTro: "tai_lieu" }]);
    expect(kq.modules[1].buoi[3].taiLieu[0].url).toBe("https://example.com/on-tap");
  });

  it("cảnh báo: trùng buổi, thiếu tên, nhảy số, link hỏng (không từ chối)", () => {
    const text = kq.canhBao.map((c) => c.noiDung).join("\n");
    expect(text).toMatch(/Buổi 13 bị trùng/);
    expect(text).toMatch(/thiếu tên bài/);
    expect(text).toMatch(/Thiếu buổi 12/);
    expect(text).toMatch(/Link không hợp lệ/);
    expect(kq.tongBuoi).toBe(12);
  });
});

// Bảng giống file "Phân phối chương trình Python" thật của thầy (12/11/2026):
// cột "Tài liệu lý thuyết" thực ra ghi LOẠI buổi; số buổi có chỗ gõ "10.11", có chỗ đánh trùng/lệch;
// cả bảng tô nền cam nhạt, chỉ dòng Kiểm tra tô cam đậm; link Quiz / phiếu bài tập ở các cột riêng.
describe("PPCT thật: đoán cột theo dữ liệu, đánh số lại, màu hiếm, link quiz/phiếu", () => {
  let n = 0;
  const NHAT = "FFFCE5CD", DAM = "FFFF9900";
  const r = (o: string[], link: (string | null)[] = [], mau: string[] = [NHAT]): DongExcel => ({ dong: ++n, o, link, toMau: true, mau });
  const LOAI2: LoaiBuoiNhanDien[] = [...LOAI, { id: "ltth", ten: "Lý thuyết + thực hành", tu_khoa: "thực hành", noi_bat: false }];
  const RO = [
    r(["", "Phần", "Buổi", "Bài", "Nội dung", "Tài liệu lý thuyết", "Quizzi", "Bài tập", "Tham khảo"], [], []),
    r(["", "", "1", "1. Hello word", "- Giới thiệu", "Lý thuyết", "https://quizizz.com/admin/quiz/1", "https://docs.google.com/d/1"], [null, null, null, null, null, null, "https://quizizz.com/admin/quiz/1", "https://docs.google.com/d/1"]),
    r(["", "", "2", "Biến", "- Khái niệm biến", "Lý thuyết", "", "Phieu_hoc_tap_Bien.docx"], [null, null, null, null, null, null, null, "https://docs.google.com/d/2"]),
    r(["", "", "3", "Rẽ nhánh", "Bài tập", "Bài tập", "", ""]),
    r(["", "", "10.11", "Ôn tập module 1", "", "Bài tập", "", ""]),
    r(["", "", "12", "Kiểm tra module 1", "", "", "", ""], [], [DAM]),
    r(["", "", "13", "Vòng lặp for", "", "Lý thuyết + thực hành", "", ""]),
    r(["", "", "13", "Vòng lặp while", "", "Lý thuyết", "", ""]),
    r(["", "", "43, 44", "CaseStudy", "", "Casestudy", "", ""]),
    r(["", "", "40", "Contest Tổng kết khoá học", "Kiểm tra đánh giá tổng hợp", "", "", ""], [], [DAM]),
  ];
  const hd = timDongTieuDe(RO);
  const ghep = doanGhepCotDayDu(RO, hd, LOAI2);
  const chay = (danhSoLai: boolean) => phanTichPPCT(RO, ghep, LOAI2, { batDauTuDong: hd + 1, macDinhLoaiId: "lt", danhSoLai, tieuDeCot: RO[hd].o });

  it("cột 'Tài liệu lý thuyết' chứa tên loại buổi → nhận là cột Loại", () => {
    expect(ghep).toEqual({ buoi: 2, bai: 3, noiDung: 4, taiLieu: -1, loai: 5 });
  });
  it("10.11 → 10–11; bỏ số thứ tự đầu tên bài; Casestudy ≈ Case study", () => {
    const b = chay(false).modules.flatMap((m) => m.buoi);
    expect(b[3].nhanBuoi).toBe("10–11");
    expect(b[0].tieuDe).toBe("Hello word");
    expect(b[7].loaiTen).toBe("Case study");
    expect(b[8].loaiTen).toBe("Contest"); // từ khóa trong TÊN BÀI được ưu tiên hơn nội dung
  });
  it("màu cam đậm hiếm → ranh giới module; cam nhạt cả bảng bị bỏ qua", () => {
    const kq = chay(false);
    expect(kq.modules.map((m) => m.buoi.length)).toEqual([5, 4]);
    expect(kq.modules[0].buoi[4].noiBat).toBe(true);
    expect(kq.modules[0].buoi[0].noiBat).toBe(false);
  });
  it("phát hiện số buổi lệch; đánh số lại theo thứ tự dòng, buổi gộp chiếm 2 số", () => {
    expect(chay(false).lechSo).toBe(true);
    const b = chay(true).modules.flatMap((m) => m.buoi);
    expect(b.map((x) => x.nhanBuoi)).toEqual(["1", "2", "3", "4–5", "6", "7", "8", "9–10", "11"]);
    expect(b[8].nhanGoc).toBe("40");
  });
  it("link theo cột: Quiz → nút Làm Quiz, cột Bài tập → phiếu (tạo bài tập), tên file đẹp", () => {
    const b = chay(true).modules[0].buoi;
    expect(b[0].taiLieu).toEqual([
      { tieuDe: "Làm Quiz", url: "https://quizizz.com/admin/quiz/1", vaiTro: "quiz" },
      { tieuDe: "Phiếu bài tập", url: "https://docs.google.com/d/1", vaiTro: "phieu" },
    ]);
    expect(b[1].taiLieu).toEqual([{ tieuDe: "Phieu hoc tap Bien", url: "https://docs.google.com/d/2", vaiTro: "phieu" }]);
    expect(b[0].taoBaiTap).toBe(true);
    expect(b[2].taoBaiTap).toBe(false);
  });
});
