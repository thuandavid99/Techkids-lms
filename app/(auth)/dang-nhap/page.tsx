import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/Forms";
import { getProfile, laGiaoVien } from "@/lib/auth";

export const metadata = { title: "Đăng nhập" };

export default async function Page() {
  const p = await getProfile();
  if (p && !p.deleted_at) redirect(laGiaoVien(p) ? "/gv" : "/");
  return <AuthShell><LoginForm /></AuthShell>;
}
