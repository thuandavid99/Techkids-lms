// Gợi ý tiếng Việt cho lỗi Python thường gặp (hiện dưới thông báo lỗi khi bấm "Chạy")

const GOI_Y: [RegExp, string][] = [
  [/IndentationError|TabError/, "Lỗi thụt lề: các dòng trong cùng một khối (sau if/for/while/def) phải thụt vào bằng nhau, thường là 4 dấu cách."],
  [/SyntaxError/, "Lỗi cú pháp: kiểm tra dấu hai chấm (:) cuối dòng if/for/while/def, dấu ngoặc ( ) [ ] và dấu nháy \" \" có đủ cặp không."],
  [/EOFError/, "Chương trình cần nhập thêm dữ liệu: gõ vào ô \"Dữ liệu vào\", mỗi lần input() là một dòng."],
  [/NameError/, "Dùng một tên (biến/hàm) chưa được tạo hoặc gõ sai chính tả. Python phân biệt chữ HOA và chữ thường."],
  [/ZeroDivisionError/, "Phép chia cho 0. Kiểm tra số chia trước khi chia."],
  [/TypeError/, "Sai kiểu dữ liệu, ví dụ cộng số với chuỗi. Nhớ đổi sang số bằng int() hoặc float() khi dùng input()."],
  [/ValueError/, "Giá trị không hợp lệ, ví dụ int(\"abc\"). Kiểm tra lại dữ liệu vào."],
  [/IndexError/, "Chỉ số vượt quá độ dài danh sách/chuỗi. Chỉ số bắt đầu từ 0 và nhỏ hơn len(...)."],
  [/KeyError/, "Khóa không có trong từ điển (dict)."],
  [/AttributeError/, "Đối tượng không có thuộc tính/hàm này. Kiểm tra tên hàm, ví dụ .append() chỉ dùng cho list."],
  [/RecursionError/, "Hàm gọi lại chính nó quá nhiều lần. Kiểm tra điều kiện dừng của hàm đệ quy."],
  [/ModuleNotFoundError/, "Thư viện này chưa có khi chạy trên trình duyệt. Các thư viện chuẩn như math, random vẫn dùng được."],
];

/** Tìm gợi ý theo loại lỗi ở dòng cuối của thông báo */
export function goiYLoi(thongBao: string): string | null {
  const cuoi = thongBao.trim().split("\n").pop() ?? "";
  for (const [re, g] of GOI_Y) if (re.test(cuoi)) return g;
  for (const [re, g] of GOI_Y) if (re.test(thongBao)) return g;
  return null;
}

/** Lấy số dòng bị lỗi (để học sinh biết sửa ở đâu) */
export function dongLoi(thongBao: string): number | null {
  const m = [...thongBao.matchAll(/line (\d+)/g)].pop();
  return m ? Number(m[1]) : null;
}
