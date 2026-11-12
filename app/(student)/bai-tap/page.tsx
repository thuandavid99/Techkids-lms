import { ClipboardList, UserCheck, ClipboardPen, BadgeCheck } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { duLieuHs } from "@/lib/server/hs";
import { IMG } from "@/lib/brand";
import { Card, PageGrid, RobotCard } from "@/components/ui/Card";
import { PillTabs } from "@/components/ui/Misc";
import { NhanBai, Pill } from "@/components/ui/Pill";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { FlagToggle } from "@/components/student/FlagToggle";
import { tinhTrangThai } from "@/lib/domain/status";
import { diemTrungBinh, phanTramHoanThanh } from "@/lib/domain/stats";
import { tenBaiTap } from "@/lib/domain/naming";
import { fmtDate } from "@/lib/domain/time";

export const metadata = { title: "Danh sách bài tập" };

// Một hàng lọc duy nhất (trước đây có 2 hàng: trạng thái + hạn)
const TABS = [
  { key: "tat-ca", label: "Tất cả" }, { key: "can-lam", label: "Cần làm" },
  { key: "sap-han", label: "Sắp hết hạn" }, { key: "qua-han", label: "Quá hạn" },
  { key: "da-nop", label: "Đã nộp" }, { key: "da-cham", label: "Đã chấm" },
];

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string; han?: string }> }) {
  const sp = await searchParams;
  // Link cũ dạng ?han=7ngay / ?han=qua-han vẫn chạy
  const tab = sp.han === "7ngay" ? "sap-han" : sp.han === "qua-han" ? "qua-han" : sp.tab ?? "tat-ca";
  const p = await requireStudent();
  const { dong, cd } = await duLieuHs(p);
  const now = new Date();
  const ds = dong.map((r) => ({ r, k: tinhTrangThai(r, now) }));
  const loc = ds.filter(({ r, k }) => {
    if (tab === "can-lam" && !(r.loai_nop !== "ngoai_he_thong" && !r.mien_nop && (!k.daNop || k.trangThai === "can_nop_lai"))) return false;
    if (tab === "da-nop" && !(k.daNop && k.trangThai !== "da_cham")) return false;
    if (tab === "da-cham" && k.trangThai !== "da_cham") return false;
    if (tab === "sap-han" && !(!k.daNop && !r.mien_nop && k.hanHieuLuc && k.hanHieuLuc.getTime() - now.getTime() < 7 * 864e5 && k.hanHieuLuc > now)) return false;
    if (tab === "qua-han" && !k.quaHanChuaNop) return false;
    return true;
  }).sort((a, b) => (tab === "can-lam" || tab === "sap-han" ? (a.k.hanHieuLuc?.getTime() ?? Infinity) - (b.k.hanHieuLuc?.getTime() ?? Infinity) : 0));
  const pt = phanTramHoanThanh(dong, now);
  const canLam = ds.filter(({ r, k }) => r.loai_nop !== "ngoai_he_thong" && k.tinhVaoHoanThanh && (!k.daNop || k.trangThai === "can_nop_lai")).length;
  const tb = diemTrungBinh(dong, { soChuSo: Number(cd.lam_tron_diem ?? 1) });

  return (
    <PageGrid
      main={
        <Card>
          <h1 className="h-page mb-4">Danh sách bài tập</h1>
          <div className="mb-4">
            <PillTabs active={tab} tabs={TABS.map((t) => ({ ...t, href: `/bai-tap?tab=${t.key}` }))} />
          </div>
          {loc.length === 0 ? <EmptyState title="Không có bài tập nào ở mục này" /> : (
            <div className="space-y-3">
              {loc.map(({ r, k }) => {
                const lam = r.loai_nop !== "ngoai_he_thong" && k.trangThai !== "da_cham" && k.trangThai !== "mien_nop";
                return (
                  <div key={r.assignment_id} className="rounded-2xl border border-vien bg-white p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="hidden rounded-xl bg-xanh-50 p-3 text-navy-800 sm:inline-flex"><ClipboardList className="h-7 w-7" /></span>
                      <div className="hang-chu">
                        <p className="text-lg font-bold">{tenBaiTap(r.ma, r.tieu_de)} {!r.bat_buoc && <span className="text-sm font-medium text-slate-500">(tùy chọn)</span>}</p>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                          <span>Hạn nộp: {k.hanHieuLuc ? fmtDate(k.hanHieuLuc) : "—"}</span>
                          {k.denHanHomNay ? <Pill mau="orange">Đến hạn hôm nay</Pill> : <NhanBai kq={k} diem={r.diem} diemToiDa={r.diem_toi_da} gon />}
                        </div>
                      </div>
                      {r.loai_nop === "ngoai_he_thong" ? <span className="text-sm text-slate-500">Nộp ngoài hệ thống</span>
                        : lam ? <ButtonLink href={`/bai-tap/${r.assignment_id}/lam-bai`} variant={k.daNop ? "outline" : "primary"}>{k.daNop ? "Nộp lại →" : "Làm bài ngay →"}</ButtonLink>
                        : <ButtonLink href={`/bai-tap/${r.assignment_id}/da-nop`} variant="outline">Xem lại →</ButtonLink>}
                    </div>
                    {lam && <div className="mt-2"><FlagToggle compact assignmentId={r.assignment_id} checked={r.chua_lam_duoc} note={r.ghi_chu_co} /></div>}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      }
      aside={<>
        <Card>
          <h2 className="h-card mb-3">Thống kê bài tập</h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-3"><span className="rounded-xl bg-xanh-50 p-2"><UserCheck className="h-5 w-5 text-navy-800" /></span> Bài tập đã nộp: <b>{pt.daNop}/{pt.tong}</b></li>
            <li className="flex items-center gap-3"><span className="rounded-xl bg-xanh-50 p-2"><ClipboardPen className="h-5 w-5 text-navy-800" /></span> Cần làm: <b>{canLam}</b> bài</li>
            <li className="flex items-center gap-3"><span className="rounded-xl bg-xanh-50 p-2"><BadgeCheck className="h-5 w-5 text-navy-800" /></span> Điểm TB: {tb === null ? "—" : tb.toFixed(1)}</li>
          </ul>
        </Card>
        <RobotCard img={IMG.cheer} text="Hoàn thành bài tập đúng hạn để nhận huy hiệu nhé!" />
      </>}
    />
  );
}
