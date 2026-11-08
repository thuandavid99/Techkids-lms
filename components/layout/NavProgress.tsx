"use client";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thanh tiến trình mảnh ở mép trên màn hình: hiện NGAY khi bấm một liên kết trong web,
 * tắt khi trang mới hiện ra. Giúp người dùng biết web đang tải, không bấm lại nhiều lần.
 */
export function NavProgress() {
  const path = usePathname();
  const sp = useSearchParams();
  const [dangTai, setDangTai] = useState(false);

  useEffect(() => { setDangTai(false); }, [path, sp]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      setDangTai(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!dangTai) return null;
  return (
    <div className="no-print pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden" role="progressbar" aria-label="Đang tải trang">
      <div className="h-full w-1/3 animate-[nav-chay_1s_ease-in-out_infinite] rounded-r-full bg-cam-500" />
    </div>
  );
}
