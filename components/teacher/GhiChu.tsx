"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { themGhiChu, xoaGhiChu } from "@/lib/actions/gv/hs";
import { fmtDateTime } from "@/lib/domain/time";

/** Ghi chú riêng của thầy về học sinh (học sinh không thấy) */
export function GhiChu({ studentId, ds }: { studentId: string; ds: { id: string; noi_dung: string; tao_luc: string }[] }) {
  const [v, setV] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <div>
      <div className="flex gap-2">
        <textarea value={v} onChange={(e) => setV(e.target.value)} rows={2} className="input" placeholder="Ghi chú riêng (học sinh không thấy)…" />
        <Button size="sm" disabled={pending || !v.trim()} onClick={() => start(async () => { const kq = await themGhiChu(studentId, v); if (kq.ok) { setV(""); router.refresh(); } else toast(kq.loi!, "loi"); })}>Lưu</Button>
      </div>
      <ul className="mt-3 space-y-2">
        {ds.map((g) => (
          <li key={g.id} className="rounded-xl bg-amber-50 px-3 py-2 text-sm">
            <p className="chu-dai whitespace-pre-line">{g.noi_dung}</p>
            <p className="mt-1 flex justify-between text-xs text-slate-500">{fmtDateTime(g.tao_luc)}
              <button className="text-do-600 hover:underline" onClick={() => start(async () => { await xoaGhiChu(g.id); router.refresh(); })}>Xóa</button></p>
          </li>
        ))}
      </ul>
    </div>
  );
}
