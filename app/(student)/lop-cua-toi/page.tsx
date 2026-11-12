import Image from "next/image";
import { requireStudent } from "@/lib/auth";
import { duLieuHs } from "@/lib/server/hs";
import { IMG } from "@/lib/brand";
import { Card, PageGrid, PageHeader, BrandCard } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/States";
import { TEN_THU } from "@/lib/domain/time";
import { soTrongNhan } from "@/lib/domain/naming";

export const metadata = { title: "Lớp học của tôi" };

/** Thông tin lớp + danh sách bạn cùng lớp (CHỈ họ tên, không điểm/bài nộp) */
export default async function Page() {
  const p = await requireStudent();
  const { sb, lop, buoi, lichThu } = await duLieuHs(p);
  if (!lop) return <Card><EmptyState title="Em chưa được xếp lớp" /></Card>;
  const [{ data: ban }, { data: gv }, { count: tong }] = await Promise.all([
    sb.rpc("ds_ban_cung_lop"),
    sb.rpc("gv_cua_lop"),
    sb.from("class_lessons").select("lesson_id", { count: "exact", head: true }).eq("class_id", lop.id).is("deleted_at", null),
  ]);
  const daDay = buoi.filter((b) => b.da_day);
  const dangO = daDay.length ? soTrongNhan(daDay[daDay.length - 1].nhan_buoi).at(-1) ?? daDay.length : 0;
  const tongBuoi = tong ?? buoi.length;
  return (
    <PageGrid
      main={<>
        <Card>
          <PageHeader back={{ href: "/", label: "Quay lại" }} title={`Lớp ${lop.ten_lop}`} sub={`Năm học ${lop.nam_hoc}`} />
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <ul className="space-y-2 text-[1.05rem]">
              <li>Sĩ số: <b>{(ban as unknown[])?.length ?? 0} học sinh</b></li>
              <li>Giáo viên: <b>{((gv as { ho_ten: string }[]) ?? []).map((g) => g.ho_ten).join(", ") || "—"}</b></li>
              <li>Lịch học: <b>{lichThu.length ? lichThu.map((t) => TEN_THU[t]).join(", ") : "—"}</b></li>
              <li>Tiến độ lớp: <b>đang ở buổi {dangO}/{tongBuoi}</b></li>
            </ul>
            <div className="flex items-center gap-4">
              <ProgressRing value={tongBuoi ? Math.round((daDay.length / tongBuoi) * 100) : 0} size={110} />
              <Image src={IMG.school} alt="" width={120} height={90} unoptimized className="hidden h-auto w-28 sm:block" />
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="h-card mb-3">Bạn cùng lớp</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {((ban as { ho_ten: string }[]) ?? []).map((b, i) => <li key={i} className="rounded-xl bg-xanh-50 px-3 py-2">{b.ho_ten}</li>)}
          </ul>
        </Card>
      </>}
      aside={<BrandCard />}
    />
  );
}
