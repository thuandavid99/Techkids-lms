import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Ghi nhật ký thay đổi cho thao tác quan trọng (điểm, hạn nộp, xóa/ẩn, reset mật khẩu...) */
export async function ghiNhatKy(hanhDong: string, doiTuong: string, doiTuongId: string | null, truoc?: unknown, sau?: unknown) {
  try {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    await sb.from("audit_log").insert({
      user_id: user?.id ?? null, hanh_dong: hanhDong, doi_tuong: doiTuong, doi_tuong_id: doiTuongId,
      truoc: truoc ?? null, sau: sau ?? null,
    });
  } catch {
    // Nhật ký là phụ: không làm hỏng thao tác chính
  }
}
