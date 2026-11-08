import { describe, it, expect } from "vitest";
import { goiYLoi, dongLoi } from "@/lib/domain/python-loi";

describe("Gợi ý lỗi Python", () => {
  it("nhận đúng loại lỗi ở dòng cuối", () => {
    const tb = 'Traceback (most recent call last):\n  Bài làm, line 3, in <module>\nNameError: name \'tog\' is not defined';
    expect(goiYLoi(tb)).toContain("chưa được tạo");
    expect(dongLoi(tb)).toBe(3);
  });
  it("IndentationError ưu tiên hơn SyntaxError", () => {
    expect(goiYLoi("  Bài làm, line 4\nIndentationError: expected an indented block")).toContain("thụt lề");
  });
  it("EOFError → nhắc điền Dữ liệu vào", () => {
    expect(goiYLoi("EOFError: EOF when reading a line")).toContain("Dữ liệu vào");
  });
  it("lỗi lạ → không có gợi ý", () => {
    expect(goiYLoi("SomethingWeird: x")).toBeNull();
    expect(dongLoi("không có số dòng")).toBeNull();
  });
});
