// =====================================================================
// KHÓA SẮP XẾP (fractional index): chèn một mục vào GIỮA hai mục mà không
// phải đánh số lại cả danh sách. Khóa là chuỗi ký tự 0-9A-Za-z, so sánh
// theo thứ tự byte (database dùng COLLATE "C").
// =====================================================================
const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function midpoint(a: string, b: string | null): string {
  if (b !== null) {
    let n = 0;
    while ((a[n] ?? "0") === b[n]) n++;
    if (n > 0) return b.slice(0, n) + midpoint(a.slice(n), b.slice(n));
  }
  const da = a ? DIGITS.indexOf(a[0]) : 0;
  const db = b !== null ? DIGITS.indexOf(b[0]) : DIGITS.length;
  if (db - da > 1) return DIGITS[Math.round((da + db) / 2)];
  if (b !== null && b.length > 1) return b.slice(0, 1);
  return DIGITS[da] + midpoint(a.slice(1), null);
}

/** Khóa nằm giữa a và b (a < kết quả < b). a = null: đầu danh sách; b = null: cuối danh sách */
export function keyBetween(a: string | null, b: string | null): string {
  if (a !== null && b !== null && a >= b) throw new Error(`Khóa không hợp lệ: ${a} >= ${b}`);
  const aa = (a ?? "").replace(/0+$/, "");
  let k = midpoint(aa, b);
  // An toàn: đảm bảo kết quả thật sự nằm giữa (phòng khóa cũ có số 0 ở cuối)
  if ((a !== null && k <= a) || (b !== null && k >= b)) k = (a ?? "") + "V";
  if (b !== null && k >= b) throw new Error("Không tạo được khóa sắp xếp");
  return k;
}

/** n khóa tăng dần nằm giữa a và b, phân bố đều (khóa ngắn) */
export function keysBetween(a: string | null, b: string | null, n: number): string[] {
  if (n <= 0) return [];
  if (n === 1) return [keyBetween(a, b)];
  const mid = Math.floor(n / 2);
  const k = keyBetween(a, b);
  return [...keysBetween(a, k, mid), k, ...keysBetween(k, b, n - mid - 1)];
}

/** So sánh theo thứ tự byte (dùng khi sắp xếp ở trình duyệt) */
export function cmpKey(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
