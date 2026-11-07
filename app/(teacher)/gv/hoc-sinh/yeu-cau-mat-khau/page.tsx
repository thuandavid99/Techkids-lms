import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { ResetYeuCau } from "@/components/teacher/ResetYeuCau";
import { fmtShort } from "@/lib/domain/time";

export const metadata = { title: "Yêu cầu cấp lại mật khẩu" };

export default async function Page() {
  const sb = await createClient();
  const { data } = await sb.from("password_requests").select("id, tao_luc, student_id, profiles(ho_ten, ma_hs, classes!profiles_class_id_fkey(ten_lop))").eq("trang_thai", "cho").order("tao_luc");
  const ds = (data as unknown as { id: string; tao_luc: string; student_id: string; profiles: { ho_ten: string; ma_hs: string; classes: { ten_lop: string } | null } }[]) ?? [];
  const ids = [...new Set(ds.map((d) => d.student_id))];
  return (
    <Card>
      <PageHeader back={{ href: "/gv/hoc-sinh", label: "Quản lý học sinh" }} title="Yêu cầu cấp lại mật khẩu" actions={ids.length > 1 && <ResetYeuCau ids={ids} nhan={`Reset tất cả (${ids.length})`} tatCa />} />
      {ds.length === 0 ? <EmptyState title="Không có yêu cầu nào" hint="Khi học sinh bấm “Quên mật khẩu?”, yêu cầu sẽ hiện ở đây và chuông có chấm đỏ." /> : (
        <ul className="divide-y divide-vien rounded-2xl border border-vien bg-white">
          {ds.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="flex-1"><b>{d.profiles.ho_ten}</b> ({d.profiles.ma_hs}) · Lớp {d.profiles.classes?.ten_lop ?? "?"} · gửi lúc {fmtShort(d.tao_luc)}</span>
              <ResetYeuCau ids={[d.student_id]} />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-sm text-slate-500">Sau khi reset, mật khẩu tạm chỉ hiện một lần. Phát cho học sinh, em đăng nhập và tự đặt mật khẩu mới (một lần).</p>
    </Card>
  );
}
