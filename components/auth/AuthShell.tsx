import Image from "next/image";
import { BRAND, IMG } from "@/lib/brand";

/** Khung 2 phần của trang Đăng nhập / Quên mật khẩu / Đổi mật khẩu (theo mockup ảnh đăng nhập) */
// kieu = "gv": cửa riêng cho giáo viên — nền navy, nhãn "Khu vực giáo viên" để không nhầm với trang học sinh
export function AuthShell({ children, minhHoa = IMG.login, kieu = "hs", tieuDe, phuDe }: {
  children: React.ReactNode; minhHoa?: string; kieu?: "hs" | "gv"; tieuDe?: string; phuDe?: string;
}) {
  const gv = kieu === "gv";
  return (
    <main className={`relative min-h-dvh overflow-hidden ${gv ? "bg-gradient-to-br from-navy-950 via-navy-800 to-[#1d3a8a]" : "bg-gradient-to-br from-[#a8d4ff] via-[#d6ebff] to-[#eaf4ff]"}`}>
      <div className="mx-auto grid min-h-dvh max-w-6xl grid-cols-1 items-center gap-8 px-5 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <Image src={IMG.logo} alt="" width={84} height={84} className="h-16 w-16 rounded-full lg:h-20 lg:w-20" priority />
            <div className="leading-tight">
              <p className="text-2xl font-extrabold lg:text-3xl"><span className={gv ? "text-white" : "text-navy-950"}>{BRAND.phan1}</span><span className="text-vang-400 [text-shadow:0_1px_0_#c27803]">{BRAND.phan2}</span></p>
              <p className={`text-xl font-bold lg:text-2xl ${gv ? "text-white" : "text-navy-950"}`}>{BRAND.phu}</p>
              <p className={`text-xs ${gv ? "text-blue-100" : "text-navy-800"}`}>{BRAND.tagline}</p>
            </div>
          </div>
          {gv && <p className="mt-6 inline-flex rounded-full bg-cam-500 px-4 py-1.5 text-sm font-bold text-white">Khu vực giáo viên</p>}
          <h1 className={`mt-4 text-4xl font-extrabold tracking-tight lg:text-6xl ${gv ? "text-white" : "text-navy-950"}`}>{tieuDe ?? BRAND.dangNhapTieuDe}</h1>
          <p className={`mt-3 text-lg lg:text-2xl ${gv ? "text-blue-100" : "text-navy-800"}`}>{phuDe ?? BRAND.dangNhapPhuDe}</p>
          {gv ? (
            // Nền tối: hình đã tách nền, đặt trên quầng sáng xanh; mép dưới mờ dần
            <div className="mt-6 hidden h-[390px] w-[440px] items-center justify-center rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.45),rgba(96,165,250,0)_68%)] lg:flex">
              <Image src={minhHoa} alt="" width={393} height={452} className="h-auto max-h-[340px] w-auto [mask-image:linear-gradient(to_bottom,black_82%,transparent)]" priority />
            </div>
          ) : (
            <Image src={minhHoa} alt="" width={640} height={380} className="mt-6 hidden h-auto w-full max-w-[600px] lg:block" priority />
          )}
        </div>
        <div className="w-full min-w-0">{children}</div>
      </div>
    </main>
  );
}
