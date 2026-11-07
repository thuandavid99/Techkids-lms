import { createClient } from "@/lib/supabase/server";
import { cacLop, layHet } from "@/lib/server/data";
import { Card, PageHeader } from "@/components/ui/Card";
import { ApDung } from "@/components/teacher/ApDung";
import { tenBuoi } from "@/lib/domain/naming";
import { cmpKey } from "@/lib/domain/order";

export const metadata = { title: "Áp dụng chương trình cho lớp" };

export default async function Page({ searchParams }: { searchParams: Promise<{ lop?: string; ct?: string }> }) {
  const sp = await searchParams;
  const sb = await createClient();
  const [lops, { data: cts }, { data: cc }, { data: mods }, lessons] = await Promise.all([
    cacLop(sb),
    sb.from("curricula").select("id, ten").is("deleted_at", null).order("tao_luc"),
    sb.from("class_curriculum").select("*"),
    sb.from("modules").select("id, thu_tu").is("deleted_at", null),
    layHet<{ id: string; curriculum_id: string; module_id: string | null; thu_tu: string; nhan_buoi: string; tieu_de: string; class_id: string | null }>((a, b) =>
      sb.from("lessons").select("id, curriculum_id, module_id, thu_tu, nhan_buoi, tieu_de, class_id").is("ghi_de_cua", null).is("deleted_at", null).range(a, b)),
  ]);
  const mk = new Map((mods ?? []).map((m) => [m.id, m.thu_tu]));
  const key = (id: string | null) => (id && mk.get(id)) || "~~~~";
  const buoiTheoCt: Record<string, { id: string; ten: string; nhan: string; classId: string | null }[]> = {};
  for (const l of [...lessons].sort((a, b) => cmpKey(key(a.module_id), key(b.module_id)) || cmpKey(a.thu_tu, b.thu_tu))) {
    if (l.module_id && !mk.has(l.module_id)) continue; // module đã xóa
    (buoiTheoCt[l.curriculum_id] ??= []).push({ id: l.id, ten: tenBuoi(l.nhan_buoi, l.tieu_de), nhan: l.nhan_buoi, classId: l.class_id });
  }
  const ccMap = new Map((cc ?? []).map((x) => [x.class_id, x]));
  return (
    <Card>
      <PageHeader title="Áp dụng chương trình cho lớp" sub="Chọn lớp, ngày bắt đầu và các thứ học — hệ thống tự điền ngày học cho từng buổi (buổi gộp “10–11” chiếm 2 ca)." />
      <ApDung lopMacDinh={sp.lop ?? ""} ctMacDinh={sp.ct ?? ""} cts={cts ?? []} buoiTheoCt={buoiTheoCt}
        lops={lops.map((l) => ({ id: l.id, ten_lop: l.ten_lop, ctId: ccMap.get(l.id)?.curriculum_id ?? null, ngayBatDau: ccMap.get(l.id)?.ngay_bat_dau ?? null, thu: ccMap.get(l.id)?.cac_thu_trong_tuan ?? [] }))} />
    </Card>
  );
}
