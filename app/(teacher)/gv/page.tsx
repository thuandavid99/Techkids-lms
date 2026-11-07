import Link from "next/link";
import { Users, ArrowRight, Trophy, CalendarDays, Hourglass, UserX, PhoneCall, Hand, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cacLop, buoiLop } from "@/lib/server/data";
import { tongQuan, dangOBuoi } from "@/lib/server/gv";
import { Card, PageGrid, BrandCard, CardTitle } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { tenBaiTap } from "@/lib/domain/naming";
import { fmtAgo } from "@/lib/domain/time";

export const metadata = { title: "Tổng quan các lớp" };

export default async function Page() {
  const sb = await createClient();
  const lops = await cacLop(sb);
  const [{ tomTat, theThe }, { data: hs }, { data: moiNop }, ...lich] = await Promise.all([
    tongQuan(sb, lops),
    sb.from("profiles").select("id, class_id").eq("vai_tro", "hoc_sinh").is("deleted_at", null).eq("dang_hoc", true),
    sb.from("submissions").select("id, nop_luc_moi_nhat, trang_thai, profiles(ho_ten, class_id), assignments(ma, tieu_de)").order("nop_luc_moi_nhat", { ascending: false, nullsFirst: false }).limit(5),
    ...lops.map((l) => buoiLop(sb, l.id)),
  ]);
  const siSo = new Map<string, number>();
  for (const h of (hs as { class_id: string | null }[]) ?? []) if (h.class_id) siSo.set(h.class_id, (siSo.get(h.class_id) ?? 0) + 1);
  const tenLop = new Map(lops.map((l) => [l.id, l.ten_lop]));

  const CHIP = [
    { I: Hourglass, n: tomTat.choCham, t: "bài chờ chấm", href: "/gv/bai-tap/hang-doi", c: "text-cam-500" },
    { I: UserX, n: tomTat.chuaNop.size, t: "bạn không nộp bài", href: "/gv/bao-cao?trang_thai=khong_nop", c: "text-do-600" },
    { I: PhoneCall, n: tomTat.canNhac.size, t: "bạn cần nhắc phụ huynh", href: "/gv/bao-cao", c: "text-xanh-600" },
    { I: Hand, n: tomTat.chuaLamDuoc, t: "em báo chưa làm được", href: "/gv/bai-tap/hang-doi?tab=can-ho-tro", c: "text-tim-500" },
  ];

  return (
    <PageGrid
      main={<>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="h-page">Tổng quan các lớp</h1>
          <ButtonLink href="/gv/bai-tap/hang-doi">Hàng đợi chấm bài <ArrowRight className="h-4 w-4" /></ButtonLink>
        </div>
        <Card className="!py-4">
          <p className="mb-3 font-extrabold">Tóm tắt hôm nay</p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {CHIP.map(({ I, n, t, href, c }) => (
              <Link key={t} href={href} className="flex items-center gap-3 rounded-2xl border border-vien bg-white px-3 py-3 hover:border-xanh-500">
                <I className={`h-6 w-6 shrink-0 ${c}`} /><span><b className={`text-xl ${c}`}>{n}</b> <span className="text-sm text-slate-700">{t}</span></span>
              </Link>
            ))}
          </div>
        </Card>

        {lops.length === 0 ? (
          <Card><EmptyState title="Chưa có lớp nào" hint="Tạo lớp đầu tiên để bắt đầu." action={<ButtonLink href="/gv/lop">+ Thêm lớp</ButtonLink>} /></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {lops.map((l, i) => {
              const t = theThe[l.id] ?? { chuaNop: 0, choCham: 0 };
              const d = dangOBuoi(lich[i] ?? []);
              return (
                <Link key={l.id} href={`/gv/lop/${l.id}`} className="card card-pad flex flex-col gap-4 transition-transform hover:-translate-y-0.5">
                  <div className="flex items-center gap-4">
                    <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-xanh-50"><Users className="h-10 w-10 text-xanh-600" /></span>
                    <div>
                      <p className="text-3xl font-extrabold">Lớp {l.ten_lop}</p>
                      <p className="text-xl text-slate-600">{siSo.get(l.id) ?? 0} HS</p>
                      <p className="text-sm text-slate-500">Đang ở buổi {d.dangO}/{d.tong}</p>
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <div className="flex flex-col items-start gap-2">
                      <Pill mau={t.chuaNop ? "red" : "green"} className="!px-4 !py-1.5 !text-base">{t.chuaNop} chưa nộp</Pill>
                      <Pill mau={t.choCham ? "orange" : "green"} className="!px-4 !py-1.5 !text-base">{t.choCham} bài chờ chấm</Pill>
                    </div>
                    <span className="rounded-full bg-xanh-500 p-2.5 text-white"><ArrowRight className="h-5 w-5" /></span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </>}
      aside={<>
        <Card>
          <CardTitle icon={<Trophy className="h-6 w-6 text-vang-400" />}>Thống kê nhanh</CardTitle>
          <dl className="divide-y divide-vien text-[1.05rem]">
            <div className="flex justify-between py-2.5"><dt>Tổng số lớp:</dt><dd className="font-extrabold">{lops.length} lớp</dd></div>
            <div className="flex justify-between py-2.5"><dt>Tổng số học sinh:</dt><dd className="font-extrabold">{hs?.length ?? 0} HS</dd></div>
            <div className="flex justify-between py-2.5"><dt>Đang chờ chấm:</dt><dd className="font-extrabold text-cam-500">{tomTat.choCham} bài</dd></div>
          </dl>
        </Card>
        {tomTat.canhBaoSom.length > 0 && (
          <Card className="!border-do-600/30">
            <CardTitle icon={<AlertTriangle className="h-6 w-6 text-do-600" />}>Cảnh báo sớm</CardTitle>
            <p className="mb-2 text-sm text-slate-600">Bỏ 2 bài liên tiếp:</p>
            <ul className="space-y-1 text-sm">{tomTat.canhBaoSom.slice(0, 8).map((x) => <li key={x.ma_hs}>• {x.ho_ten} ({x.ma_hs}) – Lớp {x.lop}</li>)}</ul>
          </Card>
        )}
        <Card>
          <CardTitle icon={<CalendarDays className="h-6 w-6 text-cam-500" />}>Hoạt động gần đây</CardTitle>
          {!moiNop?.length ? <p className="text-sm text-slate-500">Chưa có bài nộp.</p> : (
            <ul className="divide-y divide-vien">
              {(moiNop as unknown as { id: string; nop_luc_moi_nhat: string | null; profiles: { ho_ten: string; class_id: string } | null; assignments: { ma: string; tieu_de: string } | null }[]).map((s) => (
                <li key={s.id} className="py-2.5 text-[0.95rem]">
                  <b>{s.profiles?.ho_ten} (Lớp {tenLop.get(s.profiles?.class_id ?? "") ?? "?"})</b> vừa nộp {s.assignments ? tenBaiTap(s.assignments.ma, s.assignments.tieu_de) : "bài"}
                  <span className="block text-xs text-slate-400">{fmtAgo(s.nop_luc_moi_nhat)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <BrandCard />
      </>}
    />
  );
}
