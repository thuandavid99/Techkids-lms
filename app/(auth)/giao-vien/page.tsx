import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/Forms";
import { getProfile, laGiaoVien } from "@/lib/auth";
import { IMG } from "@/lib/brand";

export const metadata = { title: "Đăng nhập giáo viên" };

/** Cửa đăng nhập RIÊNG cho giáo viên / quản trị: <tên-web>/giao-vien */
export default async function Page() {
  const p = await getProfile();
  if (p && !p.deleted_at) redirect(laGiaoVien(p) ? "/gv" : "/");
  return (
    <AuthShell kieu="gv" minhHoa={IMG.clipboardGv} tieuDe="Quản lý lớp Python" phuDe="Soạn bài, chấm bài, theo dõi tiến độ lớp mình phụ trách">
      <LoginForm khu="gv" />
    </AuthShell>
  );
}
