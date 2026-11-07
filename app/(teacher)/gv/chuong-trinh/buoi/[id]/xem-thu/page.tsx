import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IMG } from "@/lib/brand";
import { Card, PageHeader } from "@/components/ui/Card";
import { LessonIcon } from "@/components/ui/Misc";
import { Markdown } from "@/components/ui/Markdown";
import { Pill } from "@/components/ui/Pill";
import { tenBuoi, tenBaiTap } from "@/lib/domain/naming";

export const metadata = { title: "Xem thử như học sinh" };

/** Xem thử buổi học như học sinh (dùng nội dung bản riêng của lớp nếu có ?lop=) */
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lop?: string }> }) {
  const { id } = await params;
  const { lop } = await searchParams;
  const sb = await createClient();
  const { data: base } = await sb.from("lessons").select("*, lesson_types(icon, mau)").eq("id", id).maybeSingle();
  if (!base) notFound();
  const { data: rieng } = lop ? await sb.from("lessons").select("*").eq("ghi_de_cua", id).eq("class_id", lop).is("deleted_at", null).maybeSingle() : { data: null };
  const l = rieng ?? base;
  const [{ data: mats }, { data: bts }] = await Promise.all([
    sb.from("materials").select("id, tieu_de, nguon").eq("lesson_id", id).is("deleted_at", null).eq("hien_thi", true),
    sb.from("assignments").select("ma, tieu_de, bat_buoc").eq("lesson_id", id).is("ghi_de_cua", null).is("deleted_at", null).eq("hien_thi", true),
  ]);
  const lt = base.lesson_types as { icon: string; mau: string } | null;
  return (
    <Card>
      <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">👀 Bản xem thử — giao diện học sinh {rieng ? "(bản riêng của lớp)" : "(nội dung chung)"}{l.ban_nhap ? " · đang là bản nháp, học sinh CHƯA thấy" : ""}</p>
      <PageHeader title={<span className="flex items-center gap-4"><LessonIcon icon={lt?.icon} mau={lt?.mau} size={64} />{tenBuoi(l.nhan_buoi, l.tieu_de)}</span>} sub={l.tom_tat} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          {l.noi_dung_kien_thuc ? <Markdown>{l.noi_dung_kien_thuc}</Markdown> : <p className="text-slate-500">(Chưa có phần kiến thức)</p>}
          <h2 className="mt-6 font-extrabold">Tài liệu</h2>
          <ul className="mt-1 list-disc pl-5">{(mats ?? []).map((m) => <li key={m.id}>{m.tieu_de} {m.nguon === "link" && <Pill mau="blue">link</Pill>}</li>)}{!mats?.length && <li className="text-slate-500">Không có</li>}</ul>
          <h2 className="mt-4 font-extrabold">Bài tập</h2>
          <ul className="mt-1 list-disc pl-5">{(bts ?? []).map((b) => <li key={b.ma}>{tenBaiTap(b.ma, b.tieu_de)} {!b.bat_buoc && "(tùy chọn)"}</li>)}{!bts?.length && <li className="text-slate-500">Không có</li>}</ul>
        </div>
        <Image src={IMG.laptop} alt="" width={240} height={220} className="hidden h-auto w-full lg:block" />
      </div>
    </Card>
  );
}
