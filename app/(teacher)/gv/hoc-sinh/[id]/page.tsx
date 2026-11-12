import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { dongBaiHs, toDongBai, caiDat, buoiLop } from "@/lib/server/data";
import { CaNhanHoa } from "@/components/teacher/CaNhanHoa";
import { tenBuoi } from "@/lib/domain/naming";
import { Card, PageGrid, PageHeader, CardTitle } from "@/components/ui/Card";
import { Avatar, Stat } from "@/components/ui/Misc";
import { NhanBai, Pill } from "@/components/ui/Pill";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { CellMenu } from "@/components/teacher/CellMenu";
import { GhiChu } from "@/components/teacher/GhiChu";
import { ResetYeuCau } from "@/components/teacher/ResetYeuCau";
import { tinhTrangThai } from "@/lib/domain/status";
import { diemTrungBinh, phanTramHoanThanh, tinhHuyHieu, boHaiBaiLienTiep } from "@/lib/domain/stats";
import { tenBaiTap } from "@/lib/domain/naming";
import { fmtShort, fmtDate, fmtDateTime, toVNInput } from "@/lib/domain/time";

export const metadata = { title: "Hồ sơ học sinh" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sb = await createClient();
  const { data: p } = await sb.from("profiles").select("*, classes!profiles_class_id_fkey(ten_lop)").eq("id", id).eq("vai_tro", "hoc_sinh").maybeSingle();
  if (!p) notFound();
  const [rows0, { data: nhac }, { data: notes }, { data: enr }, cd] = await Promise.all([
    dongBaiHs(sb, id),
    sb.from("parent_reminders").select("*").eq("student_id", id).order("nhac_luc", { ascending: false }),
    sb.from("teacher_notes").select("*").eq("student_id", id).order("tao_luc", { ascending: false }),
    sb.from("enrollments").select("nam_hoc, tu_ngay, den_ngay, classes(ten_lop)").eq("student_id", id).order("tu_ngay", { ascending: false }),
    caiDat(sb),
  ]);
  // Cá nhân hóa: buổi lớp đang khóa / đã mở riêng cho em, các bài riêng của em
  const [lich, { data: moRieng }, { data: rieng }] = await Promise.all([
    p.class_id ? buoiLop(sb, p.class_id) : Promise.resolve([]),
    sb.from("student_lesson_access").select("lesson_id").eq("student_id", id),
    sb.from("assignment_students").select("assignment_id, assignments(ma, tieu_de, deleted_at)").eq("student_id", id),
  ]);
  const idRieng = new Set(((moRieng as { lesson_id: string }[] | null) ?? []).map((x) => x.lesson_id));
  const tenB = (b: { nhan_buoi: string; tieu_de: string }) => tenBuoi(b.nhan_buoi, b.tieu_de);
  const buoiKhoa = lich.filter((b) => !b.da_mo && !b.ban_nhap && !idRieng.has(b.lesson_id)).map((b) => ({ lesson_id: b.lesson_id, ten: tenB(b) }));
  const buoiMoRieng = lich.filter((b) => idRieng.has(b.lesson_id)).map((b) => ({ lesson_id: b.lesson_id, ten: tenB(b) }));
  const baiTapChon = rows0.map((r) => ({ assignment_id: r.assignment_id, ten: tenBaiTap(r.ma, r.tieu_de), han: r.han_lop ? fmtShort(r.han_lop) : "chưa đặt", hanRieng: r.han_nop_rieng ? fmtShort(r.han_nop_rieng) : null, mien: !!r.mien_nop }));
  type RowRieng = { assignment_id: string; assignments: { ma: string; tieu_de: string; deleted_at: string | null } | null };
  const baiRieng = ((rieng as RowRieng[] | null) ?? []).filter((x) => x.assignments && !x.assignments.deleted_at).map((x) => ({ assignment_id: x.assignment_id, ten: tenBaiTap(x.assignments!.ma, x.assignments!.tieu_de) }));
  const rows = rows0.map(toDongBai);
  const now = new Date();
  const mo = rows.filter((r) => r.da_mo);
  const tb = diemTrungBinh(mo, { soChuSo: Number(cd.lam_tron_diem ?? 1) });
  const pt = phanTramHoanThanh(mo, now);
  const hh = tinhHuyHieu(mo, now);
  const canhBao = boHaiBaiLienTiep(mo, now);
  const tenLop = (p.classes as { ten_lop: string } | null)?.ten_lop ?? "—";

  return (
    <PageGrid
      main={<>
        <Card>
          <PageHeader back={{ href: `/gv/hoc-sinh?lop=${p.class_id ?? ""}`, label: "Quản lý học sinh" }}
            title={<span className="flex items-center gap-4"><Avatar name={p.ho_ten} avatar={p.avatar} size={64} /> <span>{p.ho_ten}<span className="block text-base font-medium text-slate-600">{p.ma_hs} · Lớp {tenLop} {!p.dang_hoc && "· Nghỉ học"}</span></span></span>}
            actions={<>
              <ResetYeuCau ids={[id]} nhan="Reset mật khẩu" />
              <ButtonLink href={`/phieu/${id}`} variant="secondary" size="sm"><Printer className="h-4 w-4" /> Phiếu tiến độ PDF</ButtonLink>
            </>} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Điểm trung bình" value={tb === null ? "—" : tb.toFixed(1)} />
            <Stat label="Hoàn thành" value={`${pt.phanTram}%`} tone="green" />
            <Stat label="Huy hiệu" value={hh.length ? hh.map((h) => h.ten).join(", ") : "Chưa có"} tone="orange" />
          </div>
          {canhBao && <p className="mt-3 flex items-center gap-2 rounded-xl bg-do-50 px-3 py-2 text-sm text-do-600"><AlertTriangle className="h-4 w-4" /> Cảnh báo sớm: em đã bỏ 2 bài liên tiếp.</p>}
        </Card>
        <Card>
          <CardTitle>Tiến độ & lịch sử nộp bài</CardTitle>
          {mo.length === 0 ? <EmptyState title="Chưa có bài tập nào được mở" /> : (
            <div className="table-wrap">
              <table className="tbl min-w-[760px]">
                <thead><tr><th>Bài tập</th><th>Trạng thái</th><th>Nộp lần đầu</th><th>Bản mới nhất</th><th>Điểm</th><th></th></tr></thead>
                <tbody>
                  {mo.map((r) => {
                    const k = tinhTrangThai(r, now);
                    return (
                      <tr key={r.assignment_id}>
                        <td className="font-medium">{r.submission_id ? <Link href={`/gv/bai-tap/cham/${r.submission_id}`} className="hover:text-xanh-600">{tenBaiTap(r.ma, r.tieu_de)}</Link> : tenBaiTap(r.ma, r.tieu_de)}</td>
                        <td><NhanBai kq={k} />{k.coChuaLamDuoc && r.ghi_chu_co && <span className="block text-xs text-tim-500">“{r.ghi_chu_co}”</span>}</td>
                        <td className="text-sm">{fmtShort(r.nop_luc_dau)}</td>
                        <td className="text-sm">{fmtShort(r.nop_luc_moi_nhat)}{r.so_lan_nop && r.so_lan_nop > 1 ? ` (${r.so_lan_nop} lần)` : ""}</td>
                        <td>{r.diem !== null ? <b className="text-la-600">{Number(r.diem).toFixed(1)}</b> : "—"}</td>
                        <td><CellMenu o={{ assignmentId: r.assignment_id, studentId: id, tenHs: p.ho_ten, tenBai: tenBaiTap(r.ma, r.tieu_de), mien: r.mien_nop, ngoai: r.trang_thai === "nop_ngoai_he_thong", daCham: r.trang_thai === "da_cham", coBai: !!r.submission_id, hanRieng: toVNInput(r.han_nop_rieng) }} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </>}
      aside={<>
        <CaNhanHoa studentId={id} tenHs={p.ho_ten} buoiKhoa={buoiKhoa} buoiMoRieng={buoiMoRieng} baiTap={baiTapChon} baiRieng={baiRieng} />
        <Card><CardTitle>Ghi chú riêng của thầy</CardTitle><GhiChu studentId={id} ds={notes ?? []} /></Card>
        <Card>
          <CardTitle>Lịch sử nhắc phụ huynh</CardTitle>
          {!nhac?.length ? <p className="text-sm text-slate-500">Chưa nhắc lần nào.</p> : (
            <ul className="space-y-2 text-sm">{nhac.map((n) => <li key={n.id} className="rounded-xl bg-xanh-50 px-3 py-2"><p className="font-semibold">{fmtDateTime(n.nhac_luc)} · {n.kenh}</p><p className="line-clamp-3 text-slate-600">{n.noi_dung}</p></li>)}</ul>
          )}
        </Card>
        <Card>
          <CardTitle>Lịch sử lớp</CardTitle>
          <ul className="space-y-1 text-sm">{(enr as unknown as { nam_hoc: string; tu_ngay: string; den_ngay: string | null; classes: { ten_lop: string } | null }[] ?? []).map((e, i) => (
            <li key={i}>• Lớp {e.classes?.ten_lop} ({e.nam_hoc}) từ {fmtDate(e.tu_ngay)}{e.den_ngay ? ` đến ${fmtDate(e.den_ngay)}` : <Pill mau="green" className="ml-1">hiện tại</Pill>}</li>
          ))}</ul>
        </Card>
      </>}
    />
  );
}
