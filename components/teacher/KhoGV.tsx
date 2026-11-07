"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { TaiLieuDong, ThemTaiLieu, type TLRow } from "./TaiLieuAdmin";
import { hangLoatTaiLieu } from "@/lib/actions/gv/tl";

interface Opt { id: string; ten: string }

/** Kho học liệu giáo viên: tìm kiếm, lọc, thao tác hàng loạt */
export function KhoGV({ ds, cats, lops, buois }: { ds: TLRow[]; cats: Opt[]; lops: Opt[]; buois: Opt[] }) {
  const [q, setQ] = useState(""), [cat, setCat] = useState(""), [buoi, setBuoi] = useState(""), [lop, setLop] = useState("");
  const [chon, setChon] = useState<Set<string>>(new Set());
  const [buoiDich, setBuoiDich] = useState("");
  const [lopDich, setLopDich] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const loc = useMemo(() => ds.filter((m) =>
    (!q || `${m.tieu_de} ${m.ten_goc ?? ""}`.toLowerCase().includes(q.toLowerCase())) && (!cat || m.loai === cat) &&
    (!buoi || (buoi === "chung" ? !m.lesson_id : m.lesson_id === buoi)) && (!lop || !m.lops.length || m.lops.includes(lop))), [ds, q, cat, buoi, lop]);
  const ids = [...chon];
  const run = (viec: Parameters<typeof hangLoatTaiLieu>[1], v?: string | string[]) => start(async () => {
    const kq = await hangLoatTaiLieu(ids, viec, v);
    if (kq.ok) { toast(kq.tb!); setChon(new Set()); router.refresh(); } else toast(kq.loi!, "loi");
  });
  const tenBuoi = new Map(buois.map((b) => [b.id, b.ten]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[200px] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tài liệu…" className="input !rounded-full pl-9" /></label>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="input !w-auto !rounded-full" aria-label="Phân loại"><option value="">Mọi loại</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.ten}</option>)}</select>
        <select value={buoi} onChange={(e) => setBuoi(e.target.value)} className="input !w-auto max-w-[240px] !rounded-full" aria-label="Buổi"><option value="">Mọi buổi</option><option value="chung">Kho chung</option>{buois.map((b) => <option key={b.id} value={b.id}>{b.ten}</option>)}</select>
        <select value={lop} onChange={(e) => setLop(e.target.value)} className="input !w-auto !rounded-full" aria-label="Lớp xem"><option value="">Mọi lớp</option>{lops.map((l) => <option key={l.id} value={l.id}>Lớp {l.ten}</option>)}</select>
        <ThemTaiLieu lessonId={null} cats={cats} />
      </div>
      {chon.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-xanh-100 bg-xanh-50 p-3 text-sm">
          <b>Đã chọn {chon.size}:</b>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run("hien")}>Hiện</Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run("an")}>Ẩn</Button>
          <select value={buoiDich} onChange={(e) => setBuoiDich(e.target.value)} className="input !w-auto !py-1"><option value="">(Kho chung)</option>{buois.map((b) => <option key={b.id} value={b.id}>{b.ten}</option>)}</select>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run("chuyen_buoi", buoiDich)}>Chuyển buổi</Button>
          <span className="flex flex-wrap gap-1">{lops.map((l) => <label key={l.id} className="inline-flex items-center gap-1"><input type="checkbox" checked={lopDich.includes(l.id)} onChange={(e) => setLopDich((x) => e.target.checked ? [...x, l.id] : x.filter((y) => y !== l.id))} />{l.ten}</label>)}</span>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run("lop_xem", lopDich)}>Đặt lớp xem</Button>
          <Button size="sm" variant="danger" disabled={pending} onClick={() => run("xoa")}>Xóa</Button>
        </div>
      )}
      {loc.length === 0 ? <p className="py-8 text-center text-slate-500">Không có tài liệu phù hợp.</p> : (
        <ul className="divide-y divide-vien rounded-2xl border border-vien bg-white px-4">
          <li className="py-2 text-sm"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={chon.size === loc.length} onChange={(e) => setChon(e.target.checked ? new Set(loc.map((m) => m.id)) : new Set())} /> Chọn tất cả ({loc.length})</label></li>
          {loc.map((m) => (
            <li key={m.id}>
              <p className="pt-2 text-xs font-semibold text-slate-400">{m.lesson_id ? tenBuoi.get(m.lesson_id) ?? "(buổi đã xóa)" : "Kho chung"}</p>
              <ul><TaiLieuDong m={m} cats={cats} lops={lops} buois={buois} chon={chon.has(m.id)} onChon={(v) => setChon((s) => { const n = new Set(s); if (v) n.add(m.id); else n.delete(m.id); return n; })} /></ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
