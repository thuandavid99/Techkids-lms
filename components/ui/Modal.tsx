"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { X, AlertTriangle } from "lucide-react";
import { Button, type Variant } from "./Button";
import { useToast } from "./Toast";
import type { KQ } from "@/lib/types";
import { useRouter } from "next/navigation";

/** Hộp thoại cơ bản (Esc để đóng, khóa cuộn nền) */
export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("input,textarea,select,button")?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = old; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="no-print fixed inset-0 z-[90] flex items-end justify-center bg-navy-950/40 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" className={`card max-h-[92dvh] w-full overflow-y-auto rounded-b-none sm:rounded-[20px] ${wide ? "sm:max-w-4xl" : "sm:max-w-lg"}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-vien bg-white/95 px-5 py-4">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button onClick={onClose} aria-label="Đóng" className="rounded-full p-1 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/**
 * Nút có HỘP XÁC NHẬN rồi gọi server action (mục 15.2).
 * action: hàm server đã bind sẵn tham số, trả về KQ.
 */
export function ConfirmButton({
  action, title, message, confirmText = "Đồng ý", variant = "outline", size = "sm", danger = false, children, className = "", onDone, extra,
}: {
  action: () => Promise<KQ>; title: string; message: React.ReactNode; confirmText?: string; variant?: Variant;
  size?: "sm" | "md" | "lg"; danger?: boolean; children: React.ReactNode; className?: string; onDone?: (kq: KQ) => void; extra?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setOpen(true)}>{children}</Button>
      <Modal open={open} onClose={() => !pending && setOpen(false)} title={title}>
        <div className="flex gap-3">
          {danger && <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-do-600" />}
          <div className="text-[0.95rem] text-slate-700">{message}</div>
        </div>
        {extra}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outlineGray" onClick={() => setOpen(false)} disabled={pending}>Hủy</Button>
          <Button variant={danger ? "danger" : "primary"} disabled={pending}
            onClick={() => start(async () => {
              try {
                const kq = await action();
                if (kq.ok) { toast(kq.tb ?? "Đã xong"); setOpen(false); router.refresh(); }
                else toast(kq.loi ?? "Có lỗi xảy ra", "loi");
                onDone?.(kq);
              } catch (e) { toast((e as Error).message || "Mất kết nối, thử lại nhé.", "loi"); }
            })}>
            {pending ? "Đang xử lý…" : confirmText}
          </Button>
        </div>
      </Modal>
    </>
  );
}

/** Nút gọi server action không cần xác nhận (có chống bấm đúp) */
export function ActionButton({ action, children, variant = "outline", size = "sm", className = "", title }: {
  action: () => Promise<KQ>; children: React.ReactNode; variant?: Variant; size?: "sm" | "md" | "lg"; className?: string; title?: string;
}) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <Button variant={variant} size={size} className={className} disabled={pending} title={title}
      onClick={() => start(async () => {
        try {
          const kq = await action();
          if (kq.ok) { if (kq.tb) toast(kq.tb); router.refresh(); } else toast(kq.loi ?? "Có lỗi xảy ra", "loi");
        } catch (e) { toast((e as Error).message || "Mất kết nối, thử lại nhé.", "loi"); }
      })}>
      {pending ? "…" : children}
    </Button>
  );
}
