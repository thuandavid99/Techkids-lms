import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile, laQuanTri } from "@/lib/auth";
import { LoaiPill } from "@/components/ui/Pill";
import { tenBuoi } from "@/lib/domain/naming";
import { cacLoaiBuoi, modulesCua, topicsCua, layHet } from "@/lib/server/data";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { ButtonLink } from "@/components/ui/Button";
import { CTToolbar } from "@/components/teacher/CTToolbar";
import { ChuongTrinhBoard, type ModuleCT } from "@/components/teacher/ChuongTrinhBoard";
import { cmpKey } from "@/lib/domain/order";

export const metadata = { title: "Chương trình học" };

export default async function Page({ searchParams }: { searchParams: Promise<{ ct?: string }> }) {
  const { ct: ctUrl } = await searchParams;
  const sb = await createClient();
  const qt = laQuanTri(await getProfile());
  const { data: cts } = await sb.from("curricula").select("id, ten, mo_ta").is("deleted_at", null).order("tao_luc");
  const ct = (cts ?? []).find((c) => c.id === ctUrl) ?? cts?.[0] ?? null;
  if (!ct) {
    return (
      <Card>
        {qt && <CTToolbar cts={[]} ct={null} moduleCuoi={null} lops={[]} />}
        {qt ? <EmptyState title="Chưa có chương trình nào" hint="Tạo chương trình mới hoặc nhập PPCT từ file Excel của thầy." action={<ButtonLink href="/gv/chuong-trinh/nhap-excel" variant="green">Nhập PPCT từ Excel</ButtonLink>} />
          : <EmptyState title="Chưa có chương trình nào" hint="Quản trị sẽ tạo chương trình học chung." />}
      </Card>
    );
  }
  const [modules, loai, lessons, { data: lopDung }] = await Promise.all([
    modulesCua(sb, ct.id), cacLoaiBuoi(sb),
    layHet<{ id: string; module_id: string | null; topic_id: string | null; thu_tu: string; nhan_buoi: string; tieu_de: string; tom_tat: string | null; loai_id: string | null; class_id: string | null }>((a, b) =>
      sb.from("lessons").select("id, module_id, topic_id, thu_tu, nhan_buoi, tieu_de, tom_tat, loai_id, class_id").eq("curriculum_id", ct.id).is("ghi_de_cua", null).is("deleted_at", null).range(a, b)),
    sb.from("class_curriculum").select("class_id, classes(id, ten_lop)").eq("curriculum_id", ct.id),
  ]);
  const ids = lessons.map((l) => l.id);
  const [topics, { data: mats }, { data: bts }] = await Promise.all([
    topicsCua(sb, modules.map((m) => m.id)),
    ids.length ? sb.from("materials").select("lesson_id").in("lesson_id", ids).is("deleted_at", null) : Promise.resolve({ data: [] as { lesson_id: string }[] }),
    ids.length ? sb.from("assignments").select("id, lesson_id, submissions(count)").in("lesson_id", ids).is("ghi_de_cua", null).is("deleted_at", null) : Promise.resolve({ data: [] as unknown[] }),
  ]);
  const tenTopic = new Map(topics.map((t) => [t.id, t.ten]));
  const loaiMap = new Map(loai.map((l) => [l.id, l]));
  const lops = ((lopDung as unknown as { classes: { id: string; ten_lop: string } | null }[]) ?? []).map((x) => x.classes).filter(Boolean) as { id: string; ten_lop: string }[];
  const tenLop = new Map(lops.map((l) => [l.id, l.ten_lop]));
  const dem = (arr: { lesson_id: string }[] | null, id: string) => (arr ?? []).filter((x) => x.lesson_id === id).length;
  const btRows = (bts as { lesson_id: string; submissions: { count: number }[] }[]) ?? [];

  const ms: ModuleCT[] = [...modules.map((m) => ({ id: m.id, ten: m.ten })), ...(lessons.some((l) => !l.module_id) ? [{ id: "", ten: "Chưa xếp module" }] : [])].map((m) => ({
    ...m,
    buoi: lessons.filter((l) => (l.module_id ?? "") === m.id).sort((a, b) => cmpKey(a.thu_tu, b.thu_tu)).map((l) => {
      const lt = l.loai_id ? loaiMap.get(l.loai_id) : undefined;
      return {
        id: l.id, nhan: l.nhan_buoi, ten: l.tieu_de, tomTat: l.tom_tat ?? "", loaiTen: lt?.ten ?? "", loaiMau: lt?.mau ?? "gray", noiBat: !!lt?.noi_bat,
        soTL: dem(mats, l.id), soBT: btRows.filter((x) => x.lesson_id === l.id).length,
        soBaiNop: btRows.filter((x) => x.lesson_id === l.id).reduce((s, x) => s + (x.submissions?.[0]?.count ?? 0), 0),
        chuDe: l.topic_id ? tenTopic.get(l.topic_id) ?? null : null, rieng: l.class_id ? tenLop.get(l.class_id) ?? "?" : null,
      };
    }),
  }));

  // Giáo viên thường: CHẾ ĐỘ XEM (danh sách gọn, bấm buổi để xem / sửa bản riêng cho lớp mình)
  if (!qt) {
    return (
      <Card>
        <h1 className="h-page mb-2">Chương trình học (PPCT)</h1>
        <p className="mb-4 rounded-xl bg-xanh-50 px-3 py-2 text-sm text-slate-700">
          Chương trình chung do quản trị soạn. Bấm vào buổi để xem nội dung; thầy/cô có thể <b>sửa bản riêng</b> cho lớp mình và đặt lịch / mở buổi trong <b>Lớp của tôi → Lịch</b>.
        </p>
        {(cts ?? []).length > 1 && (
          <div className="mb-4 flex flex-wrap gap-2">{(cts ?? []).map((c) => <ButtonLink key={c.id} href={`/gv/chuong-trinh?ct=${c.id}`} size="sm" variant={c.id === ct.id ? "navy" : "outline"}>{c.ten}</ButtonLink>)}</div>
        )}
        <div className="space-y-4">
          {ms.map((m) => (
            <section key={m.id || "khac"}>
              <h2 className="mb-2 rounded-xl bg-xanh-50 px-3 py-2 font-bold">{m.ten} <span className="font-normal text-slate-500">({m.buoi.length} buổi)</span></h2>
              <ul className="grid gap-2 md:grid-cols-2">
                {m.buoi.map((b) => (
                  <li key={b.id}>
                    <Link href={`/gv/chuong-trinh/buoi/${b.id}`} className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 hover:border-xanh-500 ${b.noiBat ? "border-cam-400 bg-cam-50" : "border-vien bg-white"}`}>
                      <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{tenBuoi(b.nhan, b.ten)}</span>
                        <span className="text-xs text-slate-500">{b.soTL} tài liệu · {b.soBT} bài tập{b.rieng ? ` · riêng lớp ${b.rieng}` : ""}</span></span>
                      {b.loaiTen && <LoaiPill ten={b.loaiTen} mau={b.loaiMau} />}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="h-page mb-4">Chương trình học (PPCT)</h1>
      <CTToolbar cts={cts ?? []} ct={ct} moduleCuoi={modules.at(-1)?.id ?? null} lops={lops} />
      <p className="mb-4 mt-3 text-sm text-slate-500">
        Đang dùng cho: <b>{lops.length ? lops.map((l) => `Lớp ${l.ten_lop}`).join(", ") : "chưa lớp nào"}</b> · {lessons.length} buổi · Kéo biểu tượng ⋮⋮ để đổi thứ tự (kéo sang module khác cũng được).
      </p>
      {lessons.length === 0 && modules.length === 0
        ? <EmptyState title="Chưa có buổi học nào" hint="Bấm “Thêm buổi” hoặc “Nhập từ Excel”." />
        : <ChuongTrinhBoard ctId={ct.id} modules={ms} />}
    </Card>
  );
}
