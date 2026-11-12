import Image from "next/image";
import Link from "next/link";
import { IMG } from "@/lib/brand";
import { BookOpen, Code2, Laptop, RefreshCw, ClipboardCheck, Trophy, FolderKanban, FileText, FileSpreadsheet, Presentation, Image as ImageIcon, Link2, FileArchive, FileCode, Music, Video } from "lucide-react";

/** Vòng tròn tiến độ (Hành trình học tập) */
export function ProgressRing({ value, size = 120, stroke = 12, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${v}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#dbeafe" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="url(#g)" strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} />
        <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0%" stopColor="#22c55e" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient></defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-2xl font-extrabold text-navy-950">{label ?? `${v}%`}</div>
    </div>
  );
}

const AVATAR_MAU: Record<string, string> = {
  cam: "from-orange-300 to-orange-500", tim: "from-violet-300 to-violet-500", la: "from-emerald-300 to-emerald-500",
  hong: "from-pink-300 to-pink-500", xanh: "from-sky-300 to-blue-500",
};
// "default" = bạn nam, "nu" = bạn nữ, còn lại là vòng màu có chữ cái đầu
export const DS_AVATAR = ["default", "nu", "cam", "tim", "la", "hong", "xanh"];

/** Ảnh đại diện: hình bạn nam / bạn nữ, hoặc vòng màu có chữ cái đầu */
export function Avatar({ name, avatar = "default", size = 40 }: { name: string; avatar?: string; size?: number }) {
  if (avatar === "nu") {
    return <Image src={IMG.avatarNu} alt="" width={size} height={size} unoptimized className="rounded-full bg-xanh-50 object-cover" style={{ width: size, height: size }} />;
  }
  if (avatar === "default" || !AVATAR_MAU[avatar]) {
    return <Image src={IMG.avatar} alt="" width={size} height={size} className="rounded-full bg-xanh-50 object-cover" style={{ width: size, height: size }} />;
  }
  const chu = name.trim().split(/\s+/).pop()?.[0]?.toUpperCase() ?? "?";
  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br font-extrabold text-white ${AVATAR_MAU[avatar]}`} style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {chu}
    </span>
  );
}

/** Ô vuông icon nhiều màu cho buổi học (theo loại buổi) */
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "book-open": BookOpen, code: Code2, laptop: Laptop, "refresh-cw": RefreshCw,
  "clipboard-check": ClipboardCheck, trophy: Trophy, "folder-kanban": FolderKanban,
};
export const DS_ICON = Object.keys(ICONS);
const NEN: Record<string, string> = {
  blue: "bg-xanh-600 text-white", orange: "bg-cam-500 text-white", purple: "bg-tim-500 text-white",
  green: "bg-la-500 text-white", red: "bg-cam-600 text-white", teal: "bg-teal-500 text-white", gray: "bg-slate-400 text-white",
};
export const DS_MAU = Object.keys(NEN);
export function LessonIcon({ icon, mau, size = 56, className = "" }: { icon?: string | null; mau?: string | null; size?: number; className?: string }) {
  const I = ICONS[icon ?? ""] ?? BookOpen;
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-2xl shadow-sm ${NEN[mau ?? "blue"] ?? NEN.blue} ${className}`} style={{ width: size, height: size }}>
      <I className="h-1/2 w-1/2" />
    </span>
  );
}

/** Icon theo loại file tài liệu */
export function FileIcon({ ten, nguon }: { ten?: string | null; nguon?: string }) {
  const t = (ten ?? "").toLowerCase();
  let I = FileText;
  if (nguon === "link") I = Link2;
  else if (/\.(xlsx?|csv)$/.test(t)) I = FileSpreadsheet;
  else if (/\.(pptx?)$/.test(t)) I = Presentation;
  else if (/\.(png|jpe?g|gif|webp)$/.test(t)) I = ImageIcon;
  else if (/\.(zip|sb3)$/.test(t)) I = FileArchive;
  else if (/\.(py|txt|md)$/.test(t)) I = FileCode;
  else if (/\.mp3$/.test(t)) I = Music;
  else if (/\.mp4$/.test(t)) I = Video;
  return <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-xanh-50 text-navy-800"><I className="h-5 w-5" /></span>;
}

/** Tab dạng link (giữ trạng thái trên URL) */
export function LinkTabs({ tabs, active }: { tabs: { href: string; label: React.ReactNode; key: string }[]; active: string }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-vien">
      {tabs.map((t) => (
        <Link key={t.key} href={t.href} role="tab" aria-selected={t.key === active}
          className={`-mb-px whitespace-nowrap rounded-t-xl border px-5 py-2.5 text-[0.95rem] font-semibold ${t.key === active ? "border-vien border-b-white border-b-2 bg-white text-xanh-700 shadow-[inset_0_-3px_0_#2563eb]" : "border-transparent text-slate-500 hover:text-navy-800"}`}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}

/** Tab dạng "pill" như màn Danh sách bài tập / Kho học liệu */
export function PillTabs({ tabs, active }: { tabs: { href: string; label: React.ReactNode; key: string }[]; active: string }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-2xl border border-vien bg-white/70 p-1">
      {tabs.map((t) => (
        <Link key={t.key} href={t.href} aria-current={t.key === active ? "page" : undefined}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${t.key === active ? "bg-navy-950 text-white" : "text-slate-500 hover:bg-xanh-50"}`}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}

export function Stat({ icon, label, value, tone = "navy" }: { icon?: React.ReactNode; label: string; value: React.ReactNode; tone?: "navy" | "green" | "orange" | "red" }) {
  const c = { navy: "text-navy-950", green: "text-la-600", orange: "text-cam-500", red: "text-do-600" }[tone];
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-xanh-100 bg-white px-4 py-3">
      {icon && <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-xanh-50 text-navy-800">{icon}</span>}
      <div className="min-w-0">
        <p className="text-sm text-slate-600">{label}</p>
        <p className={`text-2xl font-extrabold leading-tight ${c}`}>{value}</p>
      </div>
    </div>
  );
}
