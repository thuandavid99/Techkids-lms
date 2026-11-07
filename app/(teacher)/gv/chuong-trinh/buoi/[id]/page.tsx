import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cacLoaiBuoi, modulesCua, topicsCua } from "@/lib/server/data";
import { Card, CardTitle, PageGrid, PageHeader } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { ButtonLink } from "@/components/ui/Button";
import { BuoiForm, BuoiTheoLop, type BuoiVals } from "@/components/teacher/BuoiForm";
import { ThemTaiLieu, TaiLieuDong, type TLRow } from "@/components/teacher/TaiLieuAdmin";
import { ThemBaiTapButton } from "@/components/teacher/ThemBaiTapButton";
import { tenBuoi, tenBaiTap } from "@/lib/domain/naming";
import { toVNInput } from "@/lib/domain/time";
import { cmpKey } from "@/lib/domain/order";

export const metadata = { title: "Soạn buổi học" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sb = await createClient();
  const { data: l } = await sb.from("lessons").select("*").eq("id", id).is("ghi_de_cua", null).maybeSingle();
  if (!l) notFound();
  const [loai, modules, { data: cc }, { data: rieng }, { data: mats }, { data: bts }, { data: cats }, { data: cls }, { data: dsBuoi }] = await Promise.all([
    cacLoaiBuoi(sb), modulesCua(sb, l.curriculum_id),
    sb.from("class_curriculum").select("class_id, classes(ten_lop, deleted_at)").eq("curriculum_id", l.curriculum_id),
    sb.from("lessons").select("*").eq("ghi_de_cua", id).is("deleted_at", null),
    sb.from("materials").select("*, material_classes(class_id)").eq("lesson_id", id).is("deleted_at", null),
    sb.from("assignments").select("id, ma, tieu_de, loai_nop, bat_buoc, hien_thi, thu_tu, submissions(count)").eq("lesson_id", id).is("ghi_de_cua", null).is("deleted_at", null),
    sb.from("material_categories").select("id, ten").is("deleted_at", null).order("thu_tu"),
    sb.from("class_lessons").select("*").eq("lesson_id", id),
    sb.from("lessons").select("id, nhan_buoi, tieu_de, thu_tu").eq("curriculum_id", l.curriculum_id).is("ghi_de_cua", null).is("deleted_at", null),
  ]);
  const topics = await topicsCua(sb, modules.map((m) => m.id));
  const lops = ((cc as unknown as { class_id: string; classes: { ten_lop: string; deleted_at: string | null } | null }[]) ?? [])
    .filter((x) => x.classes && !x.classes.deleted_at && (!l.class_id || x.class_id === l.class_id)).map((x) => ({ id: x.class_id, ten: x.classes!.ten_lop }));
  const vals = (x: Record<string, unknown>): BuoiVals => ({ tieu_de: String(x.tieu_de ?? ""), nhan_buoi: String(x.nhan_buoi ?? ""), loai_id: String(x.loai_id ?? ""), tom_tat: String(x.tom_tat ?? ""), noi_dung_kien_thuc: String(x.noi_dung_kien_thuc ?? ""), ban_nhap: !!x.ban_nhap });
  const tl: TLRow[] = ((mats as (TLRow & { material_classes: { class_id: string }[] })[]) ?? []).map((m) => ({ ...m, lops: m.material_classes.map((x) => x.class_id) }));
  const catOpts = (cats ?? []).map((c) => ({ id: c.id, ten: c.ten }));
  const buoiOpts = (dsBuoi ?? []).sort((a, b) => cmpKey(a.thu_tu, b.thu_tu)).map((b) => ({ id: b.id, ten: tenBuoi(b.nhan_buoi, b.tieu_de) }));
  const clMap = new Map((cls ?? []).map((c) => [c.class_id, c]));

  return (
    <PageGrid
      main={<>
        <Card>
          <PageHeader back={{ href: `/gv/chuong-trinh?ct=${l.curriculum_id}`, label: "Chương trình học" }} title={`Soạn ${tenBuoi(l.nhan_buoi, l.tieu_de)}`}
            sub={<>{l.class_id && <Pill mau="purple">Buổi riêng của lớp {lops[0]?.ten}</Pill>} {l.ban_nhap && <Pill mau="yellow">Bản nháp</Pill>}</>} />
          <BuoiForm id={id} v={vals(l)} banRieng={Object.fromEntries((rieng ?? []).map((r) => [r.class_id, vals(r)]))} lops={lops}
            loai={loai.map((x) => ({ id: x.id, ten: x.ten }))} modules={modules.map((m) => ({ id: m.id, ten: m.ten }))}
            topics={topics.map((t) => ({ id: t.id, ten: t.ten, module_id: t.module_id }))} moduleId={l.module_id ?? ""} topicId={l.topic_id ?? ""} laBuoiRieng={!!l.class_id} />
        </Card>
        <Card>
          <CardTitle action={<ThemTaiLieu lessonId={id} cats={catOpts} />}>Tài liệu của buổi</CardTitle>
          {tl.length === 0 ? <p className="text-sm text-slate-500">Chưa có tài liệu. Tải file (Word, PDF, slide, ảnh…) hoặc thêm link.</p>
            : <ul className="divide-y divide-vien">{tl.sort((a, b) => cmpKey((a as unknown as { thu_tu: string }).thu_tu, (b as unknown as { thu_tu: string }).thu_tu)).map((m) => <TaiLieuDong key={m.id} m={m} cats={catOpts} lops={lops} buois={buoiOpts} />)}</ul>}
        </Card>
        <Card>
          <CardTitle action={<ThemBaiTapButton lessonId={id} />}>Bài tập của buổi</CardTitle>
          {!bts?.length ? <p className="text-sm text-slate-500">Chưa có bài tập.</p> : (
            <ul className="divide-y divide-vien">
              {(bts as unknown as { id: string; ma: string; tieu_de: string; loai_nop: string; bat_buoc: boolean; hien_thi: boolean; thu_tu: string; submissions: { count: number }[] }[]).sort((a, b) => cmpKey(a.thu_tu, b.thu_tu)).map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-2 py-2.5">
                  <span className="flex-1 font-semibold">{tenBaiTap(b.ma, b.tieu_de)} {!b.bat_buoc && <Pill>tùy chọn</Pill>} {!b.hien_thi && <Pill>ẩn</Pill>}</span>
                  <span className="text-sm text-slate-500">{b.submissions?.[0]?.count ?? 0} bài nộp</span>
                  <ButtonLink href={`/gv/bai-tap/sua/${b.id}`} size="sm" variant="outline">Sửa / hạn nộp</ButtonLink>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </>}
      aside={<>
        <Card>
          <CardTitle>Cài đặt theo lớp</CardTitle>
          <BuoiTheoLop lessonId={id} ds={lops.map((c) => { const x = clMap.get(c.id); return { classId: c.id, ten: c.ten, ngay_hoc: x?.ngay_hoc ?? "", hien_thi: x?.hien_thi ?? true, ngay_mo: toVNInput(x?.ngay_mo), da_day: x?.da_day ?? false }; })} />
          <p className="mt-2 text-xs text-slate-500">Hẹn giờ mở: học sinh chỉ thấy buổi từ thời điểm đó. “Áp dụng cho nhiều lớp”: chọn “Tất cả lớp” ở form bên trái.</p>
        </Card>
      </>}
    />
  );
}
