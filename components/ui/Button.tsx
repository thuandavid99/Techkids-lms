import Link from "next/link";
import type { ComponentProps } from "react";

export type Variant = "primary" | "secondary" | "navy" | "green" | "outline" | "outlineOrange" | "outlineGray" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const V: Record<Variant, string> = {
  primary: "bg-[var(--cam-nut)] hover:bg-[var(--cam-nut-hover)] text-white shadow-sm",
  secondary: "bg-xanh-600 hover:bg-xanh-700 text-white shadow-sm",
  navy: "bg-navy-800 hover:bg-navy-900 text-white shadow-sm",
  green: "bg-la-500 hover:bg-la-600 text-white shadow-sm",
  outline: "border border-xanh-600 text-xanh-700 bg-white hover:bg-xanh-50",
  outlineOrange: "border border-cam-500 text-cam-600 bg-white hover:bg-cam-50",
  outlineGray: "border border-slate-300 text-slate-600 bg-white hover:bg-slate-50",
  ghost: "text-navy-800 hover:bg-xanh-50",
  danger: "bg-do-600 hover:bg-red-700 text-white",
};
const S: Record<Size, string> = { sm: "h-9 px-3.5 text-sm", md: "h-11 px-5 text-[0.95rem]", lg: "h-12 px-7 text-base" };

export function btnClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-xanh-500/30 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap ${V[variant]} ${S[size]} ${extra}`;
}

type BtnProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };
export function Button({ variant = "primary", size = "md", className = "", type = "button", ...p }: BtnProps) {
  return <button type={type} className={btnClass(variant, size, className)} {...p} />;
}

type LinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };
export function ButtonLink({ variant = "primary", size = "md", className = "", ...p }: LinkProps) {
  return <Link className={btnClass(variant, size, className)} {...p} />;
}
