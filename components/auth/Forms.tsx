"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { UserRound, Lock, Eye, EyeOff, Home, ArrowLeft, CheckCircle2, Mail, GraduationCap, Presentation } from "lucide-react";
import { dangNhap, guiYeuCauQuenMk, doiMatKhauLanDau } from "@/lib/actions/auth";
import { btnClass } from "@/components/ui/Button";
import type { KQ } from "@/lib/types";

function Nut({ children, pending: p }: { children: React.ReactNode; pending: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className={btnClass("primary", "lg", "w-full !rounded-2xl text-lg")}>{pending ? p : children}</button>;
}

function OMatKhau({ name, placeholder, autoComplete }: { name: string; placeholder: string; autoComplete: string }) {
  const [hien, setHien] = useState(false);
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-800" />
      <input name={name} type={hien ? "text" : "password"} required placeholder={placeholder} aria-label={placeholder} autoComplete={autoComplete}
        className="input h-14 !rounded-2xl pl-12 pr-12 text-base" />
      <button type="button" onClick={() => setHien((x) => !x)} aria-label={hien ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
        {hien ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
      </button>
    </div>
  );
}

function Loi({ s }: { s: KQ }) {
  return !s.ok && s.loi ? <p role="alert" className="rounded-xl bg-do-50 px-3 py-2 text-sm text-do-600">{s.loi}</p> : null;
}

/** Form đăng nhập. khu = "hs": mã học sinh; khu = "gv": email giáo viên (cửa riêng /giao-vien) */
export function LoginForm({ khu = "hs" }: { khu?: "hs" | "gv" }) {
  const [s, act] = useActionState(dangNhap, { ok: false } as KQ);
  const gv = khu === "gv";
  return (
    <form action={act} className="card mx-auto w-full max-w-md space-y-5 !rounded-[28px] px-7 py-9 sm:px-10">
      <input type="hidden" name="khu" value={khu} />
      <div className="text-center">
        <h2 className="text-3xl font-extrabold">{gv ? "Đăng nhập giáo viên" : "Đăng nhập"}</h2>
        <p className="mt-2 text-slate-600">{gv ? "Dùng email và mật khẩu quản trị đã cấp" : "Vui lòng nhập thông tin của bạn"}</p>
      </div>
      <div className="relative">
        {gv ? <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-800" />
            : <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-800" />}
        {gv
          ? <input name="ma" type="text" inputMode="email" required placeholder="Email giáo viên" aria-label="Email giáo viên" autoComplete="username" autoCapitalize="none" className="input h-14 !rounded-2xl pl-12 text-base" />
          : <input name="ma" required placeholder="Mã học sinh" aria-label="Mã học sinh" autoComplete="username" autoCapitalize="characters" className="input h-14 !rounded-2xl pl-12 text-base" />}
      </div>
      <OMatKhau name="mat_khau" placeholder="Mật khẩu" autoComplete="current-password" />
      <Loi s={s} />
      <Nut pending="Đang đăng nhập…">Đăng nhập</Nut>
      <div className="flex flex-col items-center gap-2 pt-1 text-sm">
        {gv ? (
          <p className="text-center text-slate-500">Quên mật khẩu? Liên hệ quản trị để được cấp lại.</p>
        ) : (
          <>
            <Link href="/quen-mat-khau" className="font-semibold text-xanh-600 hover:underline">Quên mật khẩu?</Link>
            <Link href="/" className="inline-flex items-center gap-1.5 text-xanh-700 hover:underline"><Home className="h-4 w-4" /> Hoặc quay lại trang chủ</Link>
          </>
        )}
      </div>
      {/* Nút chuyển cửa đăng nhập: rõ ràng nhưng nhạt hơn nút chính để học sinh không bấm nhầm */}
      <div className="flex items-center gap-3 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400" aria-hidden="true">
        <span className="h-px flex-1 bg-slate-200" />hoặc<span className="h-px flex-1 bg-slate-200" />
      </div>
      {gv ? (
        <Link href="/dang-nhap" className={btnClass("outline", "md", "!h-auto min-h-12 w-full !whitespace-normal !rounded-2xl py-2.5 text-center")}>
          <GraduationCap className="h-5 w-5 shrink-0" /> Đăng nhập Học sinh
        </Link>
      ) : (
        <Link href="/giao-vien" className={btnClass("outline", "md", "!h-auto min-h-12 w-full !whitespace-normal !rounded-2xl !border-navy-800 py-2.5 text-center !text-navy-800 hover:!bg-xanh-50")}>
          <Presentation className="h-5 w-5 shrink-0" /> Đăng nhập Giáo viên
        </Link>
      )}
    </form>
  );
}

export function QuenMkForm() {
  const [s, act] = useActionState(guiYeuCauQuenMk, { ok: false } as KQ);
  if (s.ok) {
    return (
      <div className="card mx-auto max-w-md space-y-4 !rounded-[28px] px-8 py-10 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-la-500" />
        <h2 className="text-2xl font-extrabold">Đã gửi yêu cầu!</h2>
        <p className="text-slate-600">Thầy sẽ gửi mật khẩu mới cho bạn. Khi nhận được, bạn đăng nhập và đặt lại mật khẩu của riêng mình nhé.</p>
        <Link href="/dang-nhap" className={btnClass("primary", "md")}>Quay lại đăng nhập</Link>
      </div>
    );
  }
  return (
    <form action={act} className="card mx-auto w-full max-w-md space-y-5 !rounded-[28px] px-7 py-9 sm:px-10">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold">Quên mật khẩu</h2>
        <p className="mt-2 text-slate-600">Nhập mã học sinh, hệ thống sẽ gửi yêu cầu cấp lại mật khẩu cho thầy.</p>
      </div>
      <div className="relative">
        <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-800" />
        <input name="ma" required placeholder="Mã học sinh (ví dụ HS001)" aria-label="Mã học sinh" className="input h-14 !rounded-2xl pl-12 text-base" />
      </div>
      <Loi s={s} />
      <Nut pending="Đang gửi…">Gửi yêu cầu cho thầy</Nut>
      <Link href="/dang-nhap" className="flex items-center justify-center gap-1.5 text-sm text-xanh-700 hover:underline"><ArrowLeft className="h-4 w-4" /> Quay lại đăng nhập</Link>
    </form>
  );
}

export function DoiMkLanDauForm({ ten, gv = false }: { ten: string; gv?: boolean }) {
  const [s, act] = useActionState(doiMatKhauLanDau, { ok: false } as KQ);
  if (gv) {
    return (
      <form action={act} className="card mx-auto w-full max-w-md space-y-4 !rounded-[28px] px-7 py-9 sm:px-10">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold">Chào {ten}! Đặt mật khẩu mới</h2>
          <p className="mt-2 text-sm text-slate-600">Tài khoản giáo viên vừa được cấp mật khẩu tạm. Hãy đặt mật khẩu riêng: <b>ít nhất 8 ký tự, có cả chữ và số</b>. Sau này đổi lại trong Cài đặt.</p>
        </div>
        <OMatKhau name="mat_khau" placeholder="Mật khẩu mới" autoComplete="new-password" />
        <OMatKhau name="nhap_lai" placeholder="Nhập lại mật khẩu mới" autoComplete="new-password" />
        <Loi s={s} />
        <Nut pending="Đang lưu…">Lưu mật khẩu</Nut>
      </form>
    );
  }
  return (
    <form action={act} className="card mx-auto w-full max-w-md space-y-4 !rounded-[28px] px-7 py-9 sm:px-10">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold">Chào {ten}! Đặt mật khẩu mới</h2>
        <p className="mt-2 text-sm text-slate-600">Đây là lần đăng nhập đầu tiên. Hãy đặt mật khẩu của riêng em: <b>ít nhất 6 ký tự, có cả chữ và số</b>, dễ nhớ nhưng đừng cho bạn khác biết nhé.</p>
        <p className="mt-2 rounded-xl bg-cam-50 px-3 py-2 text-sm text-cam-600">Em chỉ tự đổi được <b>một lần</b> này. Nếu quên, em nhờ thầy cấp lại.</p>
      </div>
      <OMatKhau name="mat_khau" placeholder="Mật khẩu mới" autoComplete="new-password" />
      <OMatKhau name="nhap_lai" placeholder="Nhập lại mật khẩu mới" autoComplete="new-password" />
      <Loi s={s} />
      <Nut pending="Đang lưu…">Lưu mật khẩu và vào học</Nut>
    </form>
  );
}
