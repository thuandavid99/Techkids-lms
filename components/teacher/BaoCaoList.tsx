"use client";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { CopyButton } from "@/components/ui/CopyButton";
import { useToast } from "@/components/ui/Toast";
import { daNhacPhuHuynh, boDaNhac } from "@/lib/actions/gv/cham";
import { dienMauTin, type MucNhac } from "@/lib/domain/stats";
import { fmtDateTime, fmtDate } from "@/lib/domain/time";

export interface DongBC {
  studentId: string; hoTen: string; maHs: string;
  muc: { assignment_id: string; ma: string; tieu_de: string; lyDo: "chua_lam_bai" | "chua_lam_duoc" | "chua_nop" | "co"; han: string | null; ghiChu?: string | null }[];
  daNhac: { id: string; luc: string } | null;
}
const NHAN: Record<string, { t: string; m: "red" | "orange" | "gray" | "purple" }> = {
  chua_lam_bai: { t: "Không nộp bài", m: "red" }, chua_lam_duoc: { t: "Chưa làm được (quá hạn nộp lại)", m: "orange" },
  chua_nop: { t: "Chưa nộp", m: "gray" }, co: { t: "🙋 Em báo chưa làm được", m: "purple" },
};

export function BaoCaoList({ ds, tenLop, mau, tieuDe }: { ds: DongBC[]; tenLop: string; mau: { ten: string; noi_dung: string; mac_dinh: boolean }[]; tieuDe: string }) {
  const [mauChon, setMauChon] = useState(mau.findIndex((m) => m.mac_dinh) >= 0 ? mau.findIndex((m) => m.mac_dinh) : 0);
  const taoTin = (d: DongBC, i: number) => dienMauTin(mau[i]?.noi_dung ?? "Thầy/cô nhắc nhở: Em {ten_hs} cần hoàn thành: {danh_sach_bai} trước {han_nop}.", {
    ten_hs: d.hoTen, lop: tenLop, muc: d.muc.map((m) => ({ ...m, lyDo: "chua_lam_bai", han: m.han ? new Date(m.han) : null }) as MucNhac),
  });
  const [tin, setTin] = useState<Record<string, string>>(() => Object.fromEntries(ds.map((d) => [d.studentId, taoTin(d, mauChon)])));
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const doiMau = (i: number) => { setMauChon(i); setTin(Object.fromEntries(ds.map((d) => [d.studentId, taoTin(d, i)]))); };
  const tinChung = useMemo(() => {
    const bai = [...new Map(ds.flatMap((d) => d.muc).map((m) => [m.assignment_id, m])).values()];
    const han = bai.map((b) => b.han).filter(Boolean).sort()[0];
    return `Thầy/cô nhắc nhở: Các bạn vui lòng hoàn thành ${bai.map((b) => `bài tập ${b.ma}`).join(", ")}${han ? ` trước ngày ${fmtDate(han)}` : ""} nhé!`;
  }, [ds]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-do-600/40 bg-do-50 px-4 py-3 text-lg font-bold text-navy-950">
        <AlertTriangle className="h-6 w-6 shrink-0 text-do-600" /> {tieuDe} ({ds.length} bạn)
      </div>
      {mau.length > 1 && (
        <label className="mb-3 flex flex-wrap items-center gap-2 text-sm">Mẫu tin:
          <select value={mauChon} onChange={(e) => doiMau(Number(e.target.value))} className="input !w-auto !py-1.5">{mau.map((m, i) => <option key={i} value={i}>{m.ten}</option>)}</select>
        </label>
      )}
      {ds.length === 0 ? <p className="py-6 text-center text-slate-500">Không có học sinh nào trong danh sách. 🎉</p> : (
        <ol className="divide-y divide-vien">
          {ds.map((d, i) => (
            <li key={d.studentId} className={`py-4 ${d.daNhac ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xl">{i + 1}.</span>
                <Link href={`/gv/hoc-sinh/${d.studentId}`} className="text-xl font-medium hover:text-xanh-600">{d.hoTen}</Link>
                <span className="text-sm text-slate-500">({d.maHs})</span>
                <span className="ml-auto flex flex-wrap gap-1">{[...new Set(d.muc.map((m) => m.lyDo))].map((l) => <Pill key={l} mau={NHAN[l].m} className="!text-sm">{NHAN[l].t}</Pill>)}</span>
              </div>
              <ul className="ml-7 mt-1 text-sm text-slate-600">
                {d.muc.map((m) => <li key={m.assignment_id}>• Bài tập {m.ma}: {m.tieu_de}{m.han ? ` (hạn ${fmtDate(m.han)})` : ""}{m.ghiChu ? ` — “${m.ghiChu}”` : ""}</li>)}
              </ul>
              <div className="ml-7 mt-2 space-y-2">
                <textarea value={tin[d.studentId] ?? ""} onChange={(e) => setTin((x) => ({ ...x, [d.studentId]: e.target.value }))} rows={2} className="input text-sm" aria-label={`Tin nhắn cho phụ huynh ${d.hoTen}`} />
                <div className="flex flex-wrap items-center gap-3">
                  <CopyButton text={() => tin[d.studentId] ?? ""}>Sao chép tin</CopyButton>
                  {d.daNhac ? (
                    <span className="text-sm text-la-600">✓ Đã nhắc lúc {fmtDateTime(d.daNhac.luc)} <button className="ml-1 text-slate-500 underline" disabled={pending} onClick={() => start(async () => { await boDaNhac(d.daNhac!.id); router.refresh(); })}>Bỏ</button></span>
                  ) : (
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
                      <input type="checkbox" disabled={pending} className="h-5 w-5 accent-green-600" onChange={() => start(async () => {
                        const kq = await daNhacPhuHuynh(d.studentId, d.muc.map((m) => m.assignment_id), tin[d.studentId] ?? "");
                        if (kq.ok) { toast(kq.tb!); router.refresh(); } else toast(kq.loi!, "loi");
                      })} /> Đã nhắc
                    </label>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
      {ds.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-vien bg-xanh-50 px-4 py-4">
          <p className="flex-1 text-[1.05rem]">{tinChung}</p>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={tinChung}>Sao chép tin nhắn</CopyButton>
            <CopyButton text={() => ds.map((d) => tin[d.studentId]).join("\n\n")} variant="outline">Sao chép tin cho cả danh sách</CopyButton>
          </div>
        </div>
      )}
    </div>
  );
}
