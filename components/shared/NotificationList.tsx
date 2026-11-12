"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { danhDauDaDoc, danhDauTatCaDaDoc } from "@/lib/actions/common";
import { Button } from "@/components/ui/Button";
import { fmtAgo, fmtDateTime } from "@/lib/domain/time";

interface TB { id: string; noi_dung: string; tao_luc: string; loai: string; da_doc: boolean; lien_ket: string | null }
const MAU: Record<string, string> = { sap_han: "bg-cam-500", bai_moi: "bg-xanh-500", da_cham: "bg-la-500", can_nop_lai: "bg-do-600", lop: "bg-tim-500", chua_lam_duoc: "bg-tim-500", reset_mk: "bg-do-600" };

/** Danh sách thông báo: bấm để tới nội dung liên quan (tự đánh dấu đã đọc) */
export function NotificationList({ ds }: { ds: TB[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button variant="outline" size="sm" disabled={pending || ds.every((t) => t.da_doc)}
          onClick={() => start(async () => { await danhDauTatCaDaDoc(); router.refresh(); })}><CheckCheck className="h-4 w-4" /> Đánh dấu tất cả đã đọc</Button>
      </div>
      <ul className="divide-y divide-vien rounded-2xl border border-vien bg-white">
        {ds.map((t) => (
          <li key={t.id}>
            <button className={`flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-xanh-50 ${t.da_doc ? "" : "bg-xanh-50/50"}`}
              onClick={() => start(async () => { if (!t.da_doc) await danhDauDaDoc(t.id); if (t.lien_ket) router.push(t.lien_ket); else router.refresh(); })}>
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${t.da_doc ? "bg-slate-300" : MAU[t.loai] ?? "bg-xanh-500"}`} />
              <span className="min-w-0 flex-1 chu-dai">
                <span className={t.da_doc ? "text-slate-600" : "font-semibold"}>{t.noi_dung}</span>
                <span className="block text-xs text-slate-400" title={fmtDateTime(t.tao_luc)}>{fmtAgo(t.tao_luc)}</span>
              </span>
              {!t.da_doc && <span className="shrink-0 rounded-full bg-xanh-600 px-2 py-0.5 text-xs font-bold text-white">Mới</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
