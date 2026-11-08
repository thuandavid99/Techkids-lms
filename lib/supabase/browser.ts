"use client";
import { createBrowserClient } from "@supabase/ssr";

// Kết nối ở trình duyệt: chỉ dùng khóa anon (công khai). Chỉ dùng để tải file lên
// bằng đường dẫn ký do server cấp và lưu nháp — mọi thứ khác đi qua server.
export function createBrowserSupabase() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!);
}
