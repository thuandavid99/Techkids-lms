import { notFound } from "next/navigation";
import { Trophy, Paperclip } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { duLieuHs } from "@/lib/server/hs";
import { PageHeader } from "@/components/ui/Card";
import { Markdown } from "@/components/ui/Markdown";
import { LamBai } from "@/components/student/LamBai";
import { tinhTrangThai, NHAN_CHAM, NHAN_THOI_GIAN } from "@/lib/domain/status";
import { tenBaiTap } from "@/lib/domain/naming";
import { fmtDate, fmtDateTime } from "@/lib/domain/time";
import { kichThuocDep } from "@/lib/domain/files";

export const metadata = { title: "Làm bài" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await requireStudent();
  const { sb, dong } = await duLieuHs(p);
  const r = dong.find((x) => x.assignment_id === id);
  if (!r) notFound();
  const now = new Date();
  const kq = tinhTrangThai(r, now);

  const [{ data: a }, { data: draft }, { data: sub }] = await Promise.all([
    sb.from("v_bai_tap_hieu_luc").select("*").eq("assignment_id", id).eq("class_id", p.class_id!).maybeSingle(),
    sb.from("drafts").select("code_text, saved_at").eq("assignment_id", id).eq("student_id", p.id).maybeSingle(),
    sb.from("submissions").select("code_text, ten_goc").eq("assignment_id", id).eq("student_id", p.id).maybeSingle(),
  ]);
  if (!a) notFound();
  const { data: files } = await sb.from("assignment_files").select("id, ten_goc, kich_thuoc").in("assignment_id", [id, a.override_id].filter(Boolean));

  if (a.loai_nop === "ngoai_he_thong") {
    return (
      <div className="card card-pad">
        <PageHeader back={{ href: `/buoi-hoc/${r.lesson_id}?tab=bai-tap`, label: "Quay lại bài học" }} title={tenBaiTap(r.ma, r.tieu_de)} />
        <p>Bài này làm <b>ngoài hệ thống</b> (ví dụ thi trên hệ thống chấm của thầy). Thầy sẽ nhập điểm vào đây.</p>
      </div>
    );
  }

  // Lý do khóa nộp
  let khoa: string | null = null;
  if (kq.trangThai === "mien_nop") khoa = "Em được miễn nộp bài này.";
  else if (kq.trangThai === "da_cham") khoa = "Bài đã được chấm nên đã khóa. Nếu cần sửa, em nhờ thầy bấm \"Mở cho nộp lại\".";
  else if (a.khoa_nop) khoa = "Thầy đang khóa nộp bài này.";
  else if (kq.hanHieuLuc && now > kq.hanHieuLuc && !a.cho_nop_tre && !kq.daNop) khoa = "Đã quá hạn nộp và bài này không nhận bài trễ.";

  const pill = kq.nhanThoiGian && kq.trangThai === "chua_nop" ? NHAN_THOI_GIAN[kq.nhanThoiGian] : NHAN_CHAM[kq.trangThai];

  return (
    <LamBai
      assignmentId={id}
      loaiNop={a.loai_nop}
      han={kq.hanHieuLuc ? fmtDateTime(kq.hanHieuLuc) : "Chưa đặt hạn"}
      quaHan={kq.quaHanChuaNop}
      pill={{ text: pill.text, mau: pill.mau }}
      soLanNop={r.so_lan_nop ?? 0}
      nopMoiNhat={r.nop_luc_moi_nhat ? fmtDateTime(r.nop_luc_moi_nhat) : null}
      daNop={kq.daNop}
      nhanXet={r.nhan_xet}
      diem={r.diem !== null ? `${Number(r.diem).toFixed(1)} / ${r.diem_toi_da}` : null}
      khoa={khoa}
      code0={draft?.code_text ?? sub?.code_text ?? ""}
      nhapLuc={draft?.saved_at ?? null}
      co={{ checked: r.chua_lam_duoc, note: r.ghi_chu_co, disabled: kq.trangThai === "da_cham" || r.mien_nop }}
    >
      <PageHeader back={{ href: `/buoi-hoc/${r.lesson_id}?tab=bai-tap`, label: "Quay lại bài học" }}
        title={<span className="flex items-center gap-3"><Trophy className="h-8 w-8 shrink-0 fill-vang-400 text-vang-400" /> Làm bài: {tenBaiTap(r.ma, r.tieu_de)}</span>} />
      {(a.de_bai || (files?.length ?? 0) > 0) && (
        <div className="rounded-2xl border border-vien bg-xanh-50/50 p-4">
          <p className="mb-1 font-bold">Đề bài</p>
          <Markdown>{a.de_bai}</Markdown>
          {files?.map((f) => (
            <a key={f.id} href={`/api/tai-ve?loai=de-bai&id=${f.id}`} className="link mt-2 flex items-center gap-1.5 text-sm"><Paperclip className="h-4 w-4" /> {f.ten_goc} {f.kich_thuoc ? `(${kichThuocDep(f.kich_thuoc)})` : ""}</a>
          ))}
          {kq.hanHieuLuc && r.han_nop_rieng && <p className="mt-2 text-sm text-xanh-700">Thầy đã gia hạn riêng cho em đến {fmtDate(r.han_nop_rieng)}.</p>}
        </div>
      )}
    </LamBai>
  );
}
