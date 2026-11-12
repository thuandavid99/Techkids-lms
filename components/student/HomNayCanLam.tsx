import Link from "next/link";
import { BookOpenText, RotateCcw, AlertTriangle, Clock, PartyPopper, ArrowRight } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import type { ViecCanLam, KieuViec } from "@/lib/domain/stats";
import { fmtDate } from "@/lib/domain/time";

const KIEU: Record<KieuViec, { nhan: string; I: typeof Clock; c: string; nen: string }> = {
  hoc_hom_nay: { nhan: "Học hôm nay", I: BookOpenText, c: "text-xanh-700", nen: "bg-xanh-50 border-xanh-100" },
  nop_lai: { nhan: "Thầy nhờ nộp lại", I: RotateCcw, c: "text-tim-500", nen: "bg-violet-50 border-violet-100" },
  qua_han: { nhan: "Đã quá hạn", I: AlertTriangle, c: "text-do-600", nen: "bg-red-50 border-red-100" },
  sap_han: { nhan: "Sắp đến hạn", I: Clock, c: "text-cam-500", nen: "bg-cam-50 border-orange-100" },
};

/** Khung "Hôm nay em cần làm" trên trang chủ học sinh: mỗi dòng là 1 việc, bấm là tới đúng chỗ */
export function HomNayCanLam({ ds }: { ds: ViecCanLam[] }) {
  return (
    <Card>
      <CardTitle icon={<Clock className="h-6 w-6 text-cam-500" />}>Hôm nay em cần làm</CardTitle>
      {ds.length === 0 ? (
        <p className="flex items-center gap-2 rounded-2xl bg-la-50 px-4 py-3 font-semibold text-la-600"><PartyPopper className="h-5 w-5 shrink-0" /> Em không còn việc nào gấp. Tuyệt vời!</p>
      ) : (
        <ul className="space-y-2">
          {ds.map((v, i) => {
            const k = KIEU[v.kieu];
            return (
              <li key={i}>
                <Link href={v.href} className={`flex min-w-0 items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors hover:border-xanh-500 ${k.nen}`}>
                  <k.I className={`h-5 w-5 shrink-0 ${k.c}`} />
                  <div className="min-w-0 flex-1">
                    <p className="chu-dai font-semibold leading-snug">{v.tieuDe}</p>
                    <p className={`text-xs font-semibold ${k.c}`}>{k.nhan}{v.han && ` · hạn ${fmtDate(v.han)}`}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
