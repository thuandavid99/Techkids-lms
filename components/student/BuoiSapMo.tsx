import { Lock } from "lucide-react";
import { tenBuoi } from "@/lib/domain/naming";
import { fmtDate } from "@/lib/domain/time";

export interface BuoiKhoa { lesson_id: string; nhan_buoi: string; tieu_de: string; ngay_hoc: string | null }

/** 1–2 buổi sắp học (thầy chưa mở): hiện mờ có ổ khóa, không bấm vào được */
export function BuoiSapMo({ ds, gon = false }: { ds: BuoiKhoa[]; gon?: boolean }) {
  if (!ds.length) return null;
  return (
    <div className={gon ? "space-y-2" : "card card-pad space-y-2"}>
      {!gon && <h2 className="h-card mb-1">Sắp học</h2>}
      {ds.map((b) => (
        <div key={b.lesson_id} aria-disabled="true" className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-4 py-3 opacity-75">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-200 text-slate-500"><Lock className="h-5 w-5" /></span>
          <div className="hang-chu">
            <p className="font-semibold text-slate-600">{tenBuoi(b.nhan_buoi, b.tieu_de)}</p>
            <p className="text-sm text-slate-500">{b.ngay_hoc ? `Ngày học: ${fmtDate(b.ngay_hoc)} · ` : ""}Thầy sẽ mở khi đến buổi học 🔒</p>
          </div>
        </div>
      ))}
    </div>
  );
}
