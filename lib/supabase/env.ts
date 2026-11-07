// Đọc biến môi trường công khai (an toàn ở trình duyệt)
export function supabaseUrl(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!v) throw new Error("Thiếu NEXT_PUBLIC_SUPABASE_URL trong .env.local (xem README bước 6).");
  return v;
}
export function supabaseAnonKey(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!v) throw new Error("Thiếu NEXT_PUBLIC_SUPABASE_ANON_KEY trong .env.local (xem README bước 6).");
  return v;
}
