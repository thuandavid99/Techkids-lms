import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui/Card";
import { ConfirmButton, ActionButton } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/States";
import { khoiPhuc, xoaVinhVien, lamSachThungRac } from "@/lib/actions/gv/caidat";
import { fmtDate } from "@/lib/domain/time";
import { tenBuoi, tenBaiTap } from "@/lib/domain/naming";

export const metadata = { title: "Thùng rác" };
type Bang = "lessons" | "modules" | "topics" | "assignments" | "materials" | "classes" | "curricula" | "profiles" | "announcements";

export default async function Page() {
  const sb = await createClient();
  const q = (b: Bang, cot: string) => sb.from(b).select(`id, deleted_at, ${cot}`).not("deleted_at", "is", null).order("deleted_at", { ascending: false }).limit(200);
  const [ls, ms, ts, as, mats, cls, cts, hs, ans] = await Promise.all([
    q("lessons", "nhan_buoi, tieu_de"), q("modules", "ten"), q("topics", "ten"), q("assignments", "ma, tieu_de"), q("materials", "tieu_de"),
    q("classes", "ten_lop"), q("curricula", "ten"), q("profiles", "ho_ten, ma_hs"), q("announcements", "noi_dung"),
  ]);
  type R = Record<string, string>;
  const ds: { bang: Bang; loai: string; id: string; ten: string; luc: string }[] = [
    ...((ls.data as unknown as R[]) ?? []).map((x) => ({ bang: "lessons" as Bang, loai: "Buổi học", id: x.id, ten: tenBuoi(x.nhan_buoi, x.tieu_de), luc: x.deleted_at })),
    ...((ms.data as unknown as R[]) ?? []).map((x) => ({ bang: "modules" as Bang, loai: "Module", id: x.id, ten: x.ten, luc: x.deleted_at })),
    ...((ts.data as unknown as R[]) ?? []).map((x) => ({ bang: "topics" as Bang, loai: "Chủ đề", id: x.id, ten: x.ten, luc: x.deleted_at })),
    ...((as.data as unknown as R[]) ?? []).map((x) => ({ bang: "assignments" as Bang, loai: "Bài tập", id: x.id, ten: tenBaiTap(x.ma, x.tieu_de), luc: x.deleted_at })),
    ...((mats.data as unknown as R[]) ?? []).map((x) => ({ bang: "materials" as Bang, loai: "Tài liệu", id: x.id, ten: x.tieu_de, luc: x.deleted_at })),
    ...((cls.data as unknown as R[]) ?? []).map((x) => ({ bang: "classes" as Bang, loai: "Lớp", id: x.id, ten: `Lớp ${x.ten_lop}`, luc: x.deleted_at })),
    ...((cts.data as unknown as R[]) ?? []).map((x) => ({ bang: "curricula" as Bang, loai: "Chương trình", id: x.id, ten: x.ten, luc: x.deleted_at })),
    ...((hs.data as unknown as R[]) ?? []).map((x) => ({ bang: "profiles" as Bang, loai: "Học sinh", id: x.id, ten: `${x.ho_ten} (${x.ma_hs})`, luc: x.deleted_at })),
    ...((ans.data as unknown as R[]) ?? []).map((x) => ({ bang: "announcements" as Bang, loai: "Thông báo", id: x.id, ten: x.noi_dung.slice(0, 80), luc: x.deleted_at })),
  ].sort((a, b) => b.luc.localeCompare(a.luc));
  const conLai = (luc: string) => Math.max(0, 30 - Math.floor((Date.now() - new Date(luc).getTime()) / 864e5));

  return (
    <Card>
      <PageHeader back={{ href: "/gv/cai-dat", label: "Cài đặt" }} title="Thùng rác"
        sub="Mục đã xóa được giữ 30 ngày để khôi phục. Bấm “Làm sạch” để xóa vĩnh viễn các mục quá 30 ngày."
        actions={<ConfirmButton action={lamSachThungRac} danger variant="outlineGray" size="md" title="Làm sạch thùng rác?" confirmText="Làm sạch"
          message="Xóa vĩnh viễn mọi mục đã nằm trong thùng rác quá 30 ngày. Không thể khôi phục. Buổi/bài tập đã có bài nộp sẽ được giữ lại.">Làm sạch</ConfirmButton>} />
      {ds.length === 0 ? <EmptyState title="Thùng rác trống" /> : (
        <div className="table-wrap">
          <table className="tbl min-w-[720px]">
            <thead><tr><th>Loại</th><th>Tên</th><th>Xóa ngày</th><th>Còn</th><th className="text-right">Thao tác</th></tr></thead>
            <tbody>{ds.map((x) => (
              <tr key={`${x.bang}:${x.id}`}>
                <td className="text-sm text-slate-500">{x.loai}</td><td className="font-medium">{x.ten}</td><td className="text-sm">{fmtDate(x.luc)}</td><td className="text-sm">{conLai(x.luc)} ngày</td>
                <td><div className="flex justify-end gap-2">
                  <ActionButton action={khoiPhuc.bind(null, x.bang, x.id)}>Khôi phục</ActionButton>
                  <ConfirmButton action={xoaVinhVien.bind(null, x.bang, x.id)} danger variant="outlineGray" title="Xóa vĩnh viễn?" confirmText="Xóa vĩnh viễn"
                    message={<><b>{x.ten}</b> sẽ bị xóa hẳn. <b>Không thể khôi phục.</b>{x.bang === "profiles" && " Tài khoản và mọi bài nộp của học sinh sẽ mất."}</>}>Xóa vĩnh viễn</ConfirmButton>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
