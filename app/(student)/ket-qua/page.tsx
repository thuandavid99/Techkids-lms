import { Star, CircleCheckBig, BookOpenText, Trophy, Award, Printer } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { duLieuHs } from "@/lib/server/hs";
import { IMG } from "@/lib/brand";
import { Card, PageGrid, RobotCard } from "@/components/ui/Card";
import { Stat, PillTabs } from "@/components/ui/Misc";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { diemTrungBinh, soLieuHs, tinhHuyHieu } from "@/lib/domain/stats";
import { tenBaiTap } from "@/lib/domain/naming";

export const metadata = { title: "Kết quả học tập" };

export default async function Page({ searchParams }: { searchParams: Promise<{ module?: string }> }) {
  const { module: locModule = "" } = await searchParams;
  const p = await requireStudent();
  const { dong, buoi, modules, cd } = await duLieuHs(p);
  const now = new Date();
  const soLe = Number(cd.lam_tron_diem ?? 1);
  const tb = diemTrungBinh(dong, { soChuSo: soLe });
  const so = soLieuHs(buoi, dong, now);
  const hh = tinhHuyHieu(dong, now);

  // Biểu đồ: điểm TB theo module
  const cot = modules.map((m) => ({ ten: m.ten.replace(/:.*/, ""), v: diemTrungBinh(dong.filter((r) => r.module_id === m.id), { soChuSo: soLe }) })).filter((c) => c.v !== null) as { ten: string; v: number }[];
  const daCham = dong.filter((r) => (r.trang_thai === "da_cham" || r.trang_thai === "nop_ngoai_he_thong") && r.diem !== null && (!locModule || r.module_id === locModule));

  return (
    <PageGrid
      main={
        <Card>
          <h1 className="h-page mb-4">Kết quả học tập</h1>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            <Stat icon={<Star className="h-6 w-6 fill-navy-800" />} label="Điểm trung bình" value={tb === null ? "—" : tb.toFixed(soLe)} />
            <Stat icon={<BookOpenText className="h-6 w-6" />} label="Buổi học" value={`${so.buoi.xong}/${so.buoi.tong}`} />
            <Stat icon={<CircleCheckBig className="h-6 w-6" />} label="Bài tập đã nộp" value={`${so.bai.xong}/${so.bai.tong}`} />
            <Stat icon={<Trophy className="h-6 w-6" />} label="Huy hiệu" value={hh.length} />
          </div>

          <h2 className="mt-6 text-xl font-extrabold">Tiến độ điểm số</h2>
          {cot.length === 0 ? <p className="mt-2 text-slate-500">Chưa có bài nào được chấm.</p> : (
            <div className="mt-4 flex h-56 items-end gap-4 border-b border-vien px-2" role="img" aria-label="Biểu đồ điểm trung bình theo module">
              {cot.map((c) => (
                <div key={c.ten} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-sm font-semibold">{c.v.toFixed(1)}</span>
                  <div className="w-full max-w-[120px] rounded-t-lg bg-xanh-600" style={{ height: `${Math.max(6, c.v * 17)}px` }} />
                </div>
              ))}
            </div>
          )}
          <div className="mt-1 flex gap-4 px-2">{cot.map((c) => <span key={c.ten} className="flex-1 text-center text-sm">{c.ten}</span>)}</div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold">Nhận xét từ giáo viên</h2>
            {modules.length > 1 && <PillTabs active={locModule || "all"} tabs={[{ key: "all", label: "Tất cả", href: "/ket-qua" }, ...modules.map((m) => ({ key: m.id, label: m.ten.replace(/:.*/, ""), href: `/ket-qua?module=${m.id}` }))]} />}
          </div>
          {daCham.length === 0 ? <EmptyState title="Chưa có nhận xét" hint="Khi thầy chấm bài, điểm và nhận xét sẽ hiện ở đây." /> : (
            <div className="table-wrap mt-3 rounded-2xl border border-vien bg-white">
              <table className="tbl">
                <tbody>
                  {daCham.map((r) => (
                    <tr key={r.assignment_id}>
                      <td className="min-w-[180px]">{tenBaiTap(r.ma, r.tieu_de)}</td>
                      <td className="whitespace-nowrap">Điểm: <b className="text-la-600">{Number(r.diem).toFixed(1)}</b> / {r.diem_toi_da}{Number(r.he_so) !== 1 && <span className="text-xs text-slate-500"> (hệ số {r.he_so})</span>}</td>
                      <td className="min-w-[200px]">{r.nhan_xet ? <>⭐ {r.nhan_xet}</> : <span className="text-slate-400">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {cd.hs_tai_phieu_tien_do === true && <ButtonLink href={`/phieu/${p.id}`} variant="outline" className="mt-5"><Printer className="h-4 w-4" /> Tải phiếu tiến độ (PDF)</ButtonLink>}
        </Card>
      }
      aside={<>
        <Card>
          <h2 className="h-card mb-3 flex items-center gap-2"><Trophy className="h-6 w-6 text-vang-400" /> Bộ sưu tập huy hiệu</h2>
          {hh.length === 0 ? <p className="text-slate-600">Chưa có huy hiệu. Nộp đúng hạn 5 bài liên tiếp để nhận huy hiệu đầu tiên nhé!</p> : (
            <ul className="space-y-3">
              {hh.map((h) => (
                <li key={h.ma} className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-vang-400 to-cam-500 shadow"><Award className="h-6 w-6 text-white" /></span>
                  <div><p className="font-bold">{h.ten}</p><p className="text-xs text-slate-500">{h.moTa}</p></div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <RobotCard img={IMG.trophy} title="Tiếp tục phát huy nhé!" />
      </>}
    />
  );
}
