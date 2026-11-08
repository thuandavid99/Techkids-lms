import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

/** Ghi nhật ký thay đổi cho thao tác quan trọng (điểm, hạn nộp, xóa/ẩn, reset mật khẩu...) */
export async function ghiNhatKy(hanhDong: string, doiTuong: string, doiTuongId: string | null, truoc?: unknown, sau?: unknown) {
  try {
    const sb = await createClient();
    const p = await getProfile(); // đã có sẵn trong lượt xử lý, không gọi mạng thêm
    await sb.from("audit_log").insert({
      user_id: p?.id ?? null, hanh_dong: hanhDong, doi_tuong: doiTuong, doi_tuong_id: doiTuongId,
      truoc: truoc ?? null, sau: sau ?? null,
    });
  } catch {
    // Nhật ký là phụ: không làm hỏng thao tác chính
  }
}
