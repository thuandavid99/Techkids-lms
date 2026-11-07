import "server-only";
import { createClient } from "@/lib/supabase/server";
import { buoiLop, cacLoaiBuoi, dongBaiHs, modulesCua, toDongBai, caiDat } from "./data";
import type { Profile, LoaiBuoi } from "@/lib/types";

/** Tải mọi dữ liệu cần cho các màn học sinh (RLS tự giới hạn đúng phần của em) */
export async function duLieuHs(p: Profile) {
  const sb = await createClient();
  if (!p.class_id) {
    return { sb, lop: null, rows: [], dong: [], buoi: [], loai: new Map<string, LoaiBuoi>(), modules: [], lichThu: [] as number[], cd: {} as Record<string, unknown> };
  }
  const [rows, buoi, loai, lopQ, ccQ, cd] = await Promise.all([
    dongBaiHs(sb, p.id),
    buoiLop(sb, p.class_id),
    cacLoaiBuoi(sb),
    sb.from("classes").select("*").eq("id", p.class_id).maybeSingle(),
    sb.from("class_curriculum").select("curriculum_id, cac_thu_trong_tuan").eq("class_id", p.class_id).maybeSingle(),
    caiDat(sb),
  ]);
  const modules = ccQ.data ? await modulesCua(sb, ccQ.data.curriculum_id) : [];
  const buoiMo = buoi.filter((b) => b.da_mo);
  const idsMo = new Set(buoiMo.map((b) => b.lesson_id));
  const rowsMo = rows.filter((r) => r.da_mo && idsMo.has(r.lesson_id));
  return {
    sb, lop: lopQ.data as { id: string; ten_lop: string; nam_hoc: string } | null,
    rows: rowsMo, dong: rowsMo.map(toDongBai), buoi: buoiMo,
    loai: new Map(loai.map((l) => [l.id, l])), modules, lichThu: (ccQ.data?.cac_thu_trong_tuan as number[]) ?? [], cd,
  };
}
