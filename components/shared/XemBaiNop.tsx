"use client";
import { createContext, useContext, useState } from "react";
import { Check, ExternalLink, X } from "lucide-react";
import { CodeView } from "@/components/ui/CodeView";
import { PythonRunner } from "@/components/student/PythonRunner";
import { TabBai } from "@/components/student/TabBai";
import { docNop, docChamTabs, tabDaLam, type KetQuaTab } from "@/lib/domain/bai-nop";

// ---- Kết quả chấm ✓/✗ từng bài: dùng chung giữa khung xem bài (giữa) và khung chấm điểm (bên phải) ----
interface ChamCtx { ket: KetQuaTab[]; dat: (i: number, v: KetQuaTab) => void }
const Ctx = createContext<ChamCtx | null>(null);
export function useChamTabs() { return useContext(Ctx); }

export function ChamTabsProvider({ soBai, ban0, children }: { soBai: number; ban0: unknown; children: React.ReactNode }) {
  const [ket, setKet] = useState<KetQuaTab[]>(() => docChamTabs(ban0, soBai));
  const dat = (i: number, v: KetQuaTab) => setKet((k) => { const m = k.slice(); m[i] = m[i] === v ? null : v; return m; });
  return <Ctx.Provider value={soBai > 1 ? { ket, dat } : null}>{children}</Ctx.Provider>;
}

/**
 * Xem bài đã nộp: link (nếu có) + code; phiếu nhiều bài thì có hàng tab Bài 1..N.
 * cheDo "thay": có nút ✓ Đúng / ✗ Sai cho từng bài (lưu cùng điểm) và ô chạy thử.
 */
export function XemBaiNop({ codeText, soBai = 1, cham, cheDo = "hs", minH = 200 }: {
  codeText: string | null; soBai?: number; cham?: unknown; cheDo?: "hs" | "thay"; minH?: number;
}) {
  const nd = docNop(codeText, soBai);
  const nhieu = nd.tabs.length > 1;
  const [dang, setDang] = useState(0);
  const ctx = useChamTabs();
  const ket = cheDo === "thay" && ctx ? ctx.ket : docChamTabs(cham, nd.tabs.length);
  const code = nd.tabs[dang] ?? "";
  const coCode = nd.tabs.some((t) => t.trim());

  return (
    <div className="space-y-3">
      {nd.link && (
        <a href={nd.link} target="_blank" rel="noopener noreferrer nofollow"
          className="flex items-center gap-2 rounded-2xl border border-xanh-100 bg-xanh-50 px-4 py-3 font-semibold text-xanh-700 hover:underline">
          <ExternalLink className="h-5 w-5 shrink-0" /><span className="min-w-0 chu-dai">Link bài làm: {nd.link}</span>
        </a>
      )}
      {coCode && (
        <>
          {nhieu && (
            <TabBai soBai={nd.tabs.length} dang={dang} onChon={setDang} daLam={(i) => tabDaLam(nd.tabs[i] ?? "")} cham={ket}
              tieuDe={<>Đã làm <b className="text-la-600">{nd.tabs.filter(tabDaLam).length}/{nd.tabs.length}</b> bài
                {ket.some((x) => x) && <> · đúng <b className="text-la-600">{ket.filter((x) => x === "d").length}</b>, chưa đúng <b className="text-do-600">{ket.filter((x) => x === "s").length}</b></>}</>} />
          )}
          {cheDo === "thay" && nhieu && ctx && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">Bài {dang + 1}:</span>
              <button type="button" onClick={() => ctx.dat(dang, "d")} aria-pressed={ket[dang] === "d"}
                className={`inline-flex items-center gap-1 rounded-full border px-4 py-1.5 text-sm font-bold ${ket[dang] === "d" ? "border-la-500 bg-la-500 text-white" : "border-la-500 text-la-600 hover:bg-la-50"}`}><Check className="h-4 w-4" /> Đúng</button>
              <button type="button" onClick={() => ctx.dat(dang, "s")} aria-pressed={ket[dang] === "s"}
                className={`inline-flex items-center gap-1 rounded-full border px-4 py-1.5 text-sm font-bold ${ket[dang] === "s" ? "border-do-600 bg-do-600 text-white" : "border-do-600 text-do-600 hover:bg-do-50"}`}><X className="h-4 w-4" /> Sai</button>
              {dang < nd.tabs.length - 1 && <button type="button" onClick={() => setDang(dang + 1)} className="ml-auto text-sm font-semibold text-xanh-600 hover:underline">Bài tiếp →</button>}
            </div>
          )}
          {tabDaLam(code) || !nhieu ? <CodeView code={code} minH={minH} /> : <p className="rounded-2xl bg-slate-100 p-6 text-center text-slate-500">Em chưa làm bài {dang + 1}.</p>}
          {cheDo === "thay" && tabDaLam(code) && (
            // Thầy chạy thử code của em ngay trên trình duyệt của thầy (không chạy trên server)
            <details className="rounded-2xl border border-vien bg-white">
              <summary className="cursor-pointer px-4 py-3 font-semibold text-xanh-700">▶ Chạy thử {nhieu ? `bài ${dang + 1}` : "bài"} của em</summary>
              <div className="px-3 pb-3"><PythonRunner key={dang} code={code} chieuCao={300} /></div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
