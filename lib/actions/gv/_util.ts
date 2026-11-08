import "server-only";
import { assertAdmin, assertTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { KQ } from "@/lib/types";

export const UUID = /^[0-9a-f-]{36}$/i;
export const ok = (tb?: string, data?: unknown): KQ => ({ ok: true, tb, data, ts: Date.now() });
export const loi = (s: string): KQ => ({ ok: false, loi: s, ts: Date.now() });

/** Chạy một thao tác của giáo viên: kiểm tra quyền, bắt lỗi, trả về KQ */
export async function chay(fn: (sb: Awaited<ReturnType<typeof createClient>>) => Promise<KQ | void>, tb?: string): Promise<KQ> {
  try {
    await assertTeacher();
    const sb = await createClient();
    const r = await fn(sb);
    return r ?? ok(tb);
  } catch (e) {
    return loi((e as Error).message || "Có lỗi xảy ra. Thử lại nhé.");
  }
}

/** Thao tác chỉ dành cho QUẢN TRỊ (cài đặt hệ thống, chương trình chung, giáo viên, lớp) */
export async function chayQt(fn: (sb: Awaited<ReturnType<typeof createClient>>) => Promise<KQ | void>, tb?: string): Promise<KQ> {
  try {
    await assertAdmin();
    const sb = await createClient();
    const r = await fn(sb);
    return r ?? ok(tb);
  } catch (e) {
    return loi((e as Error).message || "Có lỗi xảy ra. Thử lại nhé.");
  }
}

type SB = Awaited<ReturnType<typeof createClient>>;

/**
 * Kiểm tra giáo viên có phụ trách lớp này không (đọc qua RLS: thấy được lớp = có quyền).
 * BẮT BUỘC gọi trước khi dùng khóa service_role (createAdminClient), vì khóa đó bỏ qua RLS.
 */
export async function kiemTraLop(sb: SB, classId: string) {
  const { data } = await sb.from("classes").select("id").eq("id", uuid(classId)).maybeSingle();
  if (!data) throw new Error("Bạn không phụ trách lớp này.");
}

/** Lọc danh sách học sinh: chỉ giữ em thuộc lớp mình phụ trách. Ném lỗi nếu không còn em nào. */
export async function kiemTraHs(sb: SB, ids: string[]): Promise<string[]> {
  const sach = ids.map(uuid);
  if (!sach.length) return [];
  const { data } = await sb.from("profiles").select("id").in("id", sach).eq("vai_tro", "hoc_sinh");
  const ok_ = (data ?? []).map((x) => x.id as string);
  if (!ok_.length) throw new Error("Bạn không phụ trách học sinh này.");
  return ok_;
}

/** Ném lỗi tiếng Việt nếu truy vấn Supabase lỗi */
export function chk<T extends { error: { message: string; code?: string } | null }>(r: T, viec = "lưu"): T {
  if (r.error) {
    if (r.error.code === "23505") throw new Error("Dữ liệu bị trùng (ví dụ mã đã tồn tại).");
    if (r.error.code === "42501") throw new Error("Bạn không có quyền sửa phần này (chỉ quản trị hoặc giáo viên phụ trách lớp).");
    if (r.error.code === "23503") throw new Error("Không thể xóa vì đang có dữ liệu liên quan. Hãy dùng Ẩn thay vì xóa.");
    throw new Error(`Chưa ${viec} được: ${r.error.message}`);
  }
  return r;
}

export const str = (fd: FormData, k: string, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);
export const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true" || fd.get(k) === "1";
export function uuid(v: unknown): string {
  const s = String(v ?? "");
  if (!UUID.test(s)) throw new Error("Mã không hợp lệ.");
  return s;
}
