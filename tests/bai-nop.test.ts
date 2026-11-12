import { describe, expect, it } from "vitest";
import { docNop, ghiNop, demDaLam, docChamTabs, goiYDiem, noiThanhFile, linkHopLe, coNoiDung } from "@/lib/domain/bai-nop";

describe("bài nộp nhiều tab", () => {
  it("bài cũ (code thuần) đọc được như 1 tab", () => {
    expect(docNop('print("hi")')).toEqual({ tabs: ['print("hi")'], link: null });
    expect(docNop("x = 1", 3).tabs).toEqual(["x = 1", "", ""]);
  });
  it("ghi 1 tab → code thuần (tương thích dữ liệu cũ)", () => {
    expect(ghiNop({ tabs: ["a = 1", "", ""], link: null })).toBe("a = 1");
  });
  it("ghi / đọc nhiều tab + link", () => {
    const s = ghiNop({ tabs: ["a", "b", ""], link: "https://docs.google.com/x" });
    expect(s.startsWith('{"lms":1')).toBe(true);
    expect(docNop(s, 3)).toEqual({ tabs: ["a", "b", ""], link: "https://docs.google.com/x" });
  });
  it("code bắt đầu bằng { nhưng không phải định dạng lms vẫn là code", () => {
    expect(docNop('{"a":1}').tabs).toEqual(['{"a":1}']);
  });
  it("đếm bài đã làm, bỏ qua tab chỉ có chú thích", () => {
    expect(demDaLam({ tabs: ["print(1)", "# chưa làm", "", "x=2"], link: null }, 4)).toBe(2);
  });
  it("có nội dung", () => {
    expect(coNoiDung({ tabs: ["", ""], link: null })).toBe(false);
    expect(coNoiDung({ tabs: ["", ""], link: "https://a.b" })).toBe(true);
  });
  it("chấm ✓/✗ và gợi ý điểm", () => {
    const k = docChamTabs(["d", "s", "x", "d"], 5);
    expect(k).toEqual(["d", "s", null, "d", null]);
    expect(goiYDiem(["d", "d", "s", "d"], 10)).toBe(7.5);
    expect(goiYDiem([null, null], 10)).toBeNull();
    expect(goiYDiem(["d", "s", "s"], 10)).toBe(3.3);
  });
  it("nối thành file tải về", () => {
    expect(noiThanhFile({ tabs: ["a", "b"], link: null })).toContain("# ===== Bài 2 =====\nb");
  });
  it("link hợp lệ", () => {
    expect(linkHopLe("https://drive.google.com/abc")).toBe(true);
    expect(linkHopLe("javascript:alert(1)")).toBe(false);
    expect(linkHopLe("abc")).toBe(false);
  });
});
