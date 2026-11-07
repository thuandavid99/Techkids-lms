import Image from "next/image";
import { BRAND, IMG } from "@/lib/brand";

/** Khung 2 phần của trang Đăng nhập / Quên mật khẩu / Đổi mật khẩu (theo mockup ảnh đăng nhập) */
export function AuthShell({ children, minhHoa = IMG.login }: { children: React.ReactNode; minhHoa?: string }) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-[#a8d4ff] via-[#d6ebff] to-[#eaf4ff]">
      <div className="mx-auto grid min-h-dvh max-w-6xl items-center gap-8 px-5 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="flex items-center gap-3">
            <Image src={IMG.logo} alt="" width={84} height={84} className="h-16 w-16 rounded-full lg:h-20 lg:w-20" priority />
            <div className="leading-tight">
              <p className="text-2xl font-extrabold lg:text-3xl"><span className="text-navy-950">{BRAND.phan1}</span><span className="text-vang-400 [text-shadow:0_1px_0_#c27803]">{BRAND.phan2}</span></p>
              <p className="text-xl font-bold text-navy-950 lg:text-2xl">{BRAND.phu}</p>
              <p className="text-xs text-navy-800">{BRAND.tagline}</p>
            </div>
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-navy-950 lg:text-6xl">{BRAND.dangNhapTieuDe}</h1>
          <p className="mt-3 text-lg text-navy-800 lg:text-2xl">{BRAND.dangNhapPhuDe}</p>
          <Image src={minhHoa} alt="" width={640} height={380} className="mt-6 hidden h-auto w-full max-w-[600px] lg:block" priority />
        </div>
        <div className="w-full">{children}</div>
      </div>
    </main>
  );
}
