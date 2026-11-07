"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { thaoTacO, nopHo } from "@/lib/actions/gv/cham";
import type { KQ } from "@/lib/types";

export interface OInfo { assignmentId: string; studentId: string; tenHs: string; tenBai: string; mien: boolean; ngoai: boolean; daCham: boolean; coBai: boolean; hanRieng: string }

/** Nút "⋯" trên ô: Miễn nộp · Đã nộp ngoài hệ thống · Gia hạn riêng · Nộp hộ · Mở cho nộp lại */
export function CellMenu({ o }: { o: OInfo }) {
  const [open, setOpen] = useState(false);
  const [hop, setHop] = useState<null | "mien" | "gia_han" | "nop_ho" | "mo_nop_lai">(null);
  const [val, setVal] = useState("");
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const router = useRouter();
  useEffect(() => {
    const f = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, []);
  const run = (fn: () => Promise<KQ>) => start(async () => {
    const kq = await fn();
    if (kq.ok) { toast(kq.tb ?? "Đã lưu"); setHop(null); setOpen(false); router.refresh(); } else toast(kq.loi ?? "Lỗi", "loi");
  });
  const item = "block w-full px-3 py-2 text-left text-sm hover:bg-xanh-50";
  return (
    <div ref={ref} className="relative inline-block">
      <button onClick={(e) => { e.stopPropagation(); setOpen((x) => !x); }} aria-label={`Thao tác cho ${o.tenHs} – ${o.tenBai}`}
        className="rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-navy-800"><MoreHorizontal className="h-4 w-4" /></button>
      {open && (
        <div className="card absolute right-0 top-6 z-30 w-56 overflow-hidden py-1 text-left" role="menu">
          {o.mien ? <button className={item} onClick={() => run(() => thaoTacO(o.assignmentId, o.studentId, "bo_mien"))}>Bỏ miễn nộp</button>
            : <button className={item} onClick={() => { setVal(""); setHop("mien"); }}>Miễn nộp…</button>}
          {o.ngoai ? <button className={item} onClick={() => run(() => thaoTacO(o.assignmentId, o.studentId, "bo_ngoai"))}>Bỏ "nộp ngoài hệ thống"</button>
            : <button className={item} onClick={() => run(() => thaoTacO(o.assignmentId, o.studentId, "ngoai"))}>Đã nộp ngoài hệ thống</button>}
          <button className={item} onClick={() => { setVal(o.hanRieng); setHop("gia_han"); }}>Gia hạn riêng…</button>
          <button className={item} onClick={() => { setVal(""); setHop("nop_ho"); }}>Nộp hộ…</button>
          {o.daCham && <button className={item} onClick={() => { setVal(""); setHop("mo_nop_lai"); }}>Mở cho nộp lại…</button>}
        </div>
      )}
      <Modal open={hop !== null} onClose={() => setHop(null)} title={`${o.tenHs} · ${o.tenBai}`}>
        {hop === "mien" && <>
          <label className="label" htmlFor="lydo">Lý do miễn nộp (không bắt buộc)</label>
          <input id="lydo" className="input" value={val} onChange={(e) => setVal(e.target.value)} placeholder="Ví dụ: nghỉ ốm có phép" />
          <p className="mt-2 text-sm text-slate-500">Bài miễn nộp không tính vào % hoàn thành, điểm TB và danh sách nhắc phụ huynh.</p>
        </>}
        {hop === "gia_han" && <>
          <label className="label" htmlFor="han">Hạn nộp riêng (giờ Việt Nam). Để trống = bỏ gia hạn.</label>
          <input id="han" type="datetime-local" className="input" value={val} onChange={(e) => setVal(e.target.value)} />
        </>}
        {hop === "mo_nop_lai" && <>
          <label className="label" htmlFor="hnl">Hạn nộp lại (để trống = 7 ngày)</label>
          <input id="hnl" type="datetime-local" className="input" value={val} onChange={(e) => setVal(e.target.value)} />
        </>}
        {hop === "nop_ho" && <>
          <label className="label" htmlFor="code">Dán code của học sinh</label>
          <textarea id="code" rows={10} className="input font-mono text-sm" value={val} onChange={(e) => setVal(e.target.value)} />
          {o.coBai && <p className="mt-2 text-sm text-cam-600">Bài mới sẽ thay bài cũ của học sinh.</p>}
        </>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outlineGray" onClick={() => setHop(null)}>Hủy</Button>
          <Button disabled={pending} onClick={() => run(() => hop === "nop_ho" ? nopHo(o.assignmentId, o.studentId, val) : thaoTacO(o.assignmentId, o.studentId, hop!, val))}>
            {pending ? "Đang lưu…" : "Lưu"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
