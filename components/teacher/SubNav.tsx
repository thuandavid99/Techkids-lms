"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Thanh tab con (ví dụ trong một lớp: Ma trận · Tình hình nộp · Lịch học · Học sinh · Thông báo) */
export function SubNav({ items }: { items: { href: string; label: string; exact?: boolean }[] }) {
  const path = usePathname();
  return (
    <nav className="no-print mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-vien bg-white/70 p-1">
      {items.map((it) => {
        const on = it.exact ? path === it.href : path.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} aria-current={on ? "page" : undefined}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold ${on ? "bg-navy-950 text-white" : "text-slate-600 hover:bg-xanh-50"}`}>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
