import { createClient } from "@/lib/supabase/server";
import { cacLop, layHet } from "@/lib/server/data";
import { Card, PageHeader } from "@/components/ui/Card";
import { KhoGV } from "@/components/teacher/KhoGV";
import type { TLRow } from "@/components/teacher/TaiLieuAdmin";
import { tenBuoi } from "@/lib/domain/naming";
import { cmpKey } from "@/lib/domain/order";

export const metadata = { title: "Kho học liệu (giáo viên)" };

export default async function Page() {
  const sb = await createClient();
  const [mats, { data: cats }, lops, { data: ls }] = await Promise.all([
    layHet<TLRow & { material_classes: { class_id: string }[] }>((a, b) => sb.from("materials").select("*, material_classes(class_id)").is("deleted_at", null).order("tao_luc", { ascending: false }).range(a, b)),
    sb.from("material_categories").select("id, ten").is("deleted_at", null).order("thu_tu"),
    cacLop(sb),
    sb.from("lessons").select("id, nhan_buoi, tieu_de, thu_tu, curricula(ten)").is("ghi_de_cua", null).is("deleted_at", null),
  ]);
  const buois = ((ls as unknown as { id: string; nhan_buoi: string; tieu_de: string; thu_tu: string; curricula: { ten: string } | null }[]) ?? [])
    .sort((a, b) => (a.curricula?.ten ?? "").localeCompare(b.curricula?.ten ?? "") || cmpKey(a.thu_tu, b.thu_tu))
    .map((b) => ({ id: b.id, ten: `${tenBuoi(b.nhan_buoi, b.tieu_de)}${b.curricula ? ` (${b.curricula.ten})` : ""}` }));
  return (
    <Card>
      <PageHeader title="Kho học liệu" sub="Tất cả tài liệu theo buổi và tài liệu chung. Tick chọn để ẩn/hiện, chọn lớp xem, chuyển buổi hàng loạt." />
      <KhoGV ds={mats.map((m) => ({ ...m, lops: m.material_classes.map((x) => x.class_id) }))} cats={cats ?? []} lops={lops.map((l) => ({ id: l.id, ten: l.ten_lop }))} buois={buois} />
    </Card>
  );
}
