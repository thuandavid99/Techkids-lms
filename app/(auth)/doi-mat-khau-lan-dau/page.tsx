import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { DoiMkLanDauForm } from "@/components/auth/Forms";
import { getProfile, laGiaoVien } from "@/lib/auth";
import { IMG } from "@/lib/brand";

export const metadata = { title: "Đổi mật khẩu lần đầu" };

/** Bắt buộc khi must_change_password = true; chặn mọi màn khác cho tới khi đổi xong */
export default async function Page() {
  const p = await getProfile();
  if (!p) redirect("/dang-nhap");
  if (!p.must_change_password) redirect(laGiaoVien(p) ? "/gv" : "/");
  return <AuthShell minhHoa={IMG.shield}><DoiMkLanDauForm ten={p.ho_ten.split(" ").pop() ?? p.ho_ten} /></AuthShell>;
}
