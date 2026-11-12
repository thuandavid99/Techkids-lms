import { requireStudent } from "@/lib/auth";
import { duLieuHs } from "@/lib/server/hs";
import { topicsCua } from "@/lib/server/data";
import { Card, PageGrid } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { HanhTrinhCard, SapDenHanCard } from "@/components/student/Cards";
import { BuoiHocList, type ModuleItem } from "@/components/student/BuoiHocList";
import { BuoiSapMo, type BuoiKhoa } from "@/components/student/BuoiSapMo";
import { soLieuHs } from "@/lib/domain/stats";
import { trangThaiBuoi, baiCanLamGanNhat } from "@/lib/domain/lesson-status";
import { tinhTrangThai } from "@/lib/domain/status";
import { tenBuoi } from "@/lib/domain/naming";
import { fmtDate } from "@/lib/domain/time";

export const metadata = { title: "Danh sách buổi học" };

export default async function Page() {
  const p = await requireStudent();
  const { sb, buoi, dong, loai, modules } = await duLieuHs(p);
  const now = new Date();
  const [tps, { data: sapMo }] = await Promise.all([topicsCua(sb, modules.map((m) => m.id)), sb.rpc("hs_buoi_sap_mo", { p_so: 2 })]);
  const topics = new Map<string, string>(tps.map((t: { id: string; ten: string }) => [t.id, t.ten] as [string, string]));

  const nhom: ModuleItem[] = [...modules.map((m) => ({ id: m.id, ten: m.ten, buoi: [] as ModuleItem["buoi"] })), { id: "khac", ten: "Buổi học khác", buoi: [] }];
  for (const b of buoi) {
    const l = b.loai_id ? loai.get(b.loai_id) : undefined;
    const item = {
      id: b.lesson_id, ten: tenBuoi(b.nhan_buoi, b.tieu_de), ngay: fmtDate(b.ngay_hoc),
      loaiTen: l?.ten ?? "", loaiMau: l?.mau ?? "blue", icon: l?.icon ?? "book-open", noiBat: !!l?.noi_bat,
      chuDe: b.topic_id ? topics.get(b.topic_id) ?? null : null,
      tt: trangThaiBuoi(b, dong.filter((r) => r.lesson_id === b.lesson_id), now),
    };
    (nhom.find((m) => m.id === b.module_id) ?? nhom[nhom.length - 1]).buoi.push(item);
  }
  const canLam = baiCanLamGanNhat(dong, now);

  return (
    <PageGrid
      main={<>
        <h1 className="h-page">Danh sách buổi học</h1>
        {buoi.length === 0
          ? <Card><EmptyState title="Chưa có buổi học nào" hint="Thầy sẽ mở buổi học khi đến ngày học. Em quay lại sau nhé!" /></Card>
          : <BuoiHocList modules={nhom.filter((m) => m.buoi.length > 0)} />}
        <BuoiSapMo ds={(sapMo as BuoiKhoa[] | null) ?? []} />
      </>}
      aside={<>
        <HanhTrinhCard {...soLieuHs(buoi, dong, now)} />
        <SapDenHanCard bai={canLam ? { assignment_id: canLam.assignment_id, ma: canLam.ma, tieu_de: canLam.tieu_de, han: tinhTrangThai(canLam, now).hanHieuLuc?.toISOString() ?? null } : null} />
      </>}
    />
  );
}
