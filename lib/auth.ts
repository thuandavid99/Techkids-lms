import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

/** Hồ sơ người đang đăng nhập (dùng lại trong cùng một lượt tải trang) */
// getClaims() kiểm tra chữ ký phiên đăng nhập (thường ngay tại server, không phải gọi
// máy chủ Auth mỗi lần như getUser) → chuyển trang nhanh hơn.
export const getProfile = cache(async (): Promise<Profile | null> => {
  const sb = await createClient();
  const { data } = await sb.auth.getClaims();
  const uid = data?.claims?.sub;
  if (!uid) return null;
  const { data: p } = await sb.from("profiles").select("*").eq("id", uid).maybeSingle();
  return (p as Profile) ?? null;
});

/** Giáo viên (kể cả quản trị, trợ giảng) */
export const laGiaoVien = (p: Profile | null) => !!p && (p.vai_tro === "giao_vien" || p.vai_tro === "tro_giang" || p.vai_tro === "quan_tri");
/** Quản trị: toàn quyền, quản lý giáo viên, cài đặt hệ thống, chương trình chung */
export const laQuanTri = (p: Profile | null) => !!p && p.vai_tro === "quan_tri" && !p.deleted_at;
export const TEN_VAI_TRO: Record<string, string> = { quan_tri: "Quản trị", giao_vien: "Giáo viên", tro_giang: "Trợ giảng", hoc_sinh: "Học sinh" };

/** Trang học sinh: bắt đăng nhập, đúng vai trò, đổi mật khẩu lần đầu */
export async function requireStudent(): Promise<Profile> {
  const p = await getProfile();
  if (!p || p.deleted_at) redirect("/dang-nhap");
  if (laGiaoVien(p)) redirect("/gv");
  if (p.must_change_password) redirect("/doi-mat-khau-lan-dau");
  return p;
}

/** Trang giáo viên. Trả về null nếu không phải giáo viên (layout hiển thị "Không có quyền"). */
export async function getTeacherOrNull(): Promise<Profile | null> {
  const p = await getProfile();
  if (!p || p.deleted_at) redirect("/giao-vien");
  return laGiaoVien(p) ? p : null;
}

/** Dùng trong Server Action của giáo viên: ném lỗi nếu không có quyền */
export async function assertTeacher(): Promise<Profile> {
  const p = await getProfile();
  if (!laGiaoVien(p) || p!.deleted_at) throw new Error("Bạn không có quyền thực hiện thao tác này.");
  return p!;
}

/** Dùng trong Server Action chỉ dành cho quản trị */
export async function assertAdmin(): Promise<Profile> {
  const p = await getProfile();
  if (!laQuanTri(p)) throw new Error("Chỉ tài khoản quản trị được làm việc này.");
  return p!;
}

/** Trang chỉ dành cho quản trị: trả về null nếu không phải (trang hiển thị "Không có quyền") */
export async function getAdminOrNull(): Promise<Profile | null> {
  const p = await getProfile();
  return laQuanTri(p) ? p : null;
}

export async function assertStudent(): Promise<Profile> {
  const p = await getProfile();
  if (!p || p.vai_tro !== "hoc_sinh" || p.deleted_at) throw new Error("Bạn cần đăng nhập bằng tài khoản học sinh.");
  if (p.must_change_password) throw new Error("Em cần đổi mật khẩu trước.");
  return p;
}
