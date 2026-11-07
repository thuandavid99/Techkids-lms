import { createClient } from "@/lib/supabase/server";
import { buoiLop, cacLoaiBuoi } from "@/lib/server/data";
import { Card, PageHeader } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { LichLop } from "@/components/teacher/LichLop";
import { tenBuoi } from "@/lib/domain/naming";
import { toVNInput } from "@/lib/domain/time";

export const metadata = { title: "Lịch học của lớp" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const [buoi, loai, { data: lop }] = await Promise.all([buoiLop(sb, id), cacLoaiBuoi(sb), sb.from("classes").select("ten_lop").eq("id", id).single()]);
  const nb = new Set(loai.filter((l) => l.noi_bat).map((l) => l.id));
  return (
    <Card>
      <PageHeader title={`Lịch học & buổi – Lớp ${lop?.ten_lop}`} sub="Sửa trực tiếp trong bảng; thay đổi tự lưu khi bạn rời ô." actions={<ButtonLink href={`/gv/chuong-trinh/ap-dung?lop=${id}`} variant="secondary">Áp dụng / tính lại lịch</ButtonLink>} />
      {buoi.length === 0 ? <EmptyState title="Lớp chưa áp dụng chương trình" action={<ButtonLink href={`/gv/chuong-trinh/ap-dung?lop=${id}`}>Áp dụng chương trình</ButtonLink>} /> : (
        <LichLop classId={id} ds={buoi.map((b) => ({
          lesson_id: b.lesson_id, ten: tenBuoi(b.nhan_buoi, b.tieu_de), ngay_hoc: b.ngay_hoc ?? "", hien_thi: b.hien_thi,
          ngay_mo: toVNInput(b.ngay_mo), da_day: b.da_day, ghi_chu: b.ghi_chu ?? "", noiBat: !!b.loai_id && nb.has(b.loai_id), banNhap: b.ban_nhap,
        }))} />
      )}
    </Card>
  );
}
