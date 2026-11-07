"use client";
import { useRef, useState } from "react";
import { Bold, Italic, Heading2, List, Code2, Link2, Eye, Pencil } from "lucide-react";
import { Markdown } from "@/components/ui/Markdown";

/** Soạn Markdown + xem trước; nút chèn khối code Python */
export function MarkdownEditor({ name, defaultValue = "", rows = 14, placeholder }: { name: string; defaultValue?: string; rows?: number; placeholder?: string }) {
  const [v, setV] = useState(defaultValue);
  const [xem, setXem] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const chen = (truoc: string, sau = "", mau = "") => {
    const t = ref.current;
    if (!t) return;
    const a = t.selectionStart, b = t.selectionEnd;
    const chon = v.slice(a, b) || mau;
    const moi = v.slice(0, a) + truoc + chon + sau + v.slice(b);
    setV(moi);
    requestAnimationFrame(() => { t.focus(); t.selectionStart = a + truoc.length; t.selectionEnd = a + truoc.length + chon.length; });
  };
  const nut = "rounded-lg p-1.5 hover:bg-xanh-50";
  return (
    <div className="overflow-hidden rounded-2xl border border-[#cfdcf3] bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-vien bg-slate-50 px-2 py-1">
        <button type="button" className={nut} title="In đậm" onClick={() => chen("**", "**", "chữ đậm")}><Bold className="h-4 w-4" /></button>
        <button type="button" className={nut} title="In nghiêng" onClick={() => chen("*", "*", "chữ nghiêng")}><Italic className="h-4 w-4" /></button>
        <button type="button" className={nut} title="Đề mục" onClick={() => chen("\n## ", "\n", "Đề mục")}><Heading2 className="h-4 w-4" /></button>
        <button type="button" className={nut} title="Danh sách" onClick={() => chen("\n- ", "", "ý")}><List className="h-4 w-4" /></button>
        <button type="button" className={nut} title="Chèn khối code" onClick={() => chen("\n```python\n", "\n```\n", "print(\"Xin chào\")")}><Code2 className="h-4 w-4" /></button>
        <button type="button" className={nut} title="Chèn link" onClick={() => chen("[", "](https://)", "tên link")}><Link2 className="h-4 w-4" /></button>
        <button type="button" onClick={() => setXem((x) => !x)} className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-xanh-700 hover:bg-xanh-50">
          {xem ? <><Pencil className="h-4 w-4" /> Soạn</> : <><Eye className="h-4 w-4" /> Xem trước</>}
        </button>
      </div>
      {xem ? <div className="min-h-[200px] p-4">{v.trim() ? <Markdown>{v}</Markdown> : <p className="text-slate-400">(trống)</p>}</div>
        : <textarea ref={ref} name={name} value={v} onChange={(e) => setV(e.target.value)} rows={rows} placeholder={placeholder}
          className="block w-full resize-y p-4 font-mono text-sm outline-none" />}
      {xem && <input type="hidden" name={name} value={v} />}
    </div>
  );
}
