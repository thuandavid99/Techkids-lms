import "server-only";
import { cookies } from "next/headers";
import { cacLop } from "./data";
import type { createClient } from "@/lib/supabase/server";
import type { Lop } from "@/lib/types";

type SB = Awaited<ReturnType<typeof createClient>>;

/** Lớp đang chọn của giáo viên: ưu tiên ?lop= trên URL, rồi cookie, rồi lớp đầu tiên */
export async function lopDangChon(sb: SB, tuUrl?: string | null): Promise<{ lops: Lop[]; lop: Lop | null }> {
  const lops = await cacLop(sb);
  const ck = (await cookies()).get("lop_gv")?.value;
  const lop = lops.find((l) => l.id === tuUrl) ?? lops.find((l) => l.id === ck) ?? lops[0] ?? null;
  return { lops, lop };
}
