"use server";
// =====================================================================
// QUẢN LÝ GIÁO VIÊN — chỉ tài khoản QUẢN TRỊ dùng được (chayQt).
// Tạo tài khoản bằng API quản trị Supabase ở SERVER (khóa service_role không
// bao giờ ra trình duyệt). Mật khẩu tạm ngẫu nhiên, chỉ hiện MỘT LẦN; giáo viên
// đăng nhập ở trang /giao-vien bằng email và bị bắt đổi mật khẩu lần đầu.
// =====================================================================
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/auth";
import { taoMatKhauTam } from "@/lib/domain/password";
import { ghiNhatKy } from "@/lib/server/audit";
import { chayQt, chk, loi, ok, str, uuid } from "./_util";
import type { KQ } from "@/lib/types";

export interface TaiKhoanGvTam { email: string; ho_ten: string; mat_khau: string }

// Chỉ nhận ký tự an toàn (cũng tránh chèn ký tự đặc biệt vào bộ lọc truy vấn)
const EMAIL_RE = /^[a-z0-9._%+-]{1,64}@[a-z0-9.-]{1,190}\.[a-z]{2,}$/;
const VAI_TRO_GV = ["giao_vien", "quan_tri"] as const;
const xong = () => revalidatePath("/gv", "layout");

/** Đếm quản trị còn hoạt động (không cho khóa / hạ quyền quản trị cuối cùng) */
async function soQuanTri(): Promise<number> {
  const { count } = await createAdminClient().from("profiles").select("id", { count: "exact", head: true })
    .eq("vai_tro", "quan_tri").is("deleted_at", null);
  return count ?? 0;
}

/** Thêm giáo viên: email + họ tên + vai trò + các lớp phụ trách */
export async function taoGiaoVien(_: KQ, fd: FormData): Promise<KQ> {
  return chayQt(async () => {
    const email = str(fd, "email", 254).toLowerCase();
    const hoTen = str(fd, "ho_ten", 100).replace(/\s+/g, " ");
    const vaiTro = str(fd, "vai_tro") || "giao_vien";
    const lops = fd.getAll("lop").map(String).filter((x) => /^[0-9a-f-]{36}$/i.test(x));
    if (!EMAIL_RE.test(email)) return loi("Email chưa đúng dạng (ví dụ: co.lan@gmail.com).");
    if (!hoTen) return loi("Nhập họ tên giáo viên.");
    if (!VAI_TRO_GV.includes(vaiTro as (typeof VAI_TRO_GV)[number])) return loi("Vai trò không hợp lệ.");

    const admin = createAdminClient();
    const { data: trung } = await admin.from("profiles").select("id, vai_tro").or(`email.eq.${email},ma_hs.eq.${email}`).maybeSingle();
    if (trung) return loi("Email này đã có tài khoản trong hệ thống.");

    const mk = taoMatKhauTam(10);
    const { data: u, error } = await admin.auth.admin.createUser({ email, password: mk, email_confirm: true, app_metadata: { vai_tro: vaiTro } });
    if (error || !u.user) {
      if (/already|registered|exists/i.test(error?.message ?? "")) return loi("Email này đã có tài khoản đăng nhập (có thể đã tạo trong Supabase). Xóa ở Supabase → Authentication → Users rồi thêm lại, hoặc dùng email khác.");
      return loi("Chưa tạo được tài khoản: " + (error?.message ?? "lỗi không rõ"));
    }
    const { error: e2 } = await admin.from("profiles").insert({
      id: u.user.id, ma_hs: email, email, ho_ten: hoTen, vai_tro: vaiTro, must_change_password: true, dang_hoc: true,
    });
    if (e2) { await admin.auth.admin.deleteUser(u.user.id); return loi("Chưa lưu được hồ sơ: " + e2.message); }
    if (lops.length) await admin.from("class_teachers").insert(lops.map((c) => ({ class_id: c, teacher_id: u.user!.id })));
    await ghiNhatKy("tao_gv", "profiles", u.user.id, null, { email, ho_ten: hoTen, vai_tro: vaiTro, so_lop: lops.length });
    xong();
    return ok(`Đã thêm ${hoTen}`, [{ email, ho_ten: hoTen, mat_khau: mk }] satisfies TaiKhoanGvTam[]);
  });
}

/** Sửa họ tên / vai trò */
export async function suaGiaoVien(id: string, hoTen: string, vaiTro: string): Promise<KQ> {
  return chayQt(async () => {
    const x = uuid(id);
    const ten = hoTen.trim().replace(/\s+/g, " ").slice(0, 100);
    if (!ten) return loi("Nhập họ tên.");
    if (!VAI_TRO_GV.includes(vaiTro as (typeof VAI_TRO_GV)[number])) return loi("Vai trò không hợp lệ.");
    const admin = createAdminClient();
    const { data: cu } = await admin.from("profiles").select("ho_ten, vai_tro").eq("id", x).maybeSingle();
    if (!cu || cu.vai_tro === "hoc_sinh") return loi("Không tìm thấy giáo viên.");
    if (cu.vai_tro === "quan_tri" && vaiTro !== "quan_tri" && (await soQuanTri()) <= 1) return loi("Phải còn ít nhất một quản trị.");
    chk(await admin.from("profiles").update({ ho_ten: ten, vai_tro: vaiTro }).eq("id", x));
    await ghiNhatKy("sua_gv", "profiles", x, cu, { ho_ten: ten, vai_tro: vaiTro });
    xong();
    return ok("Đã lưu");
  });
}

/** Gán các lớp giáo viên phụ trách (thay toàn bộ danh sách cũ) */
export async function ganLopChoGv(teacherId: string, classIds: string[]): Promise<KQ> {
  return chayQt(async (sb) => {
    const t = uuid(teacherId);
    const lops = classIds.map(uuid);
    chk(await sb.from("class_teachers").delete().eq("teacher_id", t));
    if (lops.length) chk(await sb.from("class_teachers").insert(lops.map((c) => ({ class_id: c, teacher_id: t }))));
    await ghiNhatKy("gan_lop_gv", "class_teachers", t, null, { lop: lops });
    xong();
    return ok(lops.length ? `Đã gán ${lops.length} lớp` : "Đã bỏ hết lớp phụ trách");
  });
}

/** Cấp lại mật khẩu tạm (hiện một lần), bắt đổi ở lần đăng nhập sau */
export async function datLaiMatKhauGv(id: string): Promise<KQ> {
  return chayQt(async () => {
    const x = uuid(id);
    const me = await getProfile();
    if (me?.id === x) return loi("Muốn đổi mật khẩu của chính mình, vào Cài đặt → Đổi mật khẩu.");
    const admin = createAdminClient();
    const { data: p } = await admin.from("profiles").select("ho_ten, email, vai_tro").eq("id", x).maybeSingle();
    if (!p || p.vai_tro === "hoc_sinh") return loi("Không tìm thấy giáo viên.");
    const mk = taoMatKhauTam(10);
    const { error } = await admin.auth.admin.updateUserById(x, { password: mk });
    if (error) return loi("Chưa cấp lại được: " + error.message);
    await admin.from("profiles").update({ must_change_password: true }).eq("id", x);
    await ghiNhatKy("reset_mk_gv", "profiles", x, null, { email: p.email });
    return ok("Đã cấp mật khẩu tạm mới", [{ email: p.email ?? "", ho_ten: p.ho_ten, mat_khau: mk }] satisfies TaiKhoanGvTam[]);
  });
}

/** Khóa / mở khóa: khóa = không đăng nhập được, không đọc được dữ liệu (dữ liệu chấm cũ vẫn giữ) */
export async function khoaGiaoVien(id: string, khoa: boolean): Promise<KQ> {
  return chayQt(async () => {
    const x = uuid(id);
    const me = await getProfile();
    if (me?.id === x) return loi("Không thể tự khóa tài khoản của mình.");
    const admin = createAdminClient();
    const { data: p } = await admin.from("profiles").select("vai_tro, deleted_at").eq("id", x).maybeSingle();
    if (!p || p.vai_tro === "hoc_sinh") return loi("Không tìm thấy giáo viên.");
    if (khoa && p.vai_tro === "quan_tri" && (await soQuanTri()) <= 1) return loi("Phải còn ít nhất một quản trị.");
    const { error } = await admin.auth.admin.updateUserById(x, { ban_duration: khoa ? "876000h" : "none" });
    if (error) return loi("Chưa cập nhật được: " + error.message);
    chk(await admin.from("profiles").update({ deleted_at: khoa ? new Date().toISOString() : null }).eq("id", x));
    await ghiNhatKy(khoa ? "khoa_gv" : "mo_khoa_gv", "profiles", x);
    xong();
    return ok(khoa ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản");
  });
}
