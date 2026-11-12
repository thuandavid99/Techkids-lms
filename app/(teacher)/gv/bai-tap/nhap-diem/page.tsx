import { SubNav } from "@/components/teacher/SubNav";
import { createClient } from "@/lib/supabase/server";
import { cacLop, layHet } from "@/lib/server/data";
import { Card, PageHeader } from "@/components/ui/Card";
import { NhapDiem } from "@/components/teacher/NhapDiem";
import { tenBaiTap } from "@/lib/domain/naming";
import type { BaiTapHieuLuc } from "@/lib/types";

export const metadata = { title: "Nhập điểm từ Excel" };

export default async function Page() {
  const sb = await createClient();
  const [lops, { data: hs }, bts] = await Promise.all([
    cacLop(sb),
    sb.from("profiles").select("id, ma_hs, ho_ten, class_id").eq("vai_tro", "hoc_sinh").is("deleted_at", null),
    layHet<BaiTapHieuLuc>((a, b) => sb.from("v_bai_tap_hieu_luc").select("*").range(a, b)),
  ]);
  return (
    <>
    <SubNav items={[{ href: "/gv/bai-tap/hang-doi", label: "Hàng đợi chấm & Cần hỗ trợ" }, { href: "/gv/bai-tap/nhap-diem", label: "Nhập điểm từ Excel" }]} />
    <Card>
      <PageHeader title="Nhập điểm từ Excel" sub="Dùng cho Contest / bài kiểm tra làm ngoài hệ thống. File cần có cột Mã học sinh và cột Điểm." />
      <NhapDiem lops={lops} hs={(hs ?? []).filter((h) => h.class_id) as { id: string; ma_hs: string; ho_ten: string; class_id: string }[]}
        bts={bts.map((b) => ({ id: b.assignment_id, ten: tenBaiTap(b.ma, b.tieu_de), class_id: b.class_id, diem_toi_da: Number(b.diem_toi_da), ngoai: b.loai_nop === "ngoai_he_thong" }))} />
    </Card>
    </>
  );
}
