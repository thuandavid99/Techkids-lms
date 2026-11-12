import Image from "next/image";
import { notFound } from "next/navigation";
import { Download, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { IMG } from "@/lib/brand";
import { PageHeader } from "@/components/ui/Card";
import { XemBaiNop, ChamTabsProvider } from "@/components/shared/XemBaiNop";
import { Markdown } from "@/components/ui/Markdown";
import { NhanBai } from "@/components/ui/Pill";
import { btnClass } from "@/components/ui/Button";
import { GradeForm } from "@/components/teacher/GradeForm";
import { tinhTrangThai } from "@/lib/domain/status";
import { toDongBai, soBaiCua } from "@/lib/server/data";
import { tenBaiTap } from "@/lib/domain/naming";
import { fmtDateTime } from "@/lib/domain/time";
import { xemTrucTuyenDuoc } from "@/lib/domain/files";
import type { DongBaiHs } from "@/lib/types";

export const metadata = { title: "Chấm bài" };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lop?: string }> }) {
  const { id } = await params;
  const { lop = "" } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sb = await createClient();
  const { data: s } = await sb.from("submissions").select("*").eq("id", id).maybeSingle();
  if (!s) notFound();
  const [{ data: row }, { data: mau }, { data: hangDoi }, { data: hs }] = await Promise.all([
    sb.from("v_bai_hoc_sinh").select("*").eq("student_id", s.student_id).eq("assignment_id", s.assignment_id).maybeSingle(),
    sb.from("comment_templates").select("noi_dung").order("thu_tu"),
    sb.from("submissions").select("id, nop_luc_moi_nhat, profiles!inner(class_id)").eq("trang_thai", "da_nop").order("nop_luc_moi_nhat"),
    sb.from("profiles").select("ho_ten, ma_hs, class_id, classes!profiles_class_id_fkey(ten_lop)").eq("id", s.student_id).maybeSingle(),
  ]);
  const { data: bt } = await sb.from("v_bai_tap_hieu_luc").select("ma, tieu_de, de_bai, diem_toi_da, override_id").eq("assignment_id", s.assignment_id).eq("class_id", hs?.class_id ?? "").maybeSingle();
  const r = row ? toDongBai(row as DongBaiHs) : null;
  const soBai = await soBaiCua(sb, s.assignment_id, (bt as { override_id?: string | null } | null)?.override_id ?? null, hs?.class_id ?? null);
  const kq = r ? tinhTrangThai(r, new Date()) : null;

  // Bài tiếp theo trong hàng đợi (cùng lớp nếu đang lọc)
  const ds = ((hangDoi as unknown as { id: string; profiles: { class_id: string } }[]) ?? []).filter((x) => !lop || x.profiles.class_id === lop);
  const viTri = ds.findIndex((x) => x.id === id);
  const tiep = ds.filter((x) => x.id !== id)[viTri >= 0 ? viTri : 0] ?? ds.find((x) => x.id !== id);
  const nextHref = tiep ? `/gv/bai-tap/cham/${tiep.id}${lop ? `?lop=${lop}` : ""}` : "/gv/bai-tap/hang-doi";
  const tenLop = (hs?.classes as unknown as { ten_lop: string } | null)?.ten_lop ?? "";
  const laAnh = s.file_path && /^image\//.test(s.mime ?? "");

  return (
    <ChamTabsProvider soBai={soBai} ban0={s.cham_tabs}>
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="card card-pad min-w-0 space-y-4">
        <PageHeader back={{ href: lop ? `/gv/lop/${lop}` : "/gv/bai-tap/hang-doi", label: lop ? "Quay lại ma trận" : "Quay lại hàng đợi" }}
          title={`Chấm bài: ${bt ? tenBaiTap(bt.ma, bt.tieu_de) : ""}`} />
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xl bg-xanh-100 px-3 py-1.5 font-medium">{tenLop} · Học sinh: {hs?.ho_ten} ({hs?.ma_hs})</span>
          {kq && <NhanBai kq={kq} diem={r?.diem} diemToiDa={r?.diem_toi_da} />}
        </div>
        <p className="text-sm text-slate-600">
          Nộp lần đầu: <b>{fmtDateTime(s.nop_luc_dau)}</b> · Bản mới nhất: <b>{fmtDateTime(s.nop_luc_moi_nhat)}</b> · {s.so_lan_nop} lần nộp
          {s.nguoi_nop === "giao_vien_nop_ho" && " · (thầy nộp hộ)"}
        </p>
        {r?.chua_lam_duoc && <p className="rounded-xl bg-tim-50 px-3 py-2 text-sm text-tim-500">🙋 Em báo chưa làm được{r.ghi_chu_co ? `: “${r.ghi_chu_co}”` : ""}</p>}

        {s.code_text !== null && s.code_text !== undefined ? (
          <XemBaiNop codeText={s.code_text} soBai={soBai} cheDo="thay" minH={320} />
        ) : s.file_path ? (
          <div className="rounded-2xl border border-vien bg-white p-4">
            <p className="font-semibold">📎 {s.ten_goc}</p>
            {laAnh && <img src={`/api/tai-ve?loai=bai-nop&id=${s.id}&xem=1`} alt={`Bài nộp của ${hs?.ho_ten}`} className="mt-3 max-h-[600px] rounded-xl border border-vien" />}
          </div>
        ) : <p className="rounded-2xl bg-slate-100 p-6 text-center text-slate-600">Không có nội dung bài nộp (nộp ngoài hệ thống).</p>}

        <div className="flex flex-wrap gap-2">
          {(s.code_text || s.file_path) && <a href={`/api/tai-ve?loai=bai-nop&id=${s.id}`} className={btnClass("outline", "sm")}><Download className="h-4 w-4" /> Tải bài (tên chuẩn)</a>}
          {s.file_path && xemTrucTuyenDuoc(s.mime ?? s.ten_goc) && <a href={`/api/tai-ve?loai=bai-nop&id=${s.id}&xem=1`} target="_blank" rel="noopener noreferrer" className={btnClass("outline", "sm")}><Eye className="h-4 w-4" /> Xem file</a>}
        </div>

        {bt?.de_bai && <details className="rounded-2xl border border-vien bg-xanh-50/40 p-4"><summary className="cursor-pointer font-bold">Đề bài</summary><div className="mt-2"><Markdown>{bt.de_bai}</Markdown></div></details>}
      </div>
      <aside className="space-y-5">
        <GradeForm submissionId={s.id} diem0={s.diem === null ? null : Number(s.diem)} nhanXet0={s.nhan_xet ?? ""} diemToiDa={Number(bt?.diem_toi_da ?? 10)}
          moc={s.nop_luc_moi_nhat} daCham={s.trang_thai === "da_cham"} mauNhanXet={(mau ?? []).map((m) => m.noi_dung)}
          nextHref={nextHref} soCho={ds.filter((x) => x.id !== id).length} choPhep={!!(s.code_text || s.file_path)} />
        <div className="card flex items-center gap-2 overflow-hidden pl-5">
          <div><p className="text-xl font-extrabold">Trợ lý chấm bài</p><p className="text-slate-600">Bạn đã chấm xong chưa?</p></div>
          <Image src={IMG.check} alt="" width={150} height={160} className="ml-auto h-auto w-32" />
        </div>
      </aside>
    </div>
    </ChamTabsProvider>
  );
}
