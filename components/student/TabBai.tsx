"use client";
import type { KetQuaTab } from "@/lib/domain/bai-nop";

/** Hàng nút "Bài 1, Bài 2…" của phiếu nhiều bài. Dùng chung cho học sinh (làm bài) và thầy (chấm). */
export function TabBai({ soBai, dang, onChon, daLam, cham, tieuDe }: {
  soBai: number; dang: number; onChon: (i: number) => void;
  daLam?: (i: number) => boolean; cham?: KetQuaTab[]; tieuDe?: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      {tieuDe && <p className="mb-2 text-sm text-slate-600">{tieuDe}</p>}
      <div role="tablist" aria-label="Các bài trong phiếu" className="flex flex-wrap gap-1.5">
        {Array.from({ length: soBai }, (_, i) => {
          const k = cham?.[i] ?? null;
          const lam = daLam?.(i) ?? false;
          const on = i === dang;
          const mau = on ? "border-navy-950 bg-navy-950 text-white"
            : k === "d" ? "border-la-500 bg-la-50 text-la-600"
            : k === "s" ? "border-do-600 bg-do-50 text-do-600"
            : lam ? "border-xanh-500 bg-xanh-50 text-xanh-700" : "border-vien bg-white text-slate-500";
          return (
            <button key={i} type="button" role="tab" aria-selected={on} onClick={() => onChon(i)}
              title={k === "d" ? "Thầy chấm: đúng" : k === "s" ? "Thầy chấm: chưa đúng" : lam ? "Đã làm" : "Chưa làm"}
              className={`inline-flex h-9 min-w-[4.25rem] items-center justify-center gap-1 rounded-xl border px-2.5 text-sm font-semibold ${mau}`}>
              Bài {i + 1}{k === "d" ? " ✓" : k === "s" ? " ✗" : lam ? " •" : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
