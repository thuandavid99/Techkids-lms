import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BaiTapHieuLuc, BuoiHieuLuc, DongBaiHs, LoaiBuoi, Lop, ModuleRow, TopicRow } from "@/lib/types";
import type { DongBai } from "@/lib/domain/stats";
import { cmpKey } from "@/lib/domain/order";

type SB = Awaited<ReturnType<typeof createClient>>;

/** Supabase trả tối đa 1000 dòng/lần → lấy theo trang cho đủ */
export async function layHet<T>(q: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; ; i += 1000) {
    const { data, error } = await q(i, i + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

/** Chuyển dòng view → dạng dùng cho lib/domain (ép kiểu số) */
export type DongDayDu = DongBaiHs & DongBai;
export function toDongBai(r: DongBaiHs): DongDayDu {
  return {
    ...r,
    assignment_id: r.assignment_id, lesson_id: r.lesson_id, module_id: r.module_id,
    diem: r.diem === null ? null : Number(r.diem),
    diem_toi_da: Number(r.diem_toi_da), he_so: Number(r.he_so), hoc_ky: Number(r.hoc_ky),
  };
}

export async function dongBaiLop(sb: SB, classId: string): Promise<DongBaiHs[]> {
  const rows = await layHet<DongBaiHs>((a, b) => sb.from("v_bai_hoc_sinh").select("*").eq("class_id", classId).range(a, b));
  return sapXepDong(rows, await thuTuModule(sb, rows.map((r) => r.module_id)));
}

export async function dongBaiHs(sb: SB, studentId: string): Promise<DongBaiHs[]> {
  const rows = await layHet<DongBaiHs>((a, b) => sb.from("v_bai_hoc_sinh").select("*").eq("student_id", studentId).range(a, b));
  return sapXepDong(rows, await thuTuModule(sb, rows.map((r) => r.module_id)));
}

export async function dongBaiTatCa(sb: SB): Promise<DongBaiHs[]> {
  return layHet<DongBaiHs>((a, b) => sb.from("v_bai_hoc_sinh").select("*").range(a, b));
}

/** Khóa sắp xếp của các module (thứ tự CHUẨN = thứ tự module, rồi thứ tự buổi trong module) */
async function thuTuModule(sb: SB, ids: (string | null)[]): Promise<Map<string, string>> {
  const ds = [...new Set(ids.filter((x): x is string => !!x))];
  if (ds.length === 0) return new Map();
  const { data } = await sb.from("modules").select("id, thu_tu").in("id", ds);
  return new Map(((data as { id: string; thu_tu: string }[]) ?? []).map((m) => [m.id, m.thu_tu]));
}
const KHONG_MODULE = "~~~~"; // buổi không thuộc module nào xếp cuối

function sapXepDong(rows: DongBaiHs[], mod: Map<string, string>) {
  const mk = (id: string | null) => (id && mod.get(id)) || KHONG_MODULE;
  return rows.sort((x, y) => cmpKey(mk(x.module_id), mk(y.module_id)) || cmpKey(x.lesson_thu_tu, y.lesson_thu_tu) || cmpKey(x.thu_tu, y.thu_tu) || x.ma.localeCompare(y.ma, "vi", { numeric: true }));
}

export async function buoiLop(sb: SB, classId: string): Promise<BuoiHieuLuc[]> {
  const rows = await layHet<BuoiHieuLuc>((a, b) => sb.from("v_buoi_hieu_luc").select("*").eq("class_id", classId).range(a, b));
  const mod = await thuTuModule(sb, rows.map((r) => r.module_id));
  const mk = (id: string | null) => (id && mod.get(id)) || KHONG_MODULE;
  return rows.sort((x, y) => cmpKey(mk(x.module_id), mk(y.module_id)) || cmpKey(x.thu_tu, y.thu_tu));
}

export async function baiTapLop(sb: SB, classId: string): Promise<BaiTapHieuLuc[]> {
  const rows = await layHet<BaiTapHieuLuc>((a, b) => sb.from("v_bai_tap_hieu_luc").select("*").eq("class_id", classId).range(a, b));
  return rows.map((r) => ({ ...r, diem_toi_da: Number(r.diem_toi_da), he_so: Number(r.he_so) }));
}

export async function cacLoaiBuoi(sb: SB): Promise<LoaiBuoi[]> {
  const { data } = await sb.from("lesson_types").select("*").is("deleted_at", null).order("thu_tu");
  return (data as LoaiBuoi[]) ?? [];
}

export async function modulesCua(sb: SB, curriculumId: string): Promise<ModuleRow[]> {
  const { data } = await sb.from("modules").select("*").eq("curriculum_id", curriculumId).is("deleted_at", null);
  return ((data as ModuleRow[]) ?? []).sort((a, b) => cmpKey(a.thu_tu, b.thu_tu));
}

export async function topicsCua(sb: SB, moduleIds: string[]): Promise<TopicRow[]> {
  if (moduleIds.length === 0) return [];
  const { data } = await sb.from("topics").select("*").in("module_id", moduleIds).is("deleted_at", null);
  return ((data as TopicRow[]) ?? []).sort((a, b) => cmpKey(a.thu_tu, b.thu_tu));
}

export async function cacLop(sb: SB, opts: { kemLuuTru?: boolean } = {}): Promise<Lop[]> {
  let q = sb.from("classes").select("*").is("deleted_at", null).order("ten_lop");
  if (!opts.kemLuuTru) q = q.eq("archived", false);
  const { data } = await q;
  return (data as Lop[]) ?? [];
}

export async function caiDat(sb: SB): Promise<Record<string, unknown>> {
  const { data } = await sb.from("app_settings").select("*");
  return Object.fromEntries(((data as { key: string; value: unknown }[]) ?? []).map((r) => [r.key, r.value]));
}

/** Đếm số lần xuất hiện theo khóa */
export function demTheo<T>(arr: T[], key: (x: T) => string): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of arr) m.set(key(x), (m.get(key(x)) ?? 0) + 1);
  return m;
}
