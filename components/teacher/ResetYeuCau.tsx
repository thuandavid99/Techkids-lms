"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { BangMatKhauTam } from "./MatKhauTam";
import { resetMatKhau, type TaiKhoanTam } from "@/lib/actions/gv/hs";

/** Nút reset một chạm cho danh sách yêu cầu quên mật khẩu (có nút reset tất cả) */
export function ResetYeuCau({ ids, nhan = "Reset", tatCa = false }: { ids: string[]; nhan?: string; tatCa?: boolean }) {
  const [mk, setMk] = useState<TaiKhoanTam[] | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <>
      <Button size="sm" variant={tatCa ? "primary" : "outline"} disabled={pending || !ids.length} onClick={() => start(async () => {
        const kq = await resetMatKhau(ids);
        if (kq.ok) { toast(kq.tb!); setMk(kq.data as TaiKhoanTam[]); router.refresh(); } else toast(kq.loi!, "loi");
      })}>{pending ? "Đang reset…" : nhan}</Button>
      <BangMatKhauTam ds={mk} onClose={() => setMk(null)} />
    </>
  );
}
