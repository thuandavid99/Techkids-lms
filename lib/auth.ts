import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

/** Hồ sơ người đang đăng nhập (dùng lại trong cùng một lượt tải trang) */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return (data as Profile) ?? null;
});

export const laGiaoVien = (p: Profile | null) => !!p && (p.vai_tro === "giao_vien" || p.vai_tro === "tro_giang");

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
  if (!p || p.deleted_at) redirect("/dang-nhap");
  return laGiaoVien(p) ? p : null;
}

/** Dùng trong Server Action của giáo viên: ném lỗi nếu không có quyền */
export async function assertTeacher(): Promise<Profile> {
  const p = await getProfile();
  if (!laGiaoVien(p)) throw new Error("Bạn không có quyền thực hiện thao tác này.");
  return p!;
}

export async function assertStudent(): Promise<Profile> {
  const p = await getProfile();
  if (!p || p.vai_tro !== "hoc_sinh" || p.deleted_at) throw new Error("Bạn cần đăng nhập bằng tài khoản học sinh.");
  if (p.must_change_password) throw new Error("Em cần đổi mật khẩu trước.");
  return p;
}
