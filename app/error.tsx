"use client";
import { useEffect } from "react";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Lỗi / mất kết nối: giữ nguyên trang, có nút Thử lại */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  const thieuCauHinh = /Thiếu (NEXT_PUBLIC|SUPABASE|HS_EMAIL)/.test(error.message);
  return (
    <div className="flex min-h-[60dvh] items-center justify-center p-5">
      <div className="card card-pad max-w-md text-center">
        <WifiOff className="mx-auto h-12 w-12 text-cam-500" />
        <h1 className="mt-3 text-xl font-extrabold">Ối, có lỗi khi tải trang</h1>
        <p className="mt-2 text-slate-600">
          {thieuCauHinh ? error.message : "Có thể mạng đang chập chờn hoặc máy chủ đang bận. Bạn thử lại sau vài giây nhé."}
        </p>
        {error.digest && <p className="mt-2 text-xs text-slate-400">Mã lỗi: {error.digest}</p>}
        <Button className="mt-5" onClick={reset}>Thử lại</Button>
      </div>
    </div>
  );
}
