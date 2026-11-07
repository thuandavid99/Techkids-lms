"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { LessonIcon } from "@/components/ui/Misc";
import { Pill, LoaiPill } from "@/components/ui/Pill";
import type { MauPill } from "@/lib/domain/status";

export interface BuoiItem {
  id: string; ten: string; ngay: string; loaiTen: string; loaiMau: string; icon: string; noiBat: boolean;
  chuDe: string | null; tt: { text: string; mau: MauPill; icon: string; xong: boolean };
}
export interface ModuleItem { id: string; ten: string; buoi: BuoiItem[] }

/** Danh sách buổi học chia theo Module (thu gọn/mở rộng), tìm kiếm + lọc trạng thái */
export function BuoiHocList({ modules }: { modules: ModuleItem[] }) {
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState<"all" | "chua" | "xong">("all");
  const [dong, setDong] = useState<Record<string, boolean>>({});
  const loc_ = useMemo(() => modules.map((m) => ({
    ...m,
    hien: m.buoi.filter((b) => (!q || b.ten.toLowerCase().includes(q.toLowerCase())) && (loc === "all" || (loc === "xong") === b.tt.xong)),
  })), [modules, q, loc]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <label className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm buổi học…" aria-label="Tìm buổi học" className="input !rounded-full pl-9" />
        </label>
        <select value={loc} onChange={(e) => setLoc(e.target.value as typeof loc)} aria-label="Lọc trạng thái" className="input !w-auto !rounded-full">
          <option value="all">Tất cả trạng thái</option>
          <option value="chua">Chưa hoàn thành</option>
          <option value="xong">Đã hoàn thành</option>
        </select>
      </div>

      {loc_.every((m) => m.hien.length === 0) && <p className="py-8 text-center text-slate-500">Không có buổi học phù hợp.</p>}

      {loc_.filter((m) => m.hien.length > 0).map((m) => {
        const xong = m.buoi.filter((b) => b.tt.xong).length;
        const thuGon = dong[m.id];
        let chuDeTruoc: string | null = null;
        return (
          <section key={m.id}>
            <button onClick={() => setDong((d) => ({ ...d, [m.id]: !d[m.id] }))} aria-expanded={!thuGon}
              className="mb-2 flex w-full items-center gap-2 rounded-xl px-1 py-1 text-left">
              {thuGon ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              <span className="text-lg font-extrabold">{m.ten}</span>
              <span className="ml-auto rounded-full bg-xanh-50 px-3 py-0.5 text-sm font-semibold text-xanh-700">{xong}/{m.buoi.length} buổi</span>
            </button>
            {!thuGon && (
              <div className="space-y-3">
                {m.hien.map((b) => {
                  const hienChuDe = b.chuDe && b.chuDe !== chuDeTruoc;
                  chuDeTruoc = b.chuDe;
                  return (
                    <div key={b.id}>
                      {hienChuDe && <p className="mb-1 ml-2 text-sm font-semibold text-slate-500">Chủ đề: {b.chuDe}</p>}
                      <Link href={`/buoi-hoc/${b.id}`}
                        className={`card flex items-center gap-4 !rounded-2xl px-4 py-3.5 transition-colors hover:border-xanh-500 ${b.noiBat ? "!border-cam-400 !bg-cam-50" : ""}`}>
                        <LessonIcon icon={b.icon} mau={b.loaiMau} size={56} />
                        <div className="min-w-0 flex-1 border-l border-vien pl-4">
                          <p className="text-[1.05rem] font-bold leading-snug sm:text-lg">{b.ten}</p>
                          <p className="text-sm text-slate-600">Ngày học: {b.ngay}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5 sm:hidden"><Pill mau={b.tt.mau} icon={b.tt.icon}>{b.tt.text}</Pill></div>
                        </div>
                        <div className="hidden flex-col items-end gap-1.5 sm:flex">
                          <Pill mau={b.tt.mau} icon={b.tt.icon} className="!px-4 !py-1.5 !text-sm">{b.tt.text}</Pill>
                          {b.loaiTen && <LoaiPill ten={b.loaiTen} mau={b.loaiMau} />}
                        </div>
                        <span className="rounded-full bg-xanh-50 p-2 text-xanh-600"><ChevronRight className="h-5 w-5" /></span>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
