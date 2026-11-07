import { Check, Hourglass, RotateCcw, AlarmClock, Minus, FileText, X, Circle, Flame, HelpCircle, CalendarClock } from "lucide-react";
import type { MauPill } from "@/lib/domain/status";
import { NHAN_CHAM, NHAN_THOI_GIAN, type KetQuaTrangThai } from "@/lib/domain/status";

const MAU: Record<MauPill, string> = {
  green: "bg-la-50 text-la-600 border-la-500/25",
  blue: "bg-xanh-50 text-xanh-700 border-xanh-500/25",
  orange: "bg-cam-50 text-cam-600 border-cam-400/30",
  orangeStrong: "bg-cam-500 text-white border-cam-500",
  yellow: "bg-amber-50 text-amber-700 border-amber-400/40",
  red: "bg-do-50 text-do-600 border-do-600/30",
  gray: "bg-slate-100 text-slate-600 border-slate-300/60",
  purple: "bg-tim-50 text-tim-500 border-tim-500/25",
};

const ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  check: Check, hourglass: Hourglass, rotate: RotateCcw, alarm: AlarmClock, minus: Minus,
  file: FileText, x: X, circle: Circle, fire: Flame, help: HelpCircle, calendar: CalendarClock,
};

export function Pill({ mau = "gray", icon, children, className = "", title }: { mau?: MauPill; icon?: string; children: React.ReactNode; className?: string; title?: string }) {
  const I = icon ? ICON[icon] : null;
  return (
    <span title={title} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${MAU[mau]} ${className}`}>
      {I && <I className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}

/** Hiện cả 2 nhãn: thời gian nộp (Đúng hạn/Trễ/Không nộp bài) + trạng thái chấm */
export function NhanBai({ kq, diem, diemToiDa, gon = false }: { kq: KetQuaTrangThai; diem?: number | null; diemToiDa?: number; gon?: boolean }) {
  const tg = kq.nhanThoiGian ? NHAN_THOI_GIAN[kq.nhanThoiGian] : null;
  const ch = NHAN_CHAM[kq.trangThai];
  const hienCham = kq.trangThai !== "chua_nop";
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {tg && !(gon && hienCham && kq.nhanThoiGian === "dung_han") && <Pill mau={tg.mau} icon={tg.icon}>{tg.text}</Pill>}
      {hienCham && (
        <Pill mau={ch.mau} icon={ch.icon}>
          {kq.trangThai === "da_cham" && diem !== null && diem !== undefined ? `Đã chấm: ${Number(diem).toFixed(1)}/${diemToiDa ?? 10}` : ch.text}
        </Pill>
      )}
      {kq.coChuaLamDuoc && <Pill mau="purple" icon="help">🙋 Chưa làm được</Pill>}
    </span>
  );
}

export function LoaiPill({ ten, mau }: { ten: string; mau: string }) {
  const m: Record<string, MauPill> = { blue: "blue", orange: "orange", purple: "purple", green: "green", red: "orangeStrong", teal: "blue", gray: "gray" };
  return <Pill mau={m[mau] ?? "gray"}>{ten}</Pill>;
}
