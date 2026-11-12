import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BRAND, IMG } from "@/lib/brand";

export function Card({ children, className = "", pad = true, as: As = "section" }: { children: React.ReactNode; className?: string; pad?: boolean; as?: "section" | "div" | "article" }) {
  return <As className={`card ${pad ? "card-pad" : ""} ${className}`}>{children}</As>;
}

export function CardTitle({ icon, children, action }: { icon?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="h-card flex min-w-0 items-center gap-2">{icon}{children}</h2>
      {action}
    </div>
  );
}

export function XemTatCa({ href, children = "Xem tất cả" }: { href: string; children?: React.ReactNode }) {
  return <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-xanh-600 hover:underline">{children} <ArrowRight className="h-4 w-4" /></Link>;
}

/** Bố cục 2 cột như mockup: nội dung chính + cột phải (~340px) */
export function PageGrid({ main, aside }: { main: React.ReactNode; aside?: React.ReactNode }) {
  if (!aside) return <div className="space-y-5">{main}</div>;
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-5">{main}</div>
      <aside className="min-w-0 space-y-5">{aside}</aside>
    </div>
  );
}

export function PageHeader({ title, actions, back, sub }: { title: React.ReactNode; actions?: React.ReactNode; back?: { href: string; label: string }; sub?: React.ReactNode }) {
  return (
    <div className="mb-5">
      {back && (
        <Link href={back.href} className="mb-3 inline-flex items-center gap-2 text-[0.95rem] font-medium text-navy-800 hover:text-xanh-600">
          <ArrowLeft className="h-4 w-4" /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="h-page min-w-0">{title}</h1>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {sub && <div className="mt-2 text-slate-600">{sub}</div>}
    </div>
  );
}

/** Thẻ minh họa robot ở cột phải */
export function RobotCard({ img, title, text }: { img: string; title?: string; text?: string }) {
  return (
    <div className="card overflow-hidden">
      <div className="relative mx-auto aspect-[5/4] w-full max-w-[280px]">
        <Image src={img} alt="" fill sizes="280px" className="object-contain" />
      </div>
      {(title || text) && (
        <div className="px-5 pb-5 text-center">
          {title && <p className="text-lg font-extrabold leading-snug text-navy-950">{title}</p>}
          {text && <p className="mt-1 text-sm text-slate-600">{text}</p>}
        </div>
      )}
    </div>
  );
}

/** Khối thương hiệu nhỏ cuối cột phải */
export function BrandCard() {
  return (
    <div className="card relative flex items-center gap-3 overflow-hidden bg-gradient-to-r from-xanh-50 to-white px-5 py-4">
      <div className="flex-1">
        <p className="text-lg font-extrabold"><span className="text-navy-950">{BRAND.phan1}</span><span className="text-cam-500">{BRAND.phan2}</span> <span className="text-navy-950">{BRAND.phu}</span></p>
        <p className="text-xs text-slate-600">{BRAND.khauHieu}</p>
      </div>
      <Image src={IMG.logo} alt="" width={56} height={56} className="rounded-full" />
    </div>
  );
}
