import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

// =====================================================================
// KẾT NỐI QUẢN TRỊ (khóa service_role) — BỎ QUA RLS.
// CHỈ dùng ở server (Server Action / Route Handler), SAU KHI đã kiểm tra quyền.
// "server-only" làm build báo lỗi nếu file này lọt vào mã trình duyệt.
// =====================================================================
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Thiếu SUPABASE_SERVICE_ROLE_KEY (chỉ đặt ở .env.local / biến môi trường Vercel).");
  return createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Email ảo của học sinh: ma_hs@HS_EMAIL_DOMAIN (không gửi email thật) */
export function emailAo(maHs: string): string {
  const domain = process.env.HS_EMAIL_DOMAIN;
  if (!domain) throw new Error("Thiếu HS_EMAIL_DOMAIN trong biến môi trường.");
  return `${maHs.trim().toLowerCase()}@${domain}`;
}
