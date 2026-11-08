import { Trash2, History } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile, laQuanTri } from "@/lib/auth";
import { cacLoaiBuoi, caiDat } from "@/lib/server/data";
import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { LoaiBuoiList, DanhMucDon } from "@/components/teacher/DanhMuc";
import { QuyTacForm, DoiMatKhauGvForm } from "@/components/teacher/CaiDatForms";

export const metadata = { title: "Cài đặt" };

export default async function Page() {
  const p = await getProfile();
  if (!laQuanTri(p)) {
    // Giáo viên thường: chỉ phần cá nhân. Cài đặt hệ thống do quản trị quản lý.
    return (
      <div className="space-y-5">
        <PageHeader title="Cài đặt" sub="Loại buổi, phân loại tài liệu, nhận xét mẫu, mẫu tin nhắn… do quản trị cài đặt cho cả trung tâm." />
        <div className="grid gap-5 lg:grid-cols-2">
          <Card><CardTitle>Đổi mật khẩu</CardTitle><DoiMatKhauGvForm /></Card>
          <Card><CardTitle>Tài khoản</CardTitle>
            <p><b>{p?.ho_ten}</b></p><p className="text-sm text-slate-600">{p?.email ?? p?.ma_hs}</p>
            <p className="mt-2 text-sm text-slate-600">Vai trò: Giáo viên — chỉ thấy các lớp được quản trị gán.</p>
          </Card>
        </div>
      </div>
    );
  }
  const sb = await createClient();
  const [loai, { data: cats }, { data: nx }, { data: mt }, cd] = await Promise.all([
    cacLoaiBuoi(sb),
    sb.from("material_categories").select("id, ten, thu_tu").is("deleted_at", null).order("thu_tu"),
    sb.from("comment_templates").select("id, noi_dung, thu_tu").order("thu_tu"),
    sb.from("message_templates").select("id, ten, noi_dung, mac_dinh").order("mac_dinh", { ascending: false }),
    caiDat(sb),
  ]);
  return (
    <div className="space-y-5">
      <PageHeader title="Cài đặt" actions={<>
        <ButtonLink href="/gv/cai-dat/thung-rac" variant="outline"><Trash2 className="h-4 w-4" /> Thùng rác</ButtonLink>
        <ButtonLink href="/gv/cai-dat/nhat-ky" variant="outline"><History className="h-4 w-4" /> Nhật ký thay đổi</ButtonLink>
      </>} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card><CardTitle>Loại buổi</CardTitle><LoaiBuoiList ds={loai} /></Card>
        <Card><CardTitle>Phân loại tài liệu</CardTitle><DanhMucDon bang="material_categories" ds={cats ?? []} /></Card>
        <Card><CardTitle>Nhận xét mẫu khi chấm</CardTitle><DanhMucDon bang="comment_templates" ds={nx ?? []} /></Card>
        <Card><CardTitle>Mẫu tin nhắn phụ huynh</CardTitle><DanhMucDon bang="message_templates" ds={mt ?? []} /></Card>
        <Card><CardTitle>Quy tắc chung</CardTitle><QuyTacForm lamTron={Number(cd.lam_tron_diem ?? 1)} choNopTre={cd.cho_nop_tre_mac_dinh !== false} hsTaiPhieu={cd.hs_tai_phieu_tien_do === true} /></Card>
        <Card><CardTitle>Đổi mật khẩu giáo viên</CardTitle><DoiMatKhauGvForm /></Card>
      </div>
    </div>
  );
}
