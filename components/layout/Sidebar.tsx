"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, BookMarked, FolderOpen, ClipboardList, BarChart3, Settings, Users, UserRound, BookOpen, Menu, X, UserCog, Inbox } from "lucide-react";
import { BRAND, IMG } from "@/lib/brand";

const ICON = { home: Home, buoi: BookMarked, kho: FolderOpen, bai: ClipboardList, kq: BarChart3, caidat: Settings, lop: Users, hs: UserRound, ct: BookOpen, gv: UserCog, thu: Inbox };
export type IconKey = keyof typeof ICON;
export interface NavItem { href: string; label: string; icon: IconKey; exact?: boolean; match?: string[] }

/** Độ khớp của một mục menu với trang hiện tại (0 = không khớp). Mục khớp DÀI nhất được tô sáng. */
function doKhop(path: string, it: NavItem): number {
  if (it.exact) return path === it.href ? it.href.length : 0;
  let tot = 0;
  for (const m of it.match ?? [it.href]) if (path === m || path.startsWith(m + "/")) tot = Math.max(tot, m.length);
  return tot;
}

function Logo({ nhan }: { nhan?: string }) {
  return (
    <Link href="/" className="flex flex-col items-center px-3 pt-5 pb-4 text-center">
      {nhan && <span className="mb-2 rounded-full bg-cam-500 px-3 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-white">{nhan}</span>}
      <Image src={IMG.logoRobot} alt="" width={96} height={96} className="h-[84px] w-[84px] rounded-full shadow-lg ring-4 ring-white/15" priority />
      <span className="mt-1 text-[1.65rem] font-extrabold leading-none tracking-tight">
        <span className="text-white">{BRAND.phan1}</span><span className="text-vang-400">{BRAND.phan2}</span>
      </span>
      <span className="text-lg font-bold leading-tight text-white">{BRAND.phu}</span>
      <span className="mt-0.5 text-[0.65rem] text-blue-100/80">{BRAND.tagline}</span>
    </Link>
  );
}

function Menu_({ items, onNav }: { items: NavItem[]; onNav?: () => void }) {
  const path = usePathname();
  return (
    <nav aria-label="Menu chính" className="mt-2 flex flex-col gap-1.5 px-3">
      {items.map((it) => {
        const I = ICON[it.icon];
        const diem = doKhop(path, it);
        const on = diem > 0 && diem === Math.max(...items.map((x) => doKhop(path, x)));
        return (
          <Link key={it.href} href={it.href} onClick={onNav} aria-current={on ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.95rem] font-medium transition-colors ${on ? "bg-[var(--cam-nut)] text-white shadow-md" : "text-blue-50 hover:bg-white/10"}`}>
            <I className="h-5 w-5" /> {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Bottom() {
  return (
    <div className="relative mt-auto overflow-hidden pb-5 pt-2 text-center">
      <Image src={IMG.sidebarRocket} alt="" width={150} height={115} className="mx-auto h-auto w-[130px]" />
      <p className="mt-1 text-[0.95rem] font-bold leading-snug text-white">
        {BRAND.loiSidebar[0]}<br /><span className="text-vang-400">{BRAND.loiSidebar[1]}</span><br /><span className="text-vang-400">{BRAND.loiSidebar[2]}</span>
      </p>
    </div>
  );
}

const NEN = "bg-gradient-to-b from-navy-900 via-navy-800 to-[#1d3a8a]";

/** Sidebar máy tính (≥1024px) + menu bật ra trên điện thoại */
export function Sidebar({ items, nhan }: { items: NavItem[]; nhan?: string }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  return (
    <>
      <aside className={`no-print sticky top-0 hidden h-dvh w-[200px] shrink-0 flex-col overflow-y-auto rounded-r-3xl lg:flex ${NEN}`}>
        <Logo nhan={nhan} /><Menu_ items={items} /><Bottom />
      </aside>
      {/* Điện thoại: nút mở menu */}
      <button onClick={() => setOpen(true)} aria-label="Mở menu"
        className="no-print fixed left-3 top-3 z-40 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-white shadow-lg lg:hidden">
        <Menu className="h-6 w-6" />
      </button>
      {open && (
        <div className="no-print fixed inset-0 z-[80] bg-navy-950/50 lg:hidden" onClick={() => setOpen(false)}>
          <aside className={`flex h-full w-[240px] flex-col overflow-y-auto ${NEN}`} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} aria-label="Đóng menu" className="ml-auto mr-3 mt-3 text-white"><X className="h-6 w-6" /></button>
            <Logo nhan={nhan} /><Menu_ items={items} onNav={() => setOpen(false)} /><Bottom />
          </aside>
        </div>
      )}
    </>
  );
}

/** Thanh điều hướng dưới cho học sinh trên điện thoại */
export function BottomNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Điều hướng nhanh" className="no-print fixed inset-x-0 bottom-0 z-40 flex border-t border-vien bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {items.map((it) => {
        const I = ICON[it.icon];
        const diem = doKhop(path, it);
        const on = diem > 0 && diem === Math.max(...items.map((x) => doKhop(path, x)));
        return (
          <Link key={it.href} href={it.href} aria-current={on ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.7rem] font-semibold ${on ? "text-cam-500" : "text-slate-500"}`}>
            <I className="h-5 w-5" /> {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
