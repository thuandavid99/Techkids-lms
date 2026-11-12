import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubNavLop } from "@/components/teacher/SubNavLop";

export default async function LopLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sb = await createClient();
  const { data: lop } = await sb.from("classes").select("id, ten_lop").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!lop) notFound();
  return (
    <div>
      <SubNavLop id={id} />
      {children}
    </div>
  );
}
