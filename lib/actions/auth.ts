"use server";
import { redirect } from "next/navigation";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, emailAo } from "@/lib/supabase/admin";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";
import { kiemTraMatKhauMoi } from "@/lib/domain/password";
import { getProfile } from "@/lib/auth";
import type { KQ } from "@/lib/types";

const loi = (s: string): KQ => ({ ok: false, loi: s, ts: Date.now() });

/** Đăng nhập bằng MÃ HỌC SINH + mật khẩu (giáo viên: tên đăng nhập hoặc email) */
export async function dangNhap(_: KQ, fd: FormData): Promise<KQ> {
  const ma = String(fd.get("ma") ?? "").trim();
  const mk = String(fd.get("mat_khau") ?? "");
  if (!ma || !mk) return loi("Vui lòng nhập mã học sinh và mật khẩu.");
  if (ma.length > 100 || mk.length > 100) return loi("Thông tin không hợp lệ.");
  const email = ma.includes("@") ? ma.toLowerCase() : emailAo(ma);

  const sb = await createClient();
  const { data, error } = await sb.auth.signInWithPassword({ email, password: mk });
  if (error || !data.user) {
    if (/invalid login credentials/i.test(error?.message ?? "")) return loi("Mã học sinh hoặc mật khẩu chưa đúng. Kiểm tra lại chữ HOA/thường nhé.");
    return loi("Chưa đăng nhập được. Kiểm tra mạng rồi thử lại.");
  }
  const { data: p } = await sb.from("profiles").select("vai_tro, must_change_password, deleted_at").eq("id", data.user.id).maybeSingle();
  if (!p || p.deleted_at) {
    await sb.auth.signOut();
    return loi("Tài khoản này không còn hoạt động. Em hỏi thầy nhé.");
  }
  if (p.vai_tro !== "hoc_sinh") redirect("/gv");
  if (p.must_change_password) redirect("/doi-mat-khau-lan-dau");
  redirect("/");
}

export async function dangXuat() {
  const sb = await createClient();
  await sb.auth.signOut();
  redirect("/dang-nhap");
}

/** Học sinh đổi mật khẩu LẦN ĐẦU (lần tự đổi duy nhất; mỗi lần thầy reset cho thêm đúng 1 lần) */
export async function doiMatKhauLanDau(_: KQ, fd: FormData): Promise<KQ> {
  const p = await getProfile();
  if (!p) return loi("Phiên đăng nhập đã hết. Đăng nhập lại nhé.");
  if (!p.must_change_password) return loi("Tài khoản đã đổi mật khẩu rồi. Nếu quên mật khẩu, em nhờ thầy cấp lại.");
  const mk = String(fd.get("mat_khau") ?? "");
  const mk2 = String(fd.get("nhap_lai") ?? "");
  const kt = kiemTraMatKhauMoi(mk);
  if (kt) return loi(kt);
  if (mk !== mk2) return loi("Hai mật khẩu chưa giống nhau.");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(p.id, { password: mk });
  if (error) return loi("Chưa đổi được mật khẩu. Thử lại sau ít phút.");
  await admin.from("profiles").update({ must_change_password: false }).eq("id", p.id);
  redirect(p.vai_tro === "hoc_sinh" ? "/?chao=1" : "/gv");
}

/** Quên mật khẩu: gửi yêu cầu cho thầy (không tiết lộ mã có tồn tại hay không) */
export async function guiYeuCauQuenMk(_: KQ, fd: FormData): Promise<KQ> {
  const ma = String(fd.get("ma") ?? "").trim();
  const ok: KQ = { ok: true, tb: "Đã gửi yêu cầu. Thầy sẽ gửi mật khẩu mới cho bạn.", ts: Date.now() };
  if (!ma || ma.length > 50 || !/^[A-Za-z0-9._-]+$/.test(ma)) return loi("Mã học sinh không hợp lệ.");
  const admin = createAdminClient();
  const { data: p } = await admin.from("profiles").select("id, vai_tro").ilike("ma_hs", ma).is("deleted_at", null).maybeSingle();
  if (!p || p.vai_tro !== "hoc_sinh") return ok;
  const { data: dangCho } = await admin.from("password_requests").select("id").eq("student_id", p.id).eq("trang_thai", "cho").limit(1);
  if (!dangCho?.length) await admin.from("password_requests").insert({ student_id: p.id });
  return ok;
}

/** Giáo viên đổi mật khẩu tự do (cần mật khẩu hiện tại) */
export async function doiMatKhauGv(_: KQ, fd: FormData): Promise<KQ> {
  const p = await getProfile();
  if (!p || p.vai_tro === "hoc_sinh") return loi("Học sinh không tự đổi mật khẩu ở đây. Em nhờ thầy cấp lại nhé.");
  const cu = String(fd.get("mat_khau_cu") ?? "");
  const moi = String(fd.get("mat_khau") ?? "");
  if (moi !== String(fd.get("nhap_lai") ?? "")) return loi("Hai mật khẩu mới chưa giống nhau.");
  if (moi.length < 8) return loi("Mật khẩu giáo viên cần ít nhất 8 ký tự.");
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const thu = createPlainClient(supabaseUrl(), supabaseAnonKey(), { auth: { persistSession: false } });
  const { error: e1 } = await thu.auth.signInWithPassword({ email: user!.email!, password: cu });
  if (e1) return loi("Mật khẩu hiện tại chưa đúng.");
  await thu.auth.signOut();
  const { error } = await sb.auth.updateUser({ password: moi });
  if (error) return loi("Chưa đổi được mật khẩu: " + error.message);
  return { ok: true, tb: "Đã đổi mật khẩu.", ts: Date.now() };
}
