import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { duLieuLop } from "@/lib/server/gv";
import { Card } from "@/components/ui/Card";
import { NhanBai } from "@/components/ui/Pill";
import { PillTabs } from "@/components/ui/Misc";
import { ButtonLink, btnClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { CellMenu } from "@/components/teacher/CellMenu";
import { tinhTrangThai } from "@/lib/domain/status";
import { tenBuoi, tenBaiTap } from "@/lib/domain/naming";
import { fmtShort, toVNInput, vnDateKey } from "@/lib/domain/time";

export const metadata = { title: "Tình hình nộp bài theo buổi" };

const LOC = [
  { key: "", label: "Tất cả" }, { key: "dung_han", label: "Đúng hạn" }, { key: "tre", label: "Trễ" },
  { key: "khong_nop_bai", label: "Không nộp bài" }, { key: "cho_cham", label: "Chờ chấm" }, { key: "co", label: "🙋 Chưa làm được" },
];

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ buoi?: string; loc?: string }> }) {
  const { id } = await params;
  const { buoi: buoiId, loc = "" } = await searchParams;
  const sb = await createClient();
  const { rows, buoi, hs } = await duLieuLop(sb, id);
  const now = new Date();
  const coBai = new Set(rows.map((r) => r.lesson_id));
  const buoiCoBai = buoi.filter((b) => coBai.has(b.lesson_id));
  // Mặc định: buổi đã dạy gần nhất, hoặc buổi có ngày học gần nhất trước hôm nay
  const homNay = vnDateKey(now);
  const macDinh = [...buoiCoBai].reverse().find((b) => b.da_day) ?? [...buoiCoBai].reverse().find((b) => b.ngay_hoc && b.ngay_hoc <= homNay) ?? buoiCoBai[0];
  const b = buoiCoBai.find((x) => x.lesson_id === buoiId) ?? macDinh;

  if (!b) return <Card><EmptyState title="Chưa có buổi nào có bài tập" hint="Thêm bài tập cho buổi học trong Chương trình học." /></Card>;

  const cot = [...new Map(rows.filter((r) => r.lesson_id === b.lesson_id).map((r) => [r.assignment_id, r])).values()];
  const theoO = new Map(rows.filter((r) => r.lesson_id === b.lesson_id).map((r) => [`${r.student_id}:${r.assignment_id}`, { r, k: tinhTrangThai(r, now) }]));
  const dem = { dung_han: 0, tre: 0, khong_nop_bai: 0, cho_cham: 0, co: 0 };
  for (const { k } of theoO.values()) {
    if (k.nhanThoiGian === "dung_han" && k.daNop) dem.dung_han++;
    if (k.nhanThoiGian === "tre") dem.tre++;
    if (k.nhanThoiGian === "khong_nop_bai") dem.khong_nop_bai++;
    if (k.trangThai === "da_nop") dem.cho_cham++;
    if (k.coChuaLamDuoc) dem.co++;
  }
  const khop = (sid: string) => !loc || cot.some((c) => {
    const x = theoO.get(`${sid}:${c.assignment_id}`); if (!x) return false;
    if (loc === "cho_cham") return x.k.trangThai === "da_nop";
    if (loc === "co") return x.k.coChuaLamDuoc;
    if (loc === "dung_han") return x.k.daNop && x.k.nhanThoiGian === "dung_han";
    return x.k.nhanThoiGian === loc;
  });
  const href = (x: Record<string, string>) => `/gv/lop/${id}/tinh-hinh?` + new URLSearchParams({ buoi: b.lesson_id, loc, ...x }).toString();

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="h-page">Tình hình nộp bài theo buổi</h1>
        <form action={`/gv/lop/${id}/tinh-hinh`} className="flex w-full min-w-0 gap-2 sm:w-auto">
          <select name="buoi" defaultValue={b.lesson_id} aria-label="Chọn buổi" className="input min-w-0 flex-1 !rounded-2xl sm:!w-auto sm:max-w-[320px] sm:flex-none">
            {buoiCoBai.map((x) => <option key={x.lesson_id} value={x.lesson_id}>{tenBuoi(x.nhan_buoi, x.tieu_de)}{x.da_day ? " ✓" : ""}</option>)}
          </select>
          <button className={btnClass("outline", "md")}>Xem</button>
        </form>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[["Đúng hạn", dem.dung_han, "text-la-600"], ["Trễ", dem.tre, "text-amber-600"], ["Không nộp bài", dem.khong_nop_bai, "text-do-600"], ["Chờ chấm", dem.cho_cham, "text-xanh-600"], ["Chưa làm được", dem.co, "text-tim-500"]].map(([t, n, c]) => (
          <div key={t as string} className="rounded-2xl border border-vien bg-white px-3 py-2 text-center"><p className={`text-2xl font-extrabold ${c}`}>{n as number}</p><p className="text-xs text-slate-600">{t as string}</p></div>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <PillTabs active={loc} tabs={LOC.map((l) => ({ ...l, href: href({ loc: l.key }) }))} />
        {dem.khong_nop_bai > 0 && <ButtonLink href={`/gv/bao-cao?lop=${id}&trang_thai=khong_nop`} variant="secondary" size="sm">Sang Nhắc phụ huynh <ArrowRight className="h-4 w-4" /></ButtonLink>}
      </div>

      {cot.length === 0 ? <EmptyState title="Buổi này không có bài tập" /> : (
        <div className="table-wrap rounded-2xl border border-vien bg-white">
          <table className="tbl min-w-[720px]">
            <thead><tr><th className="sticky left-0 bg-white">Học sinh</th>{cot.map((c) => <th key={c.assignment_id} title={c.tieu_de}>{tenBaiTap(c.ma, c.tieu_de)}{!c.bat_buoc && " (tùy chọn)"}</th>)}</tr></thead>
            <tbody>
              {hs.filter((h) => h.dang_hoc && khop(h.id)).map((h) => (
                <tr key={h.id}>
                  <td className="sticky left-0 bg-white"><Link href={`/gv/hoc-sinh/${h.id}`} className="font-medium hover:text-xanh-600">{h.ho_ten}</Link><span className="block text-xs text-slate-500">{h.ma_hs}</span></td>
                  {cot.map((c) => {
                    const x = theoO.get(`${h.id}:${c.assignment_id}`);
                    if (!x) return <td key={c.assignment_id} />;
                    const { r, k } = x;
                    return (
                      <td key={c.assignment_id} className={k.nhanThoiGian === "khong_nop_bai" ? "bg-do-50/60" : ""}>
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            {r.submission_id ? <Link href={`/gv/bai-tap/cham/${r.submission_id}`} className="hover:opacity-80"><NhanBai kq={k} diem={r.diem} diemToiDa={r.diem_toi_da} /></Link> : <NhanBai kq={k} />}
                            {r.nop_luc_dau && <p className="mt-1 text-xs text-slate-500">Nộp lần đầu: {fmtShort(r.nop_luc_dau)}{r.so_lan_nop && r.so_lan_nop > 1 ? ` · ${r.so_lan_nop} lần` : ""}</p>}
                            {k.coChuaLamDuoc && r.ghi_chu_co && <p className="mt-1 text-xs text-tim-500">“{r.ghi_chu_co}”</p>}
                          </div>
                          <CellMenu o={{ assignmentId: r.assignment_id, studentId: h.id, tenHs: h.ho_ten, tenBai: tenBaiTap(r.ma, r.tieu_de), mien: r.mien_nop, ngoai: r.trang_thai === "nop_ngoai_he_thong", daCham: r.trang_thai === "da_cham", coBai: !!r.submission_id, hanRieng: toVNInput(r.han_nop_rieng) }} />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
