import { getProfile, laQuanTri } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, PageGrid, PageHeader, CardTitle } from "@/components/ui/Card";
import { ConfirmButton, ActionButton } from "@/components/ui/Modal";
import { BaiTapForm, HanNopLop, type BaiTapVals } from "@/components/teacher/BaiTapForm";
import { UploadButton } from "@/components/teacher/UploadButton";
import { xoaBaiTap, anHienBaiTap, xinLinkFileDe, xacNhanFileDe, xoaFileDe } from "@/lib/actions/gv/bt";
import { tenBuoi } from "@/lib/domain/naming";
import { toVNInput, fmtDateTime } from "@/lib/domain/time";
import { kichThuocDep, DUOI_CHO_PHEP } from "@/lib/domain/files";

export const metadata = { title: "Soạn bài tập" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sb = await createClient();
  const qt = laQuanTri(await getProfile()); // quản trị sửa bản chung; GV thường chỉ bản riêng lớp mình
  const { data: a } = await sb.from("assignments").select("*, lessons(id, nhan_buoi, tieu_de, curriculum_id, class_id)").eq("id", id).is("ghi_de_cua", null).maybeSingle();
  if (!a) notFound();
  const lesson = a.lessons as { id: string; nhan_buoi: string; tieu_de: string; curriculum_id: string; class_id: string | null };
  const [{ data: cc }, { data: hans }, { data: rieng }, { count: soBaiNop }, { data: files }, { data: ovs }] = await Promise.all([
    sb.from("class_curriculum").select("class_id, classes(ten_lop, deleted_at)").eq("curriculum_id", lesson.curriculum_id),
    sb.from("assignment_deadlines").select("class_id, han_nop").eq("assignment_id", id),
    sb.from("assignments").select("*").eq("ghi_de_cua", id).is("deleted_at", null),
    sb.from("submissions").select("id", { count: "exact", head: true }).eq("assignment_id", id).not("nop_luc_dau", "is", null),
    sb.from("assignment_files").select("*").eq("assignment_id", id),
    sb.from("student_overrides").select("student_id, han_nop_rieng, mien_nop, ly_do, profiles(ho_ten, ma_hs)").eq("assignment_id", id),
  ]);
  const lops = ((cc as unknown as { class_id: string; classes: { ten_lop: string; deleted_at: string | null } | null }[]) ?? [])
    .filter((x) => x.classes && !x.classes.deleted_at && (!lesson.class_id || x.class_id === lesson.class_id))
    .map((x) => ({ id: x.class_id, ten_lop: x.classes!.ten_lop }));
  const hanMap = new Map((hans ?? []).map((h) => [h.class_id, h.han_nop]));
  const vals = (x: Record<string, unknown>): BaiTapVals => ({
    id, ma: String(x.ma ?? ""), tieu_de: String(x.tieu_de ?? ""), de_bai: String(x.de_bai ?? ""), diem_toi_da: Number(x.diem_toi_da), loai_nop: String(x.loai_nop),
    cho_nop_tre: !!x.cho_nop_tre, khoa_nop: !!x.khoa_nop, tinh_diem: !!x.tinh_diem, bat_buoc: !!x.bat_buoc, he_so: Number(x.he_so), hoc_ky: Number(x.hoc_ky), hien_thi: !!x.hien_thi,
    so_bai: Number(x.so_bai ?? 1) || 1,
  });

  return (
    <PageGrid
      main={
        <Card>
          <PageHeader back={{ href: `/gv/chuong-trinh/buoi/${lesson.id}`, label: `Quay lại ${tenBuoi(lesson.nhan_buoi, lesson.tieu_de)}` }} title={`Soạn bài tập ${a.ma}`}
            actions={<>
              <ActionButton action={anHienBaiTap.bind(null, id, !a.hien_thi)} variant="outlineGray">{a.hien_thi ? "Ẩn" : "Hiện"}</ActionButton>
              <ConfirmButton action={xoaBaiTap.bind(null, id)} danger variant="outlineGray" title="Xóa bài tập?" confirmText="Chuyển vào thùng rác"
                message={soBaiNop ? <>Bài tập này đã có <b>{soBaiNop} bài nộp</b>. Nên bấm <b>Ẩn</b> thay vì xóa. Nếu xóa, bài sẽ vào Thùng rác (không thể xóa vĩnh viễn khi đã có bài nộp).</> : "Bài tập sẽ vào Thùng rác, khôi phục được trong 30 ngày."}>Xóa</ConfirmButton>
            </>} />
          <BaiTapForm suaChung={qt || !!a.class_id} v={vals(a)} lops={lops} soBaiNop={soBaiNop ?? 0} banRieng={Object.fromEntries((rieng ?? []).map((r) => [r.class_id, vals(r)]))} />
        </Card>
      }
      aside={<>
        <Card>
          <CardTitle>Hạn nộp từng lớp</CardTitle>
          <HanNopLop assignmentId={id} ds={lops.map((l) => ({ classId: l.id, ten: l.ten_lop, han: toVNInput(hanMap.get(l.id)) }))} />
          <p className="mt-2 text-xs text-slate-500">Giờ Việt Nam. Để trống = không có hạn.</p>
        </Card>
        <Card>
          <CardTitle action={<UploadButton bucket="assignment-files" xinLink={xinLinkFileDe.bind(null, id)} xacNhan={xacNhanFileDe.bind(null, id)} accept={DUOI_CHO_PHEP.de_bai.map((d) => "." + d).join(",")}>Đính kèm</UploadButton>}>File đề</CardTitle>
          {!files?.length ? <p className="text-sm text-slate-500">Chưa có file đề.</p> : (
            <ul className="space-y-2">{files.map((f) => (
              <li key={f.id} className="flex items-center gap-2 text-sm">
                <Paperclip className="h-4 w-4" /><a href={`/api/tai-ve?loai=de-bai&id=${f.id}`} className="link flex-1 truncate">{f.ten_goc}</a><span className="text-slate-400">{kichThuocDep(f.kich_thuoc)}</span>
                <ConfirmButton action={xoaFileDe.bind(null, f.id)} variant="ghost" size="sm" danger title="Xóa file đề?" message={f.ten_goc}>Xóa</ConfirmButton>
              </li>))}</ul>
          )}
        </Card>
        <Card>
          <CardTitle>Gia hạn riêng / miễn nộp</CardTitle>
          {!ovs?.length ? <p className="text-sm text-slate-500">Chưa có. Thao tác từ Ma trận tiến độ hoặc Tình hình nộp (nút ⋯ trên ô).</p> : (
            <ul className="space-y-1.5 text-sm">
              {(ovs as unknown as { student_id: string; han_nop_rieng: string | null; mien_nop: boolean; ly_do: string | null; profiles: { ho_ten: string; ma_hs: string } }[]).map((o) => (
                <li key={o.student_id}>• {o.profiles.ho_ten}: {o.mien_nop ? `miễn nộp${o.ly_do ? ` (${o.ly_do})` : ""}` : `hạn riêng ${fmtDateTime(o.han_nop_rieng)}`}</li>
              ))}
            </ul>
          )}
        </Card>
      </>}
    />
  );
}
