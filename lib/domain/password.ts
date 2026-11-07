// Mật khẩu tạm ngẫu nhiên RIÊNG từng học sinh, dùng bộ sinh số ngẫu nhiên an toàn (Web Crypto).
// Bỏ các ký tự dễ nhầm: 0/O, 1/l/I.
const BANG = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function taoMatKhauTam(doDai = 8): string {
  const out: string[] = [];
  const buf = new Uint8Array(1);
  // Lấy mẫu loại bỏ (rejection sampling) để mỗi ký tự có xác suất như nhau
  const gioiHan = 256 - (256 % BANG.length);
  while (out.length < doDai) {
    globalThis.crypto.getRandomValues(buf);
    if (buf[0] < gioiHan) out.push(BANG[buf[0] % BANG.length]);
  }
  // Bảo đảm có cả chữ và số cho dễ đọc to
  if (!/[0-9]/.test(out.join(""))) out[out.length - 1] = "23456789"[out.length % 8];
  return out.join("");
}

/** Mật khẩu học sinh tự đặt: ít nhất 6 ký tự, có chữ và số */
export function kiemTraMatKhauMoi(mk: string): string | null {
  if (mk.length < 6) return "Mật khẩu cần ít nhất 6 ký tự.";
  if (mk.length > 72) return "Mật khẩu quá dài.";
  if (!/[A-Za-z]/.test(mk) || !/[0-9]/.test(mk)) return "Mật khẩu cần có cả chữ và số.";
  return null;
}
