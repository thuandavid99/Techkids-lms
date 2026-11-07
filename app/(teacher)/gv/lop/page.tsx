import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cacLop, buoiLop } from "@/lib/server/data";
import { dangOBuoi } from "@/lib/server/gv";
import { Card, PageHeader } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { ConfirmButton, ActionButton } from "@/components/ui/Modal";
import { Pill } from "@/components/ui/Pill";
import { EmptyState } from "@/components/ui/States";
import { LopForm } from "@/components/teacher/LopForm";
import { luuTruLop, xoaLop } from "@/lib/actions/gv/lop";

export const metadata = { title: "Quản lý lớp" };

export default async function Page({ searchParams }: { searchParams: Promise<{ luu_tru?: string }> }) {
  const { luu_tru } = await searchParams;
  const sb = await createClient();
  const lops = (await cacLop(sb, { kemLuuTru: true })).filter((l) => (luu_tru ? l.archived : !l.archived));
  const [{ data: hs }, { data: cc }, { data: cts }, { data: gvLop }] = await Promise.all([
    sb.from("profiles").select("class_id").eq("vai_tro", "hoc_sinh").is("deleted_at", null),
    sb.from("class_curriculum").select("class_id, curriculum_id"),
    sb.from("curricula").select("id, ten").is("deleted_at", null),
    sb.from("class_teachers").select("class_id, profiles(ho_ten)"),
  ]);
  const lich = await Promise.all(lops.map((l) => buoiLop(sb, l.id)));
  const siSo = new Map<string, number>();
  for (const h of hs ?? []) if (h.class_id) siSo.set(h.class_id, (siSo.get(h.class_id) ?? 0) + 1);
  const tenCt = new Map((cts ?? []).map((c) => [c.id, c.ten]));
  const ctLop = new Map((cc ?? []).map((c) => [c.class_id, tenCt.get(c.curriculum_id) ?? "—"]));
  const gv = new Map<string, string[]>();
  for (const g of (gvLop as unknown as { class_id: string; profiles: { ho_ten: string } | null }[]) ?? []) gv.set(g.class_id, [...(gv.get(g.class_id) ?? []), g.profiles?.ho_ten ?? ""]);

  return (
    <Card>
      <PageHeader title="Quản lý lớp" actions={<>
        <ButtonLink href={luu_tru ? "/gv/lop" : "/gv/lop?luu_tru=1"} variant="outlineGray" size="sm">{luu_tru ? "Lớp đang học" : "Lớp đã lưu trữ"}</ButtonLink>
        <ButtonLink href="/gv/chuong-trinh/ap-dung" variant="secondary">Áp dụng chương trình</ButtonLink>
        <LopForm />
      </>} />
      {lops.length === 0 ? <EmptyState title={luu_tru ? "Không có lớp lưu trữ" : "Chưa có lớp nào"} hint="Bấm “Thêm lớp” để tạo lớp đầu tiên." /> : (
        <div className="table-wrap">
          <table className="tbl min-w-[860px]">
            <thead><tr><th>Lớp</th><th>Năm học</th><th>Sĩ số</th><th>Chương trình</th><th>Tiến độ</th><th>Giáo viên</th><th className="text-right">Thao tác</th></tr></thead>
            <tbody>
              {lops.map((l, i) => {
                const d = dangOBuoi(lich[i]);
                return (
                  <tr key={l.id}>
                    <td><Link href={`/gv/lop/${l.id}`} className="text-lg font-extrabold hover:text-xanh-600">Lớp {l.ten_lop}</Link></td>
                    <td>{l.nam_hoc}</td>
                    <td>{siSo.get(l.id) ?? 0} HS</td>
                    <td>{ctLop.get(l.id) ?? <Pill mau="orange">Chưa áp dụng</Pill>}</td>
                    <td>Buổi {d.dangO}/{d.tong}</td>
                    <td className="text-sm">{(gv.get(l.id) ?? []).join(", ") || "—"}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <ButtonLink href={`/gv/lop/${l.id}`} size="sm">Vào lớp</ButtonLink>
                        <LopForm lop={l} />
                        <ActionButton action={luuTruLop.bind(null, l.id, !l.archived)}>{l.archived ? "Bỏ lưu trữ" : "Lưu trữ"}</ActionButton>
                        <ConfirmButton action={xoaLop.bind(null, l.id)} danger variant="outlineGray" title={`Xóa lớp ${l.ten_lop}?`} confirmText="Chuyển vào thùng rác"
                          message={<>Lớp có <b>{siSo.get(l.id) ?? 0} học sinh</b>. Xóa lớp sẽ làm học sinh mất liên kết với lớp và bài nộp. <b>Nên dùng “Lưu trữ”</b> khi hết năm học. Lớp bị xóa nằm trong Thùng rác 30 ngày.</>}>Xóa</ConfirmButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
