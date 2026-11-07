import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { NotificationList } from "@/components/shared/NotificationList";

export const metadata = { title: "Thông báo" };

export default async function Page() {
  const p = await getProfile();
  const sb = await createClient();
  const { data } = await sb.from("notifications").select("*").eq("user_id", p!.id).order("tao_luc", { ascending: false }).limit(200);
  return (
    <Card>
      <PageHeader title="Thông báo" sub="Yêu cầu cấp lại mật khẩu, học sinh báo chưa làm được…" />
      {!data?.length ? <EmptyState title="Chưa có thông báo" /> : <NotificationList ds={data} />}
    </Card>
  );
}
