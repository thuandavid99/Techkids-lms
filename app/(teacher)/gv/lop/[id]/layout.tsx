import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubNav } from "@/components/teacher/SubNav";

export default async function LopLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sb = await createClient();
  const { data: lop } = await sb.from("classes").select("id, ten_lop").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!lop) notFound();
  const b = `/gv/lop/${id}`;
  return (
    <div>
      <SubNav items={[
        { href: b, label: "Ma trận tiến độ", exact: true },
        { href: `${b}/tinh-hinh`, label: "Tình hình nộp theo buổi" },
        { href: `${b}/lich`, label: "Lịch học & buổi" },
        { href: `/gv/hoc-sinh?lop=${id}`, label: "Học sinh" },
        { href: `${b}/thong-bao`, label: "Thông báo lớp" },
      ]} />
      {children}
    </div>
  );
}
