"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { datCoChuaLamDuoc } from "@/lib/actions/hs";
import { useToast } from "@/components/ui/Toast";

/** Ô tích "Em chưa làm được bài này" + ghi chú "Em kẹt ở đâu?" (mục 5.8) */
export function FlagToggle({ assignmentId, checked, note, disabled, compact = false }: {
  assignmentId: string; checked: boolean; note: string | null; disabled?: boolean; compact?: boolean;
}) {
  const [on, setOn] = useState(checked);
  const [ghiChu, setGhiChu] = useState(note ?? "");
  const [moGhiChu, setMoGhiChu] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const luu = (val: boolean, gc: string) => start(async () => {
    const kq = await datCoChuaLamDuoc(assignmentId, val, gc);
    if (kq.ok) { setOn(val); toast(kq.tb!); router.refresh(); } else toast(kq.loi!, "loi");
  });

  if (disabled) return null;
  return (
    <div className={`rounded-xl ${on ? "bg-tim-50" : ""} ${compact ? "" : "px-3 py-2"}`}>
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <input type="checkbox" className="h-4 w-4 accent-violet-600" checked={on} disabled={pending}
          onChange={(e) => { const v = e.target.checked; if (v) { setMoGhiChu(true); luu(true, ghiChu); } else luu(false, ""); }} />
        🙋 Em chưa làm được bài này
      </label>
      {on && (moGhiChu || !compact) && (
        <div className="mt-2 flex gap-2">
          <input value={ghiChu} onChange={(e) => setGhiChu(e.target.value.slice(0, 200))} maxLength={200}
            placeholder="Em kẹt ở đâu? (không bắt buộc)" aria-label="Em kẹt ở đâu" className="input !py-1.5 text-sm" />
          <button disabled={pending} onClick={() => luu(true, ghiChu)} className="shrink-0 rounded-lg bg-tim-500 px-3 text-sm font-semibold text-white disabled:opacity-60">Gửi</button>
        </div>
      )}
    </div>
  );
}
