"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, AlertCircle, Minus, X } from "lucide-react";
import { CellMenu, type OInfo } from "./CellMenu";
import type { KieuO } from "@/lib/domain/status";

export interface Cot { assignment_id: string; ma: string; ten: string; batBuoc: boolean }
export interface NhomCot { ten: string; cot: Cot[] }
export interface OData { kieu: KieuO; moTa: string; submissionId: string | null; co: boolean; ghiChu: string | null; o: OInfo }

const ICON: Record<KieuO, { c: string; I: React.ComponentType<{ className?: string }> }> = {
  da_cham: { c: "bg-la-600 text-white", I: Check },
  cho_cham: { c: "bg-[#a3c56a] text-white", I: Check },          // xanh ô-liu nhạt: đã nộp, chờ chấm
  canh_bao: { c: "bg-cam-500 text-white", I: AlertCircle },        // trễ / cần nộp lại
  khong_nop: { c: "bg-do-600 text-white", I: X },                  // không nộp bài (quá hạn)
  trung_tinh: { c: "bg-slate-400 text-white", I: Minus },          // chưa đến hạn / miễn / chưa học
};

export function OIcon({ kieu, size = 30 }: { kieu: KieuO; size?: number }) {
  const { c, I } = ICON[kieu];
  return <span className={`inline-flex items-center justify-center rounded-full ${c}`} style={{ width: size, height: size }}><I className="h-1/2 w-1/2" /></span>;
}

/** Ma trận tiến độ: học sinh × bài tập (nhóm theo module); bấm ô để chấm; nút ⋯ để thao tác */
export function MaTran({ hs, nhom, o }: { hs: { id: string; ho_ten: string; ma_hs: string }[]; nhom: NhomCot[]; o: Record<string, OData> }) {
  const [chiCo, setChiCo] = useState(false);
  const soCo = Object.values(o).filter((x) => x.co).length;
  const hsHien = chiCo ? hs.filter((h) => Object.entries(o).some(([k, v]) => k.startsWith(h.id) && v.co)) : hs;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-tim-500/30 bg-tim-50 px-3 py-1.5 font-semibold text-tim-500">
          <input type="checkbox" checked={chiCo} onChange={(e) => setChiCo(e.target.checked)} className="accent-violet-600" />
          🙋 Chỉ em báo chưa làm được ({soCo})
        </label>
      </div>
      <div className="table-wrap rounded-2xl border border-vien bg-white">
        <table className="tbl">
          <thead>
            <tr>
              <th rowSpan={2} className="sticky left-0 z-10 min-w-[170px] bg-white text-lg">Học sinh</th>
              {nhom.map((n) => <th key={n.ten} colSpan={n.cot.length} className="border-l border-vien text-center text-xs font-semibold text-slate-500">{n.ten}</th>)}
            </tr>
            <tr>
              {nhom.flatMap((n) => n.cot.map((c, i) => (
                <th key={c.assignment_id} title={c.ten} className={`text-center ${i === 0 ? "border-l border-vien" : ""}`}>
                  {c.ma}{!c.batBuoc && <span className="text-slate-400">*</span>}
                </th>
              )))}
            </tr>
          </thead>
          <tbody>
            {hsHien.map((h) => (
              <tr key={h.id}>
                <td className="sticky left-0 z-10 bg-white"><Link href={`/gv/hoc-sinh/${h.id}`} className="text-[1.05rem] font-medium hover:text-xanh-600">{h.ho_ten}</Link></td>
                {nhom.flatMap((n) => n.cot.map((c, i) => {
                  const x = o[`${h.id}:${c.assignment_id}`];
                  if (!x) return <td key={c.assignment_id} className={i === 0 ? "border-l border-vien" : ""} />;
                  const icon = <OIcon kieu={x.kieu} />;
                  return (
                    <td key={c.assignment_id} className={`text-center ${i === 0 ? "border-l border-vien" : ""}`} title={`${c.ten}\n${x.moTa}${x.co ? `\n🙋 Chưa làm được${x.ghiChu ? ": " + x.ghiChu : ""}` : ""}`}>
                      <div className="relative inline-flex items-center gap-0.5">
                        {x.submissionId ? <Link href={`/gv/bai-tap/cham/${x.submissionId}`} aria-label={`${h.ho_ten} – ${c.ten}: ${x.moTa}. Bấm để chấm`}>{icon}</Link> : <span aria-label={x.moTa}>{icon}</span>}
                        {x.co && <span className="absolute -right-2 -top-2 text-sm" aria-label="Em báo chưa làm được">🙋</span>}
                        <CellMenu o={x.o} />
                      </div>
                    </td>
                  );
                }))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">* bài tùy chọn. Rê chuột lên ô để xem tên bài và trạng thái.</p>
    </div>
  );
}
