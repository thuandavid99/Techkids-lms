"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { KQ } from "@/lib/types";

/** Giáo viên chọn lớp đang làm việc (lưu cookie 180 ngày) */
export async function chonLop(classId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(classId)) return;
  (await cookies()).set("lop_gv", classId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 180 });
}

export async function danhDauDaDoc(id: string): Promise<KQ> {
  const sb = await createClient();
  const { error } = await sb.from("notifications").update({ da_doc: true }).eq("id", id);
  return error ? { ok: false, loi: "Không cập nhật được." } : { ok: true };
}

export async function danhDauTatCaDaDoc(): Promise<KQ> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, loi: "Bạn cần đăng nhập." };
  const { error } = await sb.from("notifications").update({ da_doc: true }).eq("user_id", user.id).eq("da_doc", false);
  revalidatePath("/", "layout");
  return error ? { ok: false, loi: "Không cập nhật được." } : { ok: true, tb: "Đã đánh dấu tất cả là đã đọc" };
}
