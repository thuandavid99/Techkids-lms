import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, PageGrid } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { NotificationList } from "@/components/shared/NotificationList";
import { fmtDateTime } from "@/lib/domain/time";

export const metadata = { title: "Thông báo" };

export default async function Page() {
  const p = await requireStudent();
  const sb = await createClient();
  const [{ data: ds }, { data: lopTB }] = await Promise.all([
    sb.from("notifications").select("*").eq("user_id", p.id).order("tao_luc", { ascending: false }).limit(200),
    sb.from("announcements").select("id, noi_dung, tao_luc").is("deleted_at", null).order("tao_luc", { ascending: false }).limit(5),
  ]);
  return (
    <PageGrid
      main={
        <Card>
          <h1 className="h-page mb-4">Thông báo</h1>
          {!ds?.length ? <EmptyState title="Chưa có thông báo nào" /> : <NotificationList ds={ds} />}
        </Card>
      }
      aside={<>
        <Card>
          <h2 className="h-card mb-3">Thông báo của lớp</h2>
          {!lopTB?.length ? <p className="text-sm text-slate-500">Chưa có.</p> : (
            <ul className="space-y-3">
              {lopTB.map((a) => <li key={a.id} className="rounded-xl bg-tim-50 px-3 py-2 text-sm"><p className="chu-dai whitespace-pre-line">{a.noi_dung}</p><p className="mt-1 text-xs text-slate-500">{fmtDateTime(a.tao_luc)}</p></li>)}
            </ul>
          )}
        </Card>
      </>}
    />
  );
}
