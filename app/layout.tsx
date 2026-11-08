import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { Suspense } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { NavProgress } from "@/components/layout/NavProgress";

const font = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: BRAND.ten, template: `%s · ${BRAND.ten}` },
  description: BRAND.slogan,
  icons: { icon: "/favicon.png", apple: "/apple-touch-icon.png" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#14224f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={font.variable}>
      <body className="font-sans antialiased">
        <Suspense fallback={null}><NavProgress /></Suspense>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
