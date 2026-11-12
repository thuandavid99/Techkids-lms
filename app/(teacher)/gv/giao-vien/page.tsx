import { SubNavCaiDat } from "@/components/teacher/SubNavCaiDat";
import { getAdminOrNull } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, PageHeader } from "@/components/ui/Card";
import { KhongCoQuyen } from "@/components/ui/States";
import { QuanLyGiaoVien, type DongGv } from "@/components/teacher/QuanLyGiaoVien";
import { fmtDateTime } from "@/lib/domain/time";

export const metadata = { title: "Giáo viên" };

/** QUẢN TRỊ: danh sách giáo viên, thêm / gán lớp / cấp lại mật khẩu / khóa */
export default async function Page() {
  const me = await getAdminOrNull();
  if (!me) return <KhongCoQuyen home="/gv" chiQuanTri />;
  // Trang đã kiểm tra quyền quản trị ở trên → được dùng khóa service_role để đọc
  // giờ đăng nhập gần nhất (chỉ có trong bảng auth của Supabase).
  const admin = createAdminClient();
  const [{ data: ps }, { data: cts }, { data: lops }, { data: users }] = await Promise.all([
    admin.from("profiles").select("id, ho_ten, email, ma_hs, vai_tro, deleted_at, must_change_password").neq("vai_tro", "hoc_sinh").order("ho_ten"),
    admin.from("class_teachers").select("class_id, teacher_id"),
    admin.from("classes").select("id, ten_lop").is("deleted_at", null).eq("archived", false).order("ten_lop"),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  const lanCuoi = new Map<string, { at: string | null; email: string }>((users?.users ?? []).map((u) => [u.id as string, { at: (u.last_sign_in_at as string | undefined) ?? null, email: (u.email as string | undefined) ?? "" }]));
  const ds: DongGv[] = (ps ?? []).map((p) => ({
    id: p.id, ho_ten: p.ho_ten, email: p.email ?? lanCuoi.get(p.id)?.email ?? "", vai_tro: p.vai_tro,
    khoa: !!p.deleted_at, doi_mk: p.must_change_password, la_toi: p.id === me.id,
    lop: (cts ?? []).filter((c) => c.teacher_id === p.id).map((c) => c.class_id),
    dang_nhap_cuoi: lanCuoi.get(p.id)?.at ? fmtDateTime(lanCuoi.get(p.id)!.at!) : null,
  }));
  return (
    <>
    <SubNavCaiDat qt={true} />
    <Card>
      <PageHeader title="Giáo viên" sub="Quản trị toàn quyền. Giáo viên chỉ thấy lớp được gán. Giáo viên đăng nhập ở trang /giao-vien bằng email." />
      <QuanLyGiaoVien ds={ds} lops={lops ?? []} />
    </Card>
    </>
  );
}
