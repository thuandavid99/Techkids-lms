"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Bell, ChevronDown, GraduationCap, LogOut, UserRound, HelpCircle, Settings } from "lucide-react";
import { Avatar } from "@/components/ui/Misc";
import { dangXuat } from "@/lib/actions/auth";
import { chonLop } from "@/lib/actions/common";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function ClassPill({ ten, href }: { ten: string; href?: string }) {
  const inner = (<><GraduationCap className="h-5 w-5 shrink-0 text-navy-800" /> <span className="truncate font-semibold">Lớp {ten}</span>{href && <ChevronDown className="hidden h-4 w-4 shrink-0 sm:block" />}</>);
  // min-w-0 + truncate: tên lớp dài tự rút gọn "…" thay vì đẩy chuông/ảnh đại diện ra ngoài màn hình
  const cls = "card inline-flex h-11 min-w-0 max-w-full items-center gap-2 rounded-2xl px-4 text-[0.95rem]";
  return href ? <Link href={href} className={cls}>{inner}</Link> : <span className={cls}>{inner}</span>;
}

/** Ô chọn lớp của giáo viên: lưu vào cookie, mọi màn đọc theo lớp đang chọn */
export function ClassSelect({ lops, current }: { lops: { id: string; ten_lop: string }[]; current: string | null }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  if (lops.length === 0) return <ClassPill ten="(chưa có lớp)" />;
  // Đang xem trang của một lớp cụ thể (/gv/lop/<id> hoặc ?lop=<id>) → ô chọn hiện đúng lớp đó
  const tuUrl = path.match(/^\/gv\/lop\/([0-9a-f-]{36})/i)?.[1] ?? sp.get("lop");
  const dangChon = lops.some((l) => l.id === tuUrl) ? tuUrl : current;
  return (
    <label className="card inline-flex h-11 min-w-0 max-w-full items-center gap-2 rounded-2xl px-3 text-[0.95rem]">
      <GraduationCap className="h-5 w-5 shrink-0 text-navy-800" />
      <span className="sr-only">Chọn lớp</span>
      <select className="min-w-0 max-w-full cursor-pointer truncate bg-transparent font-semibold outline-none sm:max-w-[18rem]" value={dangChon ?? ""} disabled={pending}
        onChange={(e) => start(async () => {
          const moi = e.target.value;
          await chonLop(moi);
          // Ô chọn lớp trên cùng là DUY NHẤT: trang đang mở tự chuyển sang lớp mới (kể cả link có ?lop= hoặc /gv/lop/<id>)
          const u = new URL(window.location.href);
          const m = u.pathname.match(/^\/gv\/lop\/[0-9a-f-]{36}(\/.*)?$/i);
          if (m) { router.push(`/gv/lop/${moi}${m[1] ?? ""}`); return; }
          if (u.searchParams.has("lop")) { u.searchParams.set("lop", moi); router.push(u.pathname + "?" + u.searchParams.toString()); return; }
          router.refresh();
        })}>
        {lops.map((l) => <option key={l.id} value={l.id}>Lớp {l.ten_lop}</option>)}
      </select>
    </label>
  );
}

export function Bell_({ count, href }: { count: number; href: string }) {
  return (
    <Link href={href} aria-label={`Thông báo${count ? `, ${count} chưa đọc` : ""}`} className="card relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
      <Bell className="h-5 w-5 text-navy-800" />
      {count > 0 && <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-do-600 px-1 text-[0.7rem] font-bold text-white">{count > 99 ? "99+" : count}</span>}
    </Link>
  );
}

export function UserMenu({ name, avatar, laGv, vaiTro }: { name: string; avatar: string; laGv: boolean; vaiTro?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const f = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, []);
  const items = laGv
    ? [{ href: "/gv/cai-dat", label: "Cài đặt", I: Settings }, { href: "/gv/thong-bao", label: "Thông báo", I: Bell }, { href: "/gv/huong-dan", label: "Hướng dẫn", I: HelpCircle }]
    : [{ href: "/cai-dat", label: "Tài khoản của em", I: UserRound }, { href: "/huong-dan", label: "Hướng dẫn", I: HelpCircle }];
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((x) => !x)} aria-expanded={open} aria-haspopup="menu" className="card inline-flex h-11 items-center gap-2 rounded-2xl pl-1.5 pr-3">
        <Avatar name={name} avatar={avatar} size={34} />
        <span className="hidden max-w-[160px] flex-col lg:max-w-[220px] items-start leading-tight sm:flex">
          <span className="max-w-[160px] truncate font-semibold lg:max-w-[220px]" title={name}>{name}</span>
          {vaiTro && <span className={`text-[0.7rem] font-bold uppercase tracking-wide ${vaiTro === "Quản trị" ? "text-cam-600" : "text-xanh-600"}`}>{vaiTro}</span>}
        </span>
        <ChevronDown className="hidden h-4 w-4 sm:block" />
      </button>
      {open && (
        <div role="menu" className="card absolute right-0 top-12 z-50 w-60 max-w-[calc(100vw-2rem)] overflow-hidden py-1">
          <p className="border-b border-vien px-4 pb-2 pt-1.5 text-sm font-bold leading-snug text-navy-950">{name}</p>
          {items.map(({ href, label, I }) => (
            <Link key={href} href={href} role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-xanh-50"><I className="h-4 w-4" /> {label}</Link>
          ))}
          <form action={dangXuat}>
            <button role="menuitem" className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-do-600 hover:bg-do-50"><LogOut className="h-4 w-4" /> Đăng xuất</button>
          </form>
        </div>
      )}
    </div>
  );
}
