"use client";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";
import { btnClass, type Variant } from "./Button";
import type { KQ } from "@/lib/types";

/**
 * Form gọi server action, hiện thông báo thành công/lỗi, giữ nguyên nội dung khi lỗi.
 * action(prev, formData) => Promise<KQ>
 */
export function ActionForm({ action, children, className = "", onOk, resetOnOk = false, refresh = true }: {
  action: (prev: KQ, fd: FormData) => Promise<KQ>; children: React.ReactNode; className?: string;
  onOk?: (kq: KQ) => void; resetOnOk?: boolean; refresh?: boolean;
}) {
  const [state, formAction] = useActionState(action, { ok: false } as KQ);
  const toast = useToast();
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const last = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!state.ts || state.ts === last.current) return;
    last.current = state.ts;
    if (state.ok) {
      if (state.tb) toast(state.tb);
      if (resetOnOk) ref.current?.reset();
      onOk?.(state);
      if (refresh) router.refresh();
    } else if (state.loi) toast(state.loi, "loi");
  }, [state, toast, onOk, resetOnOk, refresh, router]);
  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      {!state.ok && state.loi && <p role="alert" className="mt-3 rounded-xl bg-do-50 px-3 py-2 text-sm text-do-600">{state.loi}</p>}
    </form>
  );
}

/** Nút gửi form: tự khóa khi đang gửi (chống bấm đúp) */
export function SubmitButton({ children, variant = "primary", size = "md", className = "", pendingText = "Đang lưu…", name, value }: {
  children: React.ReactNode; variant?: Variant; size?: "sm" | "md" | "lg"; className?: string; pendingText?: string; name?: string; value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={btnClass(variant, size, className)}>
      {pending ? pendingText : children}
    </button>
  );
}
