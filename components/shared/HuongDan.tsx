"use client";
import { useState } from "react";
import { Search } from "lucide-react";

import type { MucHD } from "@/lib/huong-dan";

/** Trang Hướng dẫn: tìm câu hỏi thường gặp */
export function HuongDan({ muc }: { muc: MucHD[] }) {
  const [q, setQ] = useState("");
  const loc = muc.filter((m) => !q || (m.hoi + m.dap).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <label className="relative mb-4 block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm câu hỏi… (ví dụ: nộp lại, quên mật khẩu)" className="input !rounded-full pl-9" />
      </label>
      <div className="space-y-2">
        {loc.map((m) => (
          <details key={m.hoi} className="group rounded-2xl border border-vien bg-white px-4 py-3">
            <summary className="cursor-pointer list-none font-bold marker:hidden">❓ {m.hoi}</summary>
            <p className="mt-2 whitespace-pre-line text-slate-700">{m.dap}</p>
          </details>
        ))}
        {loc.length === 0 && <p className="py-6 text-center text-slate-500">Không tìm thấy. Em hỏi trực tiếp thầy nhé!</p>}
      </div>
    </div>
  );
}
