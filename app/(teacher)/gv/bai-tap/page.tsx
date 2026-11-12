import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { lopDangChon } from "@/lib/server/lop";
import { SubNavLop } from "@/components/teacher/SubNavLop";
import { duLieuLop } from "@/lib/server/gv";
import { baiTapLop } from "@/lib/server/data";
import { Card, PageHeader } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { ButtonLink, btnClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { tinhTrangThai } from "@/lib/domain/status";
import { tenBaiTap, tenBuoi } from "@/lib/domain/naming";
import { fmtDateTime } from "@/lib/domain/time";

export const metadata = { title: "Tất cả bài tập" };
const LOAI: Record<string, string> = { code: "Code", file: "File", ca_hai: "Code + file", ngoai_he_thong: "Ngoài hệ thống" };

export default async function Page({ searchParams }: { searchParams: Promise<{ lop?: string; buoi?: string; han?: string; bb?: string }> }) {
  const sp = await searchParams;
  const sb = await createClient();
  const { lop } = await lopDangChon(sb, sp.lop);
  if (!lop) return <Card><EmptyState title="Chưa có lớp" action={<ButtonLink href="/gv/lop">Tạo lớp</ButtonLink>} /></Card>;
  const [bts, { rows, buoi, hs }] = await Promise.all([baiTapLop(sb, lop.id), duLieuLop(sb, lop.id)]);
  const now = new Date();
  const tenB = new Map(buoi.map((b) => [b.lesson_id, tenBuoi(b.nhan_buoi, b.tieu_de)]));
  const thuTu = new Map(buoi.map((b, i) => [b.lesson_id, i]));
  const siSo = hs.filter((h) => h.dang_hoc).length;
  const ds = bts
    .filter((b) => (!sp.buoi || b.lesson_id === sp.buoi) && (!sp.bb || (sp.bb === "bat_buoc") === b.bat_buoc))
    .filter((b) => {
      if (!sp.han) return true;
      const h = b.han_nop ? new Date(b.han_nop) : null;
      if (sp.han === "chua_dat") return !h;
      if (sp.han === "sap_toi") return !!h && h > now && h.getTime() - now.getTime() < 7 * 864e5;
      if (sp.han === "da_qua") return !!h && h < now;
      return true;
    })
    .sort((a, b) => (thuTu.get(a.lesson_id) ?? 0) - (thuTu.get(b.lesson_id) ?? 0) || a.ma.localeCompare(b.ma, "vi", { numeric: true }));

  return (
    <>
    <SubNavLop id={lop.id} />
    <Card>
      <PageHeader title={`Tất cả bài tập – Lớp ${lop.ten_lop}`} actions={<ButtonLink href="/gv/chuong-trinh" variant="secondary">+ Thêm bài tập (trong buổi học)</ButtonLink>} />
      <form className="mb-4 flex flex-wrap gap-2" action="/gv/bai-tap">
        <input type="hidden" name="lop" value={lop.id} />
        <select name="buoi" defaultValue={sp.buoi ?? ""} className="input !w-auto max-w-[280px] !rounded-2xl" aria-label="Buổi"><option value="">Mọi buổi</option>{buoi.map((b) => <option key={b.lesson_id} value={b.lesson_id}>{tenB.get(b.lesson_id)}</option>)}</select>
        <select name="han" defaultValue={sp.han ?? ""} className="input !w-auto !rounded-2xl" aria-label="Hạn nộp"><option value="">Mọi hạn</option><option value="sap_toi">Hạn trong 7 ngày</option><option value="da_qua">Đã qua hạn</option><option value="chua_dat">Chưa đặt hạn</option></select>
        <select name="bb" defaultValue={sp.bb ?? ""} className="input !w-auto !rounded-2xl" aria-label="Loại"><option value="">Bắt buộc + tùy chọn</option><option value="bat_buoc">Chỉ bắt buộc</option><option value="tuy_chon">Chỉ tùy chọn</option></select>
        <button className={btnClass("outline", "md")}>Lọc</button>
      </form>
      {ds.length === 0 ? <EmptyState title="Không có bài tập phù hợp" /> : (
        <div className="table-wrap rounded-2xl border border-vien bg-white">
          <table className="tbl min-w-[900px]">
            <thead><tr><th>Bài tập</th><th>Buổi</th><th>Loại nộp</th><th>Hạn nộp</th><th>Đã nộp</th><th>Chờ chấm</th><th></th></tr></thead>
            <tbody>
              {ds.map((b) => {
                const r = rows.filter((x) => x.assignment_id === b.assignment_id);
                const daNop = r.filter((x) => tinhTrangThai(x, now).daNop).length;
                const cho = r.filter((x) => x.trang_thai === "da_nop").length;
                return (
                  <tr key={b.assignment_id}>
                    <td className="font-semibold">{tenBaiTap(b.ma, b.tieu_de)} {!b.bat_buoc && <Pill>tùy chọn</Pill>} {!b.hien_thi && <Pill mau="gray">ẩn</Pill>} {b.override_id && <Pill mau="purple">bản riêng lớp</Pill>}</td>
                    <td className="text-sm">{tenB.get(b.lesson_id)}</td>
                    <td className="text-sm">{LOAI[b.loai_nop]}</td>
                    <td className="text-sm">{b.han_nop ? fmtDateTime(b.han_nop) : <span className="text-cam-600">Chưa đặt</span>}</td>
                    <td>{daNop}/{siSo}</td>
                    <td>{cho > 0 ? <Link href={`/gv/bai-tap/hang-doi?lop=${lop.id}&bai=${b.assignment_id}`} className="link">{cho} bài</Link> : 0}</td>
                    <td><ButtonLink href={`/gv/bai-tap/sua/${b.assignment_id}`} variant="outline" size="sm">Sửa</ButtonLink></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
    </>
  );
}
