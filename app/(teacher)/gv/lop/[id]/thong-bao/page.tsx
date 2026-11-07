import { createClient } from "@/lib/supabase/server";
import { cacLop } from "@/lib/server/data";
import { Card, PageGrid } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { SoanThongBao, DongThongBao } from "@/components/teacher/ThongBaoLop";

export const metadata = { title: "Thông báo lớp" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const [lops, { data: ds }] = await Promise.all([
    cacLop(sb),
    sb.from("announcements").select("id, noi_dung, tao_luc").eq("class_id", id).is("deleted_at", null).order("tao_luc", { ascending: false }),
  ]);
  const ten = lops.find((l) => l.id === id)?.ten_lop;
  return (
    <PageGrid
      main={<>
        <Card><h1 className="h-page mb-4">Thông báo lớp {ten}</h1><SoanThongBao lops={lops} macDinh={id} /></Card>
        <Card>
          <h2 className="h-card mb-3">Đã đăng</h2>
          {!ds?.length ? <EmptyState title="Chưa có thông báo nào" /> : <ul className="space-y-3">{ds.map((a) => <DongThongBao key={a.id} a={a} />)}</ul>}
        </Card>
      </>}
    />
  );
}
