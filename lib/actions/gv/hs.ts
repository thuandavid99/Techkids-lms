"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient, emailAo } from "@/lib/supabase/admin";
import { taoMatKhauTam } from "@/lib/domain/password";
import { ghiNhatKy } from "@/lib/server/audit";
import { chay, chk, kiemTraHs, kiemTraLop, loi, ok, str, uuid } from "./_util";
import type { KQ } from "@/lib/types";

export interface TaiKhoanTam { ma_hs: string; ho_ten: string; mat_khau: string }
const MA_RE = /^[A-Za-z0-9._-]{2,30}$/;

async function maTiepTheo(admin: ReturnType<typeof createAdminClient>, daDung: Set<string>): Promise<string> {
  const { data } = await admin.from("profiles").select("ma_hs").ilike("ma_hs", "HS%");
  let max = 0;
  for (const r of data ?? []) { const m = /^HS(\d+)$/i.exec(r.ma_hs); if (m) max = Math.max(max, +m[1]); }
  for (const m of daDung) { const x = /^HS(\d+)$/i.exec(m); if (x) max = Math.max(max, +x[1]); }
  return `HS${String(max + 1).padStart(3, "0")}`;
}

/**
 * Tạo tài khoản học sinh ở SERVER bằng API quản trị Supabase (email ảo, đã xác nhận).
 * Mỗi em một mật khẩu tạm ngẫu nhiên; trả về bảng để thầy phát (chỉ hiện một lần).
 */
export async function taoTaiKhoan(classId: string, ds: { ma_hs?: string; ho_ten: string }[]): Promise<KQ> {
  return chay(async (sb) => {
    const c = uuid(classId);
    if (ds.length === 0) return loi("Danh sách trống.");
    if (ds.length > 200) return loi("Mỗi lần tối đa 200 học sinh.");
    await kiemTraLop(sb, c); // khóa service_role bỏ qua RLS → phải tự kiểm tra lớp
    const { data: lop } = await sb.from("classes").select("nam_hoc").eq("id", c).single();
    const admin = createAdminClient();
    const ketQua: TaiKhoanTam[] = [];
    const loiDs: string[] = [];
    const daDung = new Set<string>();
    for (const x of ds) {
      const hoTen = x.ho_ten.trim().replace(/\s+/g, " ").slice(0, 100);
      if (!hoTen) { loiDs.push("Thiếu họ tên"); continue; }
      const ma = (x.ma_hs?.trim() || (await maTiepTheo(admin, daDung))).toUpperCase();
      if (!MA_RE.test(ma)) { loiDs.push(`${ma}: mã chỉ gồm chữ không dấu, số, . _ -`); continue; }
      const { data: trung } = await admin.from("profiles").select("id").ilike("ma_hs", ma).maybeSingle();
      if (trung || daDung.has(ma)) { loiDs.push(`${ma}: mã đã tồn tại`); continue; }
      const mk = taoMatKhauTam();
      const { data: u, error } = await admin.auth.admin.createUser({ email: emailAo(ma), password: mk, email_confirm: true, app_metadata: { vai_tro: "hoc_sinh" } });
      if (error || !u.user) { loiDs.push(`${ma}: ${error?.message ?? "lỗi tạo tài khoản"}`); continue; }
      const { error: e2 } = await admin.from("profiles").insert({ id: u.user.id, ma_hs: ma, ho_ten: hoTen, vai_tro: "hoc_sinh", class_id: c, must_change_password: true });
      if (e2) { await admin.auth.admin.deleteUser(u.user.id); loiDs.push(`${ma}: ${e2.message}`); continue; }
      await admin.from("enrollments").insert({ student_id: u.user.id, class_id: c, nam_hoc: lop?.nam_hoc ?? "" });
      daDung.add(ma);
      ketQua.push({ ma_hs: ma, ho_ten: hoTen, mat_khau: mk });
    }
    revalidatePath("/gv", "layout");
    return { ok: ketQua.length > 0, tb: `Đã tạo ${ketQua.length} tài khoản${loiDs.length ? `, ${loiDs.length} dòng lỗi` : ""}`, loi: loiDs.length ? loiDs.join("; ") : undefined, data: ketQua, ts: Date.now() };
  });
}

/** Reset mật khẩu (một hoặc nhiều em): mật khẩu tạm mới + bắt đổi lại một lần */
export async function resetMatKhau(ids: string[]): Promise<KQ> {
  return chay(async (sb) => {
    const duocPhep = await kiemTraHs(sb, ids.slice(0, 200));
    const admin = createAdminClient();
    const out: TaiKhoanTam[] = [];
    for (const id of duocPhep) {
      const { data: p } = await sb.from("profiles").select("ma_hs, ho_ten, vai_tro").eq("id", id).single();
      if (!p || p.vai_tro !== "hoc_sinh") continue;
      const mk = taoMatKhauTam();
      const { error } = await admin.auth.admin.updateUserById(id, { password: mk });
      if (error) continue;
      await admin.from("profiles").update({ must_change_password: true }).eq("id", id);
      await admin.from("password_requests").update({ trang_thai: "da_xu_ly" }).eq("student_id", id).eq("trang_thai", "cho");
      await ghiNhatKy("reset_mk", "profiles", id, null, { ma_hs: p.ma_hs });
      out.push({ ma_hs: p.ma_hs, ho_ten: p.ho_ten, mat_khau: mk });
    }
    revalidatePath("/gv", "layout");
    return ok(`Đã cấp lại mật khẩu cho ${out.length} học sinh`, out);
  });
}

export async function suaHocSinh(_: KQ, fd: FormData): Promise<KQ> {
  return chay(async (sb) => {
    const id = uuid(fd.get("id"));
    const hoTen = str(fd, "ho_ten", 100);
    const ma = str(fd, "ma_hs", 30).toUpperCase();
    if (!hoTen) return loi("Nhập họ tên.");
    if (!MA_RE.test(ma)) return loi("Mã học sinh chỉ gồm chữ không dấu, số, . _ -");
    await kiemTraHs(sb, [id]);
    const { data: cu } = await sb.from("profiles").select("ma_hs, ho_ten").eq("id", id).single();
    if (cu && cu.ma_hs.toUpperCase() !== ma) {
      const admin = createAdminClient();
      const { data: trung } = await admin.from("profiles").select("id").ilike("ma_hs", ma).maybeSingle();
      if (trung) return loi("Mã này đã có người dùng.");
      const { error } = await admin.auth.admin.updateUserById(id, { email: emailAo(ma), email_confirm: true });
      if (error) return loi("Chưa đổi được mã đăng nhập: " + error.message);
    }
    chk(await sb.from("profiles").update({ ho_ten: hoTen, ma_hs: ma }).eq("id", id));
    await ghiNhatKy("sua", "profiles", id, cu, { ho_ten: hoTen, ma_hs: ma });
    revalidatePath("/gv", "layout");
    return ok("Đã lưu thông tin học sinh");
  });
}

/** Chuyển lớp: giữ lịch sử ở bảng enrollments */
export async function chuyenLop(studentId: string, classId: string): Promise<KQ> {
  return chay(async (sb) => {
    const s = uuid(studentId), c = uuid(classId);
    await kiemTraHs(sb, [s]);
    await kiemTraLop(sb, c);
    const homNay = new Date().toISOString().slice(0, 10);
    const { data: lop } = await sb.from("classes").select("nam_hoc, ten_lop").eq("id", c).single();
    chk(await sb.from("enrollments").update({ den_ngay: homNay }).eq("student_id", s).is("den_ngay", null));
    chk(await sb.from("enrollments").insert({ student_id: s, class_id: c, nam_hoc: lop?.nam_hoc ?? "" }));
    chk(await sb.from("profiles").update({ class_id: c }).eq("id", s));
    await ghiNhatKy("chuyen_lop", "profiles", s, null, { lop: lop?.ten_lop });
    revalidatePath("/gv", "layout");
    return ok(`Đã chuyển sang lớp ${lop?.ten_lop}`);
  });
}

export async function datDangHoc(studentId: string, dangHoc: boolean): Promise<KQ> {
  return chay(async (sb) => {
    chk(await sb.from("profiles").update({ dang_hoc: dangHoc }).eq("id", uuid(studentId)));
    await ghiNhatKy(dangHoc ? "di_hoc_lai" : "nghi_hoc", "profiles", studentId);
    revalidatePath("/gv", "layout");
    return ok(dangHoc ? "Đã chuyển về Đang học" : "Đã đánh dấu nghỉ học");
  });
}

export async function xoaHocSinh(studentId: string): Promise<KQ> {
  return chay(async (sb) => {
    chk(await sb.from("profiles").update({ deleted_at: new Date().toISOString() }).eq("id", uuid(studentId)));
    await ghiNhatKy("xoa", "profiles", studentId);
    revalidatePath("/gv", "layout");
    return ok("Đã chuyển học sinh vào thùng rác (khôi phục được trong 30 ngày)");
  });
}

export async function themGhiChu(studentId: string, noiDung: string): Promise<KQ> {
  return chay(async (sb) => {
    if (!noiDung.trim()) return loi("Chưa có nội dung.");
    chk(await sb.from("teacher_notes").insert({ student_id: uuid(studentId), noi_dung: noiDung.slice(0, 2000) }));
    return ok("Đã lưu ghi chú");
  });
}

export async function xoaGhiChu(id: string): Promise<KQ> {
  return chay(async (sb) => { chk(await sb.from("teacher_notes").delete().eq("id", uuid(id))); return ok("Đã xóa ghi chú"); });
}
