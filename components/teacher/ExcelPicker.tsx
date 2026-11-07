"use client";
import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { btnClass } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { DongExcel } from "@/lib/domain/ppct";

export interface TrangTinh { ten: string; rows: DongExcel[] }

/** Bước 1 của mọi luồng nhập Excel: chọn file → server đọc → chọn trang tính */
export function ExcelPicker({ onRead, accept = ".xlsx,.csv", label = "Chọn file Excel (.xlsx / .csv)" }: { onRead: (sheets: TrangTinh[], tenFile: string) => void; accept?: string; label?: string }) {
  const [dang, setDang] = useState(false);
  const toast = useToast();
  return (
    <label className={btnClass("green", "md", `cursor-pointer ${dang ? "pointer-events-none opacity-60" : ""}`)}>
      <FileSpreadsheet className="h-5 w-5" /> {dang ? "Đang đọc file…" : label}
      <input type="file" accept={accept} className="sr-only" onChange={async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setDang(true);
        try {
          const fd = new FormData(); fd.append("file", f);
          const res = await fetch("/api/gv/excel/doc", { method: "POST", body: fd });
          const j = await res.json();
          if (!res.ok) throw new Error(j.loi ?? "Không đọc được file.");
          onRead(j.sheets as TrangTinh[], f.name);
        } catch (err) { toast((err as Error).message, "loi"); }
        setDang(false);
        e.target.value = "";
      }} />
    </label>
  );
}

/** Ô chọn cột (ghép cột) */
export function ChonCot({ label, value, onChange, cot, batBuoc = false }: { label: string; value: number; onChange: (v: number) => void; cot: string[]; batBuoc?: boolean }) {
  return (
    <label className="block">
      <span className="label">{label}{batBuoc && <span className="text-do-600"> *</span>}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))} className="input">
        <option value={-1}>— Không dùng —</option>
        {cot.map((c, i) => <option key={i} value={i}>Cột {String.fromCharCode(65 + i)}{c ? `: ${c.slice(0, 30)}` : ""}</option>)}
      </select>
    </label>
  );
}
