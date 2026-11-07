"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type Kieu = "ok" | "loi" | "info";
interface Toast { id: number; kieu: Kieu; noiDung: string }
const Ctx = createContext<(noiDung: string, kieu?: Kieu) => void>(() => {});

/** Thông báo nhỏ tự tắt (thành công / lỗi) */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [ds, setDs] = useState<Toast[]>([]);
  const show = useCallback((noiDung: string, kieu: Kieu = "ok") => {
    const id = Date.now() + Math.random();
    setDs((x) => [...x, { id, kieu, noiDung }]);
    setTimeout(() => setDs((x) => x.filter((t) => t.id !== id)), kieu === "loi" ? 7000 : 3500);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="no-print fixed bottom-20 right-4 left-4 sm:left-auto sm:bottom-6 z-[100] flex flex-col gap-2 sm:w-96" aria-live="polite">
        {ds.map((t) => (
          <div key={t.id} role={t.kieu === "loi" ? "alert" : "status"}
            className={`card flex items-start gap-3 px-4 py-3 text-sm font-medium ${t.kieu === "loi" ? "border-do-600/30 bg-do-50" : t.kieu === "ok" ? "bg-la-50 border-la-500/30" : ""}`}>
            {t.kieu === "ok" ? <CheckCircle2 className="h-5 w-5 shrink-0 text-la-600" /> : t.kieu === "loi" ? <AlertTriangle className="h-5 w-5 shrink-0 text-do-600" /> : <Info className="h-5 w-5 shrink-0 text-xanh-600" />}
            <span className="flex-1">{t.noiDung}</span>
            <button aria-label="Đóng" onClick={() => setDs((x) => x.filter((y) => y.id !== t.id))}><X className="h-4 w-4 text-slate-400" /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
