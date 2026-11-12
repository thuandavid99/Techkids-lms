"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/** Thanh tab con (ví dụ trong một lớp: Ma trận · Tình hình nộp · Lịch học · Học sinh · Thông báo) */
export function SubNav({ items }: { items: { href: string; label: string; exact?: boolean }[] }) {
  const path = usePathname();
  const sp = useSearchParams();
  // Tab theo ?tab=… (vd. Cài đặt): tab đầu tiên là mặc định khi URL chưa có ?tab
  const tabDau = items.map((x) => new URLSearchParams(x.href.split("?")[1] ?? "").get("tab")).find(Boolean) ?? null;
  return (
    <nav className="no-print mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-vien bg-white/70 p-1">
      {items.map((it) => {
        const [duong, q] = it.href.split("?");
        const tab = new URLSearchParams(q ?? "").get("tab");
        const dungDuong = it.exact || tab ? path === duong : path === duong || path.startsWith(duong + "/");
        const on = dungDuong && (!tab || (sp.get("tab") ?? tabDau) === tab);
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
