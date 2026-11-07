// Bảng điểm cả lớp theo học kỳ (spec 9.5): cột từng bài, TB từng module, TB học kỳ
import { diemTrungBinh, type DongBai } from "./stats";

export interface BangDiem {
  cot: { assignment_id: string; ma: string; tieu_de: string; module_id: string | null; he_so: number }[];
  modules: { id: string; ten: string }[];
  hs: { id: string; ma_hs: string; ho_ten: string; diem: Record<string, string>; tbModule: Record<string, number | null>; tb: number | null }[];
}

export function lapBangDiem(
  rows: (DongBai & { student_id: string; ma_hs: string; ho_ten: string })[],
  modules: { id: string; ten: string }[],
  hocKy: number,
  soChuSo = 1,
): BangDiem {
  const loc = rows.filter((r) => r.hoc_ky === hocKy && r.tinh_diem && (r.da_mo ?? true));
  const cot = [...new Map(loc.map((r) => [r.assignment_id, { assignment_id: r.assignment_id, ma: r.ma, tieu_de: r.tieu_de, module_id: r.module_id ?? null, he_so: r.he_so }])).values()];
  const theoHs = new Map<string, typeof loc>();
  for (const r of loc) theoHs.set(r.student_id, [...(theoHs.get(r.student_id) ?? []), r]);
  const hs = [...theoHs.entries()].map(([id, ds]) => {
    const diem: Record<string, string> = {};
    for (const r of ds) diem[r.assignment_id] = r.mien_nop ? "Miễn" : r.diem !== null && (r.trang_thai === "da_cham" || r.trang_thai === "nop_ngoai_he_thong") ? String(Number(r.diem)) : "";
    const tbModule: Record<string, number | null> = {};
    for (const m of modules) tbModule[m.id] = diemTrungBinh(ds.filter((r) => r.module_id === m.id), { soChuSo });
    return { id, ma_hs: ds[0].ma_hs, ho_ten: ds[0].ho_ten, diem, tbModule, tb: diemTrungBinh(ds, { soChuSo }) };
  }).sort((a, b) => a.ma_hs.localeCompare(b.ma_hs, "vi", { numeric: true }));
  return { cot, modules: modules.filter((m) => cot.some((c) => c.module_id === m.id)), hs };
}
