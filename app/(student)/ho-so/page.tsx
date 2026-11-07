import { Award } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { duLieuHs } from "@/lib/server/hs";
import { Card, PageGrid, PageHeader, BrandCard } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Misc";
import { AvatarPicker } from "@/components/student/AvatarPicker";
import { diemTrungBinh, phanTramHoanThanh, tinhHuyHieu } from "@/lib/domain/stats";

export const metadata = { title: "Hồ sơ cá nhân" };

export default async function Page() {
  const p = await requireStudent();
  const { lop, dong } = await duLieuHs(p);
  const hh = tinhHuyHieu(dong);
  const tb = diemTrungBinh(dong);
  return (
    <PageGrid
      main={
        <Card>
          <PageHeader title="Hồ sơ cá nhân" />
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <AvatarPicker name={p.ho_ten} avatar={p.avatar} />
            <div className="space-y-3">
              <p className="text-2xl font-extrabold">{p.ho_ten}</p>
              <p>Mã học sinh: <b>{p.ma_hs}</b></p>
              <p>Lớp: <b>{lop?.ten_lop ?? "—"}</b></p>
              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <Stat label="Điểm trung bình" value={tb === null ? "—" : tb.toFixed(1)} />
                <Stat label="Hoàn thành" value={`${phanTramHoanThanh(dong).phanTram}%`} tone="green" />
              </div>
            </div>
          </div>
          <h2 className="mt-8 text-xl font-extrabold">Huy hiệu</h2>
          {hh.length === 0 ? <p className="mt-2 text-slate-600">Chưa có huy hiệu.</p> : (
            <div className="mt-3 flex flex-wrap gap-3">
              {hh.map((h) => (
                <div key={h.ma} className="flex items-center gap-3 rounded-2xl border border-vien bg-white px-4 py-3">
                  <Award className="h-8 w-8 text-cam-500" /><div><p className="font-bold">{h.ten}</p><p className="text-xs text-slate-500">{h.moTa}</p></div>
                </div>
              ))}
            </div>
          )}
        </Card>
      }
      aside={<BrandCard />}
    />
  );
}
