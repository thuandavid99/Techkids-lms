import { describe, it, expect } from "vitest";
import { phanTichPPCT, doanGhepCot, timDongTieuDe, type DongExcel, type LoaiBuoiNhanDien } from "@/lib/domain/ppct";

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
    expect(kq.modules[0].buoi[0].taiLieu).toEqual([{ tieuDe: "Slide 1", url: "https://drive.google.com/file/d/abc" }]);
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
