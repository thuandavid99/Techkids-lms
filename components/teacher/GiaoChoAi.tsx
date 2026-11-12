"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { datBaiRieng } from "@/lib/actions/gv/canhan";

export interface HsChon { id: string; ten: string; ma: string; lop: string }

/** "Giao cho ai": cả lớp (mặc định) hoặc chỉ một số em (bài nâng cao / bài bù). Em không được giao không thấy, không bị tính. */
export function GiaoChoAi({ assignmentId, chiRieng0, chon0, hs }: { assignmentId: string; chiRieng0: boolean; chon0: string[]; hs: HsChon[] }) {
  const [rieng, setRieng] = useState(chiRieng0);
  const [chon, setChon] = useState<Set<string>>(new Set(chon0));
  const [tim, setTim] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const loc = useMemo(() => hs.filter((h) => !tim || `${h.ten} ${h.ma} ${h.lop}`.toLowerCase().includes(tim.toLowerCase())), [hs, tim]);
  const luu = () => start(async () => {
    const kq = await datBaiRieng(assignmentId, rieng, [...chon]);
    if (!kq.ok) { toast(kq.loi!, "loi"); return; }
    toast(kq.tb!); router.refresh();
  });
  const doi = (id: string) => setChon((c) => { const m = new Set(c); if (m.has(id)) m.delete(id); else m.add(id); return m; });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2"><input type="radio" checked={!rieng} onChange={() => setRieng(false)} className="h-4 w-4" /> Cả lớp</label>
        <label className="flex items-center gap-2"><input type="radio" checked={rieng} onChange={() => setRieng(true)} className="h-4 w-4" /> Chỉ một số em <span className="text-sm text-slate-500">(bài nâng cao / bài bù)</span></label>
      </div>
      {rieng && (
        <div className="rounded-2xl border border-vien p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <span className="text-sm">Đã chọn <b>{chon.size}</b> em</span>
            <input className="input ml-auto !w-48 !py-1.5 text-sm" placeholder="Tìm tên / mã…" value={tim} onChange={(e) => setTim(e.target.value)} />
          </div>
          <div className="grid max-h-64 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
            {loc.map((h) => (
              <label key={h.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-xanh-50">
                <input type="checkbox" checked={chon.has(h.id)} onChange={() => doi(h.id)} className="h-4 w-4" />
                <span className="hang-chu">{h.ten} <span className="text-slate-500">· {h.ma} · {h.lop}</span></span>
              </label>
            ))}
            {!loc.length && <p className="text-sm text-slate-500">Không có học sinh.</p>}
          </div>
        </div>
      )}
      <p className="text-xs text-slate-500">Bài riêng chỉ hiện với các em được chọn và chỉ tính vào điểm / báo cáo của các em đó.</p>
      <Button size="sm" onClick={luu} disabled={pending || (rieng && chon.size === 0)}>Lưu “Giao cho ai”</Button>
    </div>
  );
}
