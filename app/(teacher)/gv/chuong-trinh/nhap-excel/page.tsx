import { createClient } from "@/lib/supabase/server";
import { cacLoaiBuoi } from "@/lib/server/data";
import { Card, PageHeader } from "@/components/ui/Card";
import { NhapPPCT } from "@/components/teacher/NhapPPCT";

export const metadata = { title: "Nhập PPCT từ Excel" };

export default async function Page({ searchParams }: { searchParams: Promise<{ ct?: string }> }) {
  const { ct = "" } = await searchParams;
  const sb = await createClient();
  const [loai, { data: cts }] = await Promise.all([cacLoaiBuoi(sb), sb.from("curricula").select("id, ten").is("deleted_at", null).order("tao_luc")]);
  return (
    <Card>
      <PageHeader title="Nhập PPCT từ Excel" sub="Nhận diện tự động: loại buổi (Kiểm tra/Contest/Ôn tập/Case study…), ranh giới module (“Kiểm tra module N” hoặc dòng tô màu), nhãn “10,11” → “10–11”, gom chủ đề, link tài liệu." />
      <NhapPPCT loai={loai.map((l) => ({ id: l.id, ten: l.ten, tu_khoa: l.tu_khoa, noi_bat: l.noi_bat, mau: l.mau }))} cts={cts ?? []} ctMacDinh={(cts ?? []).some((c) => c.id === ct) ? ct : ""} />
    </Card>
  );
}
