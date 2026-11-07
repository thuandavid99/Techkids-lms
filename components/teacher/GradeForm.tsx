"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { luuDiem } from "@/lib/actions/gv/cham";
import { toVNInput } from "@/lib/domain/time";

/** Khối "Đánh giá & Chấm điểm" (phải màn chấm bài) */
export function GradeForm({ submissionId, diem0, nhanXet0, diemToiDa, moc, daCham, mauNhanXet, nextHref, soCho, choPhep }: {
  submissionId: string; diem0: number | null; nhanXet0: string; diemToiDa: number; moc: string | null; daCham: boolean;
  mauNhanXet: string[]; nextHref: string; soCho: number; choPhep: boolean;
}) {
  const [diem, setDiem] = useState(diem0 === null ? "" : String(diem0));
  const [nx, setNx] = useState(nhanXet0);
  const [kieu, setKieu] = useState<"cham" | "can_nop_lai">("cham");
  const [hanLai, setHanLai] = useState(toVNInput(new Date(Date.now() + 7 * 864e5)));
  const [xungDot, setXungDot] = useState<null | (() => void)>(null);
  const [suaDiem, setSuaDiem] = useState<null | (() => void)>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const gui = (hanhDong: "cham" | "can_nop_lai" | "mo_nop_lai", sauDo: "next" | "stay", ep = false) => start(async () => {
    const d = diem.trim() === "" ? null : Number(diem.replace(",", "."));
    if (hanhDong === "cham" && (d === null || Number.isNaN(d))) { toast("Thầy nhập điểm trước nhé.", "loi"); return; }
    const kq = await luuDiem({ submissionId, diem: d, nhanXet: nx, hanhDong, moc, ep, hanNopLai: hanhDong === "cham" ? null : hanLai });
    if (!kq.ok && (kq.data as { xungDot?: boolean } | undefined)?.xungDot) { setXungDot(() => () => gui(hanhDong, sauDo, true)); return; }
    if (!kq.ok) { toast(kq.loi!, "loi"); return; }
    toast(kq.tb!);
    if (sauDo === "next") router.push(nextHref); else router.refresh();
  });

  const luu = (sauDo: "next" | "stay") => {
    const d = Number(diem.replace(",", "."));
    // Sửa điểm đã chấm → hộp xác nhận cũ → mới (mục 15.2)
    if (daCham && kieu === "cham" && diem0 !== null && d !== diem0) { setSuaDiem(() => () => gui("cham", sauDo)); return; }
    gui(kieu, sauDo);
  };

  return (
    <div className="card card-pad space-y-4">
      <h2 className="text-2xl font-extrabold">Đánh giá &amp; Chấm điểm</h2>
      {!choPhep && <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm">Học sinh chưa có bài nộp (hoặc nộp ngoài hệ thống). Thầy vẫn có thể nhập điểm.</p>}
      <div className="flex items-center gap-3">
        <label htmlFor="diem" className="text-lg">Điểm số (trên {diemToiDa}):</label>
        <input id="diem" inputMode="decimal" value={diem} onChange={(e) => setDiem(e.target.value)} className="input !w-24 text-center text-lg font-bold" />
        <span className="text-lg">/ {diemToiDa}</span>
      </div>
      <div>
        <label htmlFor="nx" className="text-lg">Nhận xét của giáo viên:</label>
        <textarea id="nx" rows={4} value={nx} onChange={(e) => setNx(e.target.value)} className="input mt-1" />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {mauNhanXet.map((m) => (
            <button key={m} type="button" onClick={() => setNx((x) => (x ? x + " " : "") + m)} className="rounded-full border border-xanh-100 bg-xanh-50 px-2.5 py-1 text-xs text-xanh-700 hover:bg-xanh-100">{m.length > 40 ? m.slice(0, 40) + "…" : m}</button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2" role="radiogroup">
        <label className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-1.5 ${kieu === "cham" ? "bg-la-50 text-la-600 ring-2 ring-la-500/40" : "bg-slate-100"}`}>
          <input type="radio" checked={kieu === "cham"} onChange={() => setKieu("cham")} className="accent-green-600" /> Đã chấm
        </label>
        <label className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-1.5 ${kieu === "can_nop_lai" ? "bg-cam-50 text-cam-600 ring-2 ring-cam-400/50" : "bg-slate-100"}`}>
          <input type="radio" checked={kieu === "can_nop_lai"} onChange={() => setKieu("can_nop_lai")} className="accent-orange-500" /> Cần nộp lại
        </label>
      </div>
      {kieu === "can_nop_lai" && (
        <div><label className="label" htmlFor="hl">Hạn nộp lại (mặc định 7 ngày)</label><input id="hl" type="datetime-local" value={hanLai} onChange={(e) => setHanLai(e.target.value)} className="input" /></div>
      )}
      <Button size="lg" className="w-full" disabled={pending} onClick={() => luu("next")}>{pending ? "Đang lưu…" : "Lưu & bài tiếp theo"}</Button>
      <Button variant="outline" className="w-full" disabled={pending} onClick={() => luu("stay")}>Lưu kết quả</Button>
      <Button variant="navy" size="lg" className="w-full" disabled={pending} onClick={() => router.push(nextHref)}>
        {soCho > 0 ? <>Bỏ qua bài này ({soCho} bài chờ) <ArrowRight className="h-4 w-4" /></> : "Về hàng đợi"}
      </Button>
      {daCham && <Button variant="outlineOrange" className="w-full" disabled={pending} onClick={() => gui("mo_nop_lai", "stay", true)}>Mở cho nộp lại</Button>}

      <Modal open={!!xungDot} onClose={() => setXungDot(null)} title="Có bản nộp mới hơn">
        <p>Học sinh vừa nộp bản mới hơn. Tải lại bản mới trước khi lưu điểm?</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="outlineGray" onClick={() => { const f = xungDot; setXungDot(null); f?.(); }}>Vẫn lưu điểm</Button>
          <Button onClick={() => { setXungDot(null); router.refresh(); }}>Tải lại bản mới</Button>
        </div>
      </Modal>
      <Modal open={!!suaDiem} onClose={() => setSuaDiem(null)} title="Sửa điểm đã chấm">
        <p>Điểm sẽ đổi từ <b>{diem0}</b> thành <b>{diem}</b>. Thay đổi được ghi vào Nhật ký.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outlineGray" onClick={() => setSuaDiem(null)}>Hủy</Button>
          <Button onClick={() => { const f = suaDiem; setSuaDiem(null); f?.(); }}>Đồng ý sửa</Button>
        </div>
      </Modal>
    </div>
  );
}
