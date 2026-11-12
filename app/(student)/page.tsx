import Image from "next/image";
import Link from "next/link";
import { Play, BookOpenText, Code2, FolderOpen, BarChart3, Star, UserRound, Trophy, Award, CalendarDays, ArrowRight, Check } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { duLieuHs } from "@/lib/server/hs";
import { BRAND, IMG } from "@/lib/brand";
import { Card, CardTitle, XemTatCa, BrandCard, PageGrid } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Avatar, LessonIcon } from "@/components/ui/Misc";
import { Pill } from "@/components/ui/Pill";
import { EmptyState } from "@/components/ui/States";
import { HanhTrinhCard, ThongBaoCard, LopCuaBanCard, SapDenHanCard, type TB } from "@/components/student/Cards";
import { hanhTrinh, phanTramHoanThanh, diemTrungBinh, tinhHuyHieu } from "@/lib/domain/stats";
import { trangThaiBuoi, baiCanLamGanNhat } from "@/lib/domain/lesson-status";
import { tinhTrangThai } from "@/lib/domain/status";
import { tenBuoi } from "@/lib/domain/naming";
import { BuoiSapMo, type BuoiKhoa } from "@/components/student/BuoiSapMo";
import { fmtDate } from "@/lib/domain/time";

export const metadata = { title: "Trang chủ" };

export default async function TrangChu() {
  const p = await requireStudent();
  const { sb, lop, dong, buoi, loai, modules, cd } = await duLieuHs(p);
  const now = new Date();

  const [{ data: tbs }, { data: banCungLop }, { data: sapMo }] = await Promise.all([
    sb.from("notifications").select("id, noi_dung, tao_luc, loai, da_doc, lien_ket").eq("user_id", p.id).order("tao_luc", { ascending: false }).limit(3),
    sb.rpc("ds_ban_cung_lop"),
    sb.rpc("hs_buoi_sap_mo", { p_so: 1 }),
  ]);

  const ht = hanhTrinh(buoi, dong, now);
  const pt = phanTramHoanThanh(dong, now);
  const tb = diemTrungBinh(dong, { soChuSo: Number(cd.lam_tron_diem ?? 1) });
  const huyHieu = tinhHuyHieu(dong, now);
  const canLam = baiCanLamGanNhat(dong, now);
  const ttBuoi = new Map(buoi.map((b) => [b.lesson_id, trangThaiBuoi(b, dong.filter((r) => r.lesson_id === b.lesson_id), now)]));
  const buoiTiep = buoi.find((b) => !ttBuoi.get(b.lesson_id)?.xong) ?? buoi[buoi.length - 1];
  const ganDay = buoi.slice(-4);
  const ten = p.ho_ten.split(" ").pop();

  // Bước hành trình theo module (bản điện thoại)
  const buocModule = modules.map((m) => {
    const ds = buoi.filter((b) => b.module_id === m.id);
    return { ten: m.ten.replace(/^Module\s*\d+\s*[:.-]\s*/i, ""), xong: ds.length > 0 && ds.every((b) => ttBuoi.get(b.lesson_id)?.xong) };
  }).filter((x) => x.ten);

  const NUT = [
    { href: "/buoi-hoc", label: ["Danh sách", "buổi học"], I: BookOpenText, c: "from-xanh-600 to-xanh-500" },
    { href: canLam ? `/bai-tap/${canLam.assignment_id}/lam-bai` : "/bai-tap", label: ["Làm bài tập", "Python"], I: Code2, c: "from-cam-500 to-cam-400" },
    { href: "/kho-hoc-lieu", label: ["Tài liệu", "học tập"], I: FolderOpen, c: "from-tim-500 to-violet-400" },
    { href: "/ket-qua", label: ["Xem kết quả", ""], I: BarChart3, c: "from-la-500 to-emerald-400" },
  ];

  if (!lop) {
    return <Card><EmptyState title="Em chưa được xếp vào lớp nào" hint="Em báo thầy để được thêm vào lớp nhé." /></Card>;
  }

  return (
    <PageGrid
      main={<>
        {/* Bản điện thoại (gọn): lời chào + hành trình dạng bậc thang */}
        <Card className="lg:hidden">
          <div className="flex items-center gap-3">
            <Avatar name={p.ho_ten} avatar={p.avatar} size={52} />
            <h1 className="text-2xl font-extrabold">Chào bạn, {ten}!</h1>
          </div>
          {buocModule.length > 0 && (
            <>
              <p className="mt-4 font-bold">Hành trình học tập của bạn</p>
              <ol className="mt-3 flex items-start gap-1 overflow-x-auto pb-1">
                {buocModule.map((b, i) => (
                  <li key={i} className="flex min-w-[84px] flex-col items-center text-center text-xs">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full font-bold ${b.xong ? "bg-la-500 text-white" : "bg-xanh-100 text-xanh-700"}`}>{b.xong ? <Check className="h-5 w-5" /> : i + 1}</span>
                    <span className="mt-1 line-clamp-2 font-medium">{b.ten}</span>
                  </li>
                ))}
                <li className="flex min-w-[60px] flex-col items-center text-xs"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-vang-400 text-white"><Trophy className="h-5 w-5" /></span></li>
              </ol>
            </>
          )}
        </Card>

        {/* Banner chào mừng */}
        <section className="card relative hidden overflow-hidden bg-gradient-to-r from-[#dceeff] via-[#e9f4ff] to-[#d4e8ff] lg:block">
          <div className="relative z-10 max-w-[56%] px-8 py-8">
            <p className="text-2xl font-bold text-navy-950">Chào mừng bạn đến với</p>
            <p className="text-4xl font-extrabold"><span className="text-xanh-600">{BRAND.phan1}</span><span className="text-cam-500">{BRAND.phan2}</span> <span className="text-navy-950">{BRAND.phu}!</span></p>
            <p className="mt-2 text-navy-800">{BRAND.slogan}</p>
            <ButtonLink href={buoiTiep ? `/buoi-hoc/${buoiTiep.lesson_id}` : "/buoi-hoc"} className="mt-5 !bg-vang-400 !text-navy-950 hover:!bg-amber-400"><Play className="h-4 w-4 fill-current" /> Bắt đầu học ngay</ButtonLink>
          </div>
          <Image src={IMG.hero} alt="" width={420} height={290} priority className="absolute bottom-0 right-4 h-[95%] w-auto object-contain" />
        </section>

        {/* 4 nút chức năng lớn */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {NUT.map(({ href, label, I, c }) => (
            <Link key={href + label[0]} href={href} className={`flex min-w-0 items-center gap-2 rounded-2xl bg-gradient-to-br ${c} px-3 py-3.5 text-white shadow-md transition-transform hover:-translate-y-0.5 sm:gap-3 sm:px-4 sm:py-4`}>
              <I className="h-6 w-6 shrink-0 sm:h-8 sm:w-8" />
              <span className="min-w-0 text-sm font-semibold leading-tight sm:text-[0.95rem]">{label[0]}<br />{label[1]}</span>
              <ArrowRight className="ml-auto hidden h-4 w-4 shrink-0 sm:block" />
            </Link>
          ))}
        </div>

        <div className="lg:hidden"><SapDenHanCard bai={canLam ? { assignment_id: canLam.assignment_id, ma: canLam.ma, tieu_de: canLam.tieu_de, han: tinhTrangThai(canLam, now).hanHieuLuc?.toISOString() ?? null } : null} /></div>

        {/* Buổi học gần đây */}
        <Card>
          <CardTitle icon={<Star className="h-6 w-6 fill-vang-400 text-vang-400" />} action={<XemTatCa href="/buoi-hoc" />}>Buổi học gần đây</CardTitle>
          {ganDay.length === 0 ? <EmptyState title="Chưa có buổi học nào được mở" hint="Thầy sẽ mở buổi học khi đến ngày học." /> : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {ganDay.map((b) => {
                const tt = ttBuoi.get(b.lesson_id)!;
                const l = b.loai_id ? loai.get(b.loai_id) : undefined;
                return (
                  <Link key={b.lesson_id} href={`/buoi-hoc/${b.lesson_id}`} className="flex flex-col rounded-2xl border border-vien bg-white p-4 hover:border-xanh-500">
                    <LessonIcon icon={l?.icon} mau={l?.mau} size={44} />
                    <p className="mt-3 line-clamp-2 font-bold">{tenBuoi(b.nhan_buoi, b.tieu_de)}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" /> {fmtDate(b.ngay_hoc)}</p>
                    <div className="mt-2 flex items-center justify-between"><Pill mau={tt.mau} icon={tt.icon}>{tt.text}</Pill><span className="rounded-full bg-xanh-50 p-1.5 text-xanh-600"><ArrowRight className="h-4 w-4" /></span></div>
                  </Link>
                );
              })}
            </div>
          )}
          <div className="mt-3"><BuoiSapMo gon ds={(sapMo as BuoiKhoa[] | null) ?? []} /></div>
        </Card>

        {/* Thông tin cá nhân */}
        <Card>
          <CardTitle icon={<UserRound className="h-6 w-6 text-xanh-600" />}>Thông tin cá nhân</CardTitle>
          <div className="grid gap-3 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div className="flex items-center gap-4 rounded-2xl border border-xanh-100 bg-white p-3">
              <Avatar name={p.ho_ten} avatar={p.avatar} size={72} />
              <div className="text-sm"><p className="text-lg font-extrabold">{p.ho_ten}</p><p>Mã học sinh: {p.ma_hs}</p><p>Lớp: {lop.ten_lop}</p></div>
            </div>
            {[
              { I: Star, c: "text-vang-400 fill-vang-400", l: "Điểm trung bình", v: tb === null ? "—" : tb.toFixed(1) },
              { I: Trophy, c: "text-vang-400", l: "Hoàn thành", v: `${pt.phanTram}%` },
              { I: Award, c: "text-cam-500", l: "Huy hiệu", v: huyHieu[0]?.ten ?? "Chưa có huy hiệu" },
            ].map(({ I, c, l, v }) => (
              <div key={l} className="flex flex-col items-center justify-center rounded-2xl border border-xanh-100 bg-white p-3 text-center">
                <I className={`h-7 w-7 ${c}`} /><p className="mt-1 text-sm text-slate-600">{l}</p><p className="text-lg font-extrabold">{v}</p>
              </div>
            ))}
          </div>
        </Card>
      </>}
      aside={<>
        <HanhTrinhCard {...ht} />
        <div className="hidden lg:block"><SapDenHanCard bai={canLam ? { assignment_id: canLam.assignment_id, ma: canLam.ma, tieu_de: canLam.tieu_de, han: tinhTrangThai(canLam, now).hanHieuLuc?.toISOString() ?? null } : null} /></div>
        <ThongBaoCard ds={(tbs as TB[]) ?? []} />
        <LopCuaBanCard ten={lop.ten_lop} siSo={(banCungLop as unknown[] | null)?.length ?? 0} />
        <BrandCard />
      </>}
    />
  );
}
