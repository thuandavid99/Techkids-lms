import Image from "next/image";
import Link from "next/link";
import { Lock } from "lucide-react";
import { IMG } from "@/lib/brand";
import { btnClass } from "./Button";

/** Trạng thái rỗng: hình minh họa + câu gợi ý + nút (nếu có) */
export function EmptyState({ title, hint, action, img = IMG.cheer }: { title: string; hint?: string; action?: React.ReactNode; img?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <Image src={img} alt="" width={140} height={120} className="mb-3 h-auto w-[140px] object-contain opacity-90" />
      <p className="text-lg font-bold text-navy-950">{title}</p>
      {hint && <p className="mt-1 max-w-md text-sm text-slate-600">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />;
}

/** Khung xương khi đang tải trang */
export function PageSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]" aria-busy="true" aria-label="Đang tải">
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="card card-pad space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
      <div className="hidden space-y-4 xl:block">
        <Skeleton className="h-44 w-full" /><Skeleton className="h-60 w-full" />
      </div>
    </div>
  );
}

export function KhongCoQuyen({ home = "/", chiQuanTri = false }: { home?: string; chiQuanTri?: boolean }) {
  return (
    <div className="card card-pad mx-auto mt-10 max-w-lg text-center">
      <Lock className="mx-auto mb-3 h-12 w-12 text-cam-500" />
      <h1 className="text-xl font-extrabold">Bạn không có quyền xem trang này</h1>
      <p className="mt-2 text-slate-600">{chiQuanTri ? "Trang này chỉ dành cho tài khoản quản trị. Cần thay đổi gì, thầy/cô liên hệ quản trị nhé." : "Trang này chỉ dành cho giáo viên. Nếu bạn nghĩ đây là nhầm lẫn, hãy đăng nhập lại bằng đúng tài khoản."}</p>
      <Link href={home} className={btnClass("primary", "md", "mt-5")}>Về trang chủ</Link>
    </div>
  );
}

export function LoiTaiDuLieu({ loi }: { loi: string }) {
  return (
    <div role="alert" className="rounded-2xl border border-do-600/30 bg-do-50 px-4 py-3 text-sm text-do-600">
      Không tải được dữ liệu: {loi}. Kiểm tra mạng rồi tải lại trang.
    </div>
  );
}
