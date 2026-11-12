import Link from "next/link";
import { Users, ArrowRight, Trophy, CalendarDays, Hourglass, UserX, PhoneCall, Hand, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cacLop, buoiLop } from "@/lib/server/data";
import { tongQuan } from "@/lib/server/gv";
import { Card, PageGrid, CardTitle } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { tenBaiTap, tenBuoi } from "@/lib/domain/naming";
import { fmtAgo } from "@/lib/domain/time";
import { tienDoLop } from "@/lib/domain/mo-buoi";
import { MoBuoiLop, type LopMoBuoi } from "@/components/teacher/MoBuoiHomNay";

export const metadata = { title: "Tổng quan các lớp" };

export default async function Page() {
  const sb = await createClient();
  const lops = await cacLop(sb);
  // Bỏ chế độ cũ "tự mở theo lịch": tiến độ giờ theo nút "Xong buổi này" (ngày học chỉ để tham khảo)
  await Promise.all(lops.filter((l) => l.che_do_mo === "theo_lich").map((l) => sb.rpc("gv_dat_che_do_mo", { p_class: l.id, p_che_do: "thu_cong" })));
  const [{ tomTat, theThe }, { data: hs }, { data: moiNop }, ...lich] = await Promise.all([
    tongQuan(sb, lops),
    sb.from("profiles").select("id, class_id").eq("vai_tro", "hoc_sinh").is("deleted_at", null).eq("dang_hoc", true),
    sb.from("submissions").select("id, nop_luc_moi_nhat, trang_thai, profiles(ho_ten, class_id), assignments(ma, tieu_de)").order("nop_luc_moi_nhat", { ascending: false, nullsFirst: false }).limit(5),
    ...lops.map((l) => buoiLop(sb, l.id)),
  ]);
  const siSo = new Map<string, number>();
  for (const h of (hs as { class_id: string | null }[]) ?? []) if (h.class_id) siSo.set(h.class_id, (siSo.get(h.class_id) ?? 0) + 1);
  const tenLop = new Map(lops.map((l) => [l.id, l.ten_lop]));
  const gat = (b: { lesson_id: string; nhan_buoi: string; tieu_de: string; da_mo: boolean } | null) =>
    b ? { lesson_id: b.lesson_id, ten: tenBuoi(b.nhan_buoi, b.tieu_de), mo: b.da_mo } : null;
  const moBuoi: LopMoBuoi[] = lops.map((l, i) => {
    const ds = lich[i] ?? [];
    const c = tienDoLop(ds);
    return {
      id: l.id, ten_lop: l.ten_lop,
      dangHoc: gat(c.dangHoc), tiepTheo: gat(c.tiepTheo), coBuoiTruoc: !!c.buoiTruoc,
      viTri: c.viTri, soDaHoc: c.soDaHoc, soDaMo: c.soDaMo, tong: c.tong, chuaBatDau: c.chuaBatDau,
      dsBuoi: ds.filter((b) => !b.ban_nhap).map((b) => ({ lesson_id: b.lesson_id, ten: tenBuoi(b.nhan_buoi, b.tieu_de) })),
    };
  });

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
              return (
                <div key={l.id} className="card card-pad flex flex-col gap-3">
                  {/* Bấm vào phần đầu thẻ → vào trang lớp (ma trận tiến độ) */}
                  <Link href={`/gv/lop/${l.id}`} className="group flex items-center gap-3">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-xanh-50"><Users className="h-7 w-7 text-xanh-600" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-2xl font-extrabold leading-tight group-hover:text-xanh-700">Lớp {l.ten_lop}</p>
                      <p className="text-sm text-slate-600">{siSo.get(l.id) ?? 0} học sinh</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-xanh-500 p-2 text-white transition-transform group-hover:translate-x-0.5"><ArrowRight className="h-5 w-5" /></span>
                  </Link>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/gv/bao-cao?lop=${l.id}`}><Pill mau={t.chuaNop ? "red" : "green"} className="!px-3 !py-1 !text-sm">{t.chuaNop} chưa nộp</Pill></Link>
                    <Link href={`/gv/bai-tap/hang-doi?lop=${l.id}`}><Pill mau={t.choCham ? "orange" : "green"} className="!px-3 !py-1 !text-sm">{t.choCham} bài chờ chấm</Pill></Link>
                  </div>
                  <MoBuoiLop l={moBuoi[i]} />
                </div>
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
      </>}
    />
  );
}
