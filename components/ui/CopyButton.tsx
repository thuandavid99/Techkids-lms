"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button, type Variant } from "./Button";
import { useToast } from "./Toast";

/** Sao chép chữ vào bộ nhớ tạm (dán vào Zalo...) */
export function CopyButton({ text, children = "Sao chép", variant = "secondary", size = "sm", onCopied }: {
  text: string | (() => string); children?: React.ReactNode; variant?: Variant; size?: "sm" | "md"; onCopied?: () => void;
}) {
  const [done, setDone] = useState(false);
  const toast = useToast();
  return (
    <Button variant={variant} size={size} onClick={async () => {
      const t = typeof text === "function" ? text() : text;
      try {
        await navigator.clipboard.writeText(t);
      } catch {
        // Trình duyệt cũ: dùng cách dự phòng
        const ta = document.createElement("textarea");
        ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
      }
      setDone(true); toast("Đã sao chép. Mở Zalo và dán để gửi."); onCopied?.();
      setTimeout(() => setDone(false), 2000);
    }}>
      {done ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {children}
    </Button>
  );
}

/** Tải một chuỗi thành file (CSV bảng mật khẩu tạm...) */
export function DownloadTextButton({ filename, text, children, variant = "outline" }: { filename: string; text: string; children: React.ReactNode; variant?: Variant }) {
  return (
    <Button variant={variant} size="sm" onClick={() => {
      const blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" }); // BOM để Excel đọc đúng tiếng Việt
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = filename; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }}>{children}</Button>
  );
}
