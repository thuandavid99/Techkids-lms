import { FileSpreadsheet, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { lopDangChon } from "@/lib/server/lop";
import { duLieuLop } from "@/lib/server/gv";
import { IMG } from "@/lib/brand";
import { Card, PageGrid, RobotCard, CardTitle } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { QuanLyHocSinh } from "@/components/teacher/QuanLyHocSinh";
import { phanTramHoanThanh } from "@/lib/domain/stats";

export const metadata = { title: "Quản lý học sinh" };

export default async function Page({ searchParams }: { searchParams: Promise<{ lop?: string }> }) {
  const { lop: lopUrl } = await searchParams;
  const sb = await createClient();
  const { lops, lop } = await lopDangChon(sb, lopUrl);
  if (!lop) return <Card><EmptyState title="Chưa có lớp nào" hint="Tạo lớp trước rồi thêm học sinh." action={<ButtonLink href="/gv/lop">Tạo lớp</ButtonLink>} /></Card>;
  const [{ data: hs }, { rows }, { data: yc }] = await Promise.all([
    sb.from("profiles").select("id, ma_hs, ho_ten, dang_hoc, must_change_password").eq("class_id", lop.id).eq("vai_tro", "hoc_sinh").is("deleted_at", null).order("ma_hs"),
    duLieuLop(sb, lop.id),
    sb.from("password_requests").select("student_id").eq("trang_thai", "cho"),
  ]);
  const xin = new Set((yc ?? []).map((x) => x.student_id));
  return (
    <PageGrid
      main={<QuanLyHocSinh classId={lop.id} tenLop={lop.ten_lop} lops={lops} ds={(hs ?? []).map((h) => ({
        id: h.id, ma_hs: h.ma_hs, ho_ten: h.ho_ten, dang_hoc: h.dang_hoc, chuaDoiMk: h.must_change_password, xinReset: xin.has(h.id),
        tienDo: phanTramHoanThanh(rows.filter((r) => r.student_id === h.id)),
      }))} />}
      aside={<>
        <Card>
          <CardTitle>Nhập danh sách nhanh</CardTitle>
          <a href="/api/gv/xuat?loai=mau-hs" className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 px-4 py-6 font-medium hover:border-xanh-500">
            <FileSpreadsheet className="h-6 w-6 text-la-600" /> Tải file mẫu Excel (.xlsx)
          </a>
          <p className="mt-2 text-sm text-slate-500">Tự động tạo mã HS & mật khẩu tạm riêng từng em.</p>
        </Card>
        {xin.size > 0 && (
          <Card className="!border-do-600/30">
            <CardTitle icon={<KeyRound className="h-6 w-6 text-do-600" />}>Yêu cầu cấp lại mật khẩu</CardTitle>
            <p>Có <b>{xin.size}</b> yêu cầu đang chờ.</p>
            <ButtonLink href="/gv/hoc-sinh/yeu-cau-mat-khau" size="sm" className="mt-3">Xem và reset</ButtonLink>
          </Card>
        )}
        <RobotCard img={IMG.clipboard} title="Quản lý lớp học dễ dàng!" />
      </>}
    />
  );
}
