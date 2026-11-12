import { Search } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { duLieuHs } from "@/lib/server/hs";
import { IMG } from "@/lib/brand";
import { Card, PageGrid, RobotCard, BrandCard } from "@/components/ui/Card";
import { PillTabs, FileIcon } from "@/components/ui/Misc";
import { Pill } from "@/components/ui/Pill";
import { EmptyState } from "@/components/ui/States";
import { MaterialRow } from "@/components/student/MaterialRow";
import { tenBuoi } from "@/lib/domain/naming";
import { fmtAgo } from "@/lib/domain/time";
import { cmpKey } from "@/lib/domain/order";
import type { TaiLieu } from "@/lib/types";

export const metadata = { title: "Kho học liệu" };

export default async function Page({ searchParams }: { searchParams: Promise<{ loai?: string; q?: string; buoi?: string }> }) {
  const { loai = "", q = "", buoi: locBuoi = "" } = await searchParams;
  const p = await requireStudent();
  const { sb, buoi } = await duLieuHs(p);
  const [{ data: mats }, { data: cats }] = await Promise.all([
    sb.from("materials").select("*").is("deleted_at", null).order("tao_luc", { ascending: false }),
    sb.from("material_categories").select("id, ten").is("deleted_at", null).order("thu_tu"),
  ]);
  const tatCa = (mats as TaiLieu[]) ?? [];
  const tenCat = new Map(((cats as { id: string; ten: string }[]) ?? []).map((c) => [c.id, c.ten]));
  // Bản ghi đè của buổi trỏ về buổi gốc
  const buoiTheoId = new Map<string, (typeof buoi)[number]>();
  for (const b of buoi) { buoiTheoId.set(b.lesson_id, b); if (b.override_id) buoiTheoId.set(b.override_id, b); }

  const loc = tatCa.filter((m) =>
    (!loai || m.loai === loai) &&
    (!q || `${m.tieu_de} ${m.ten_goc ?? ""}`.toLowerCase().includes(q.toLowerCase())) &&
    (!locBuoi || (locBuoi === "chung" ? !m.lesson_id : buoiTheoId.get(m.lesson_id ?? "")?.lesson_id === locBuoi)));

  const nhom = new Map<string, { ten: string; thuTu: string; ds: TaiLieu[] }>();
  for (const m of loc) {
    const b = m.lesson_id ? buoiTheoId.get(m.lesson_id) : null;
    const key = b ? b.lesson_id : "chung";
    if (m.lesson_id && !b) continue;
    if (!nhom.has(key)) nhom.set(key, { ten: b ? tenBuoi(b.nhan_buoi, b.tieu_de) : "Tài liệu chung", thuTu: b ? b.thu_tu : "~", ds: [] });
    nhom.get(key)!.ds.push(m);
  }
  const cacNhom = [...nhom.values()].sort((a, b) => cmpKey(a.thuTu, b.thuTu));
  const moi = (d: string) => Date.now() - new Date(d).getTime() < 7 * 864e5;
  const href = (x: Record<string, string>) => "/kho-hoc-lieu?" + new URLSearchParams({ ...(loai && { loai }), ...(q && { q }), ...(locBuoi && { buoi: locBuoi }), ...x }).toString();

  return (
    <PageGrid
      main={
        <Card>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h1 className="h-page">Kho học liệu</h1>
            <PillTabs active={loai || "all"} tabs={[{ key: "all", label: "Tất cả", href: href({ loai: "" }) }, ...[...tenCat].map(([id, ten]) => ({ key: id, label: ten, href: href({ loai: id }) }))]} />
          </div>
          <form className="mb-4 flex flex-wrap gap-2" action="/kho-hoc-lieu">
            {loai && <input type="hidden" name="loai" value={loai} />}
            <label className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input name="q" defaultValue={q} placeholder="Tìm tài liệu…" aria-label="Tìm tài liệu" className="input !rounded-full pl-9" />
            </label>
            <select name="buoi" defaultValue={locBuoi} aria-label="Lọc theo buổi" className="input !w-auto !rounded-full">
              <option value="">Mọi buổi</option>
              <option value="chung">Tài liệu chung</option>
              {buoi.map((b) => <option key={b.lesson_id} value={b.lesson_id}>{tenBuoi(b.nhan_buoi, b.tieu_de)}</option>)}
            </select>
            <button className="rounded-full bg-navy-800 px-5 font-semibold text-white">Lọc</button>
          </form>
          {cacNhom.length === 0 ? <EmptyState title="Chưa có tài liệu phù hợp" img={IMG.books} /> : (
            <div className="space-y-4">
              {cacNhom.map((n) => (
                <section key={n.ten} className="rounded-2xl border border-vien bg-white px-4 py-2">
                  <h2 className="pt-2 text-lg font-extrabold">{n.ten}</h2>
                  {n.ds.map((m) => <MaterialRow key={m.id} m={m} phanLoai={m.loai ? tenCat.get(m.loai) : undefined} moi={moi(m.tao_luc)} />)}
                </section>
              ))}
            </div>
          )}
        </Card>
      }
      aside={<>
        <Card>
          <h2 className="h-card mb-3">Tài liệu mới cập nhật</h2>
          {tatCa.length === 0 ? <p className="text-sm text-slate-500">Chưa có.</p> : (
            <ul className="space-y-3">
              {tatCa.slice(0, 5).map((m) => (
                <li key={m.id} className="flex items-center gap-3">
                  <FileIcon ten={m.ten_goc ?? m.tieu_de} nguon={m.nguon} />
                  <a href={`/api/tai-ve?loai=tai-lieu&id=${m.id}${m.cho_phep_tai || m.nguon === "link" ? "" : "&xem=1"}`} className="line-clamp-2 min-w-0 flex-1 chu-dai font-medium hover:text-xanh-600" title={m.tieu_de}>{m.tieu_de}</a>
                  {moi(m.tao_luc) ? <Pill mau="green">mới</Pill> : <span className="text-xs text-slate-400">{fmtAgo(m.tao_luc)}</span>}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <RobotCard img={IMG.books} title="Kho kiến thức Python bổ ích!" />
        <BrandCard />
      </>}
    />
  );
}
