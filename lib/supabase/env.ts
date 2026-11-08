// Đọc biến môi trường công khai (an toàn ở trình duyệt)
export function supabaseUrl(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!v) throw new Error("Thiếu NEXT_PUBLIC_SUPABASE_URL trong .env.local (xem README bước 6).");
  return v;
}
export function supabaseAnonKey(): string {
  // Nhận cả tên cũ (ANON_KEY) và tên mới Supabase hiện dùng (PUBLISHABLE_KEY)
  const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!v) throw new Error("Thiếu NEXT_PUBLIC_SUPABASE_ANON_KEY (hoặc NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) trong .env.local (xem README bước 6).");
  return v;
}
