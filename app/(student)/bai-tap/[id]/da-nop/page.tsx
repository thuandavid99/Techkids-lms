import Image from "next/image";
import { notFound } from "next/navigation";
import { Check, Download, Star } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { duLieuHs } from "@/lib/server/hs";
import { soBaiCua } from "@/lib/server/data";
import { XemBaiNop } from "@/components/shared/XemBaiNop";
import { IMG } from "@/lib/brand";
import { PageGrid } from "@/components/ui/Card";
import { ButtonLink, btnClass } from "@/components/ui/Button";
import { NhanBai } from "@/components/ui/Pill";
import { tinhTrangThai } from "@/lib/domain/status";
import { tenBaiTap, tenBuoi } from "@/lib/domain/naming";
import { fmtDateTime } from "@/lib/domain/time";
import { xemTrucTuyenDuoc } from "@/lib/domain/files";

export const metadata = { title: "Bài đã nộp" };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ vua?: string }> }) {
  const { id } = await params;
  const { vua } = await searchParams;
  const p = await requireStudent();
  const { sb, dong, buoi } = await duLieuHs(p);
  const r = dong.find((x) => x.assignment_id === id);
  if (!r) notFound();
  const kq = tinhTrangThai(r, new Date());
  const { data: s } = await sb.from("submissions").select("id, code_text, file_path, ten_goc, mime, cham_tabs").eq("assignment_id", id).eq("student_id", p.id).maybeSingle();
  const soBai = await soBaiCua(sb, id, null, p.class_id);
  const b = buoi.find((x) => x.lesson_id === r.lesson_id);
  const daCham = r.trang_thai === "da_cham";
  const choNopLai = r.trang_thai === "da_nop" || r.trang_thai === "can_nop_lai";

  return (
    <PageGrid
      main={
        <div className="card card-pad text-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-la-500 shadow-lg"><Check className="h-16 w-16 text-white" strokeWidth={3} /></div>
          <h1 className="mt-5 text-3xl font-extrabold">{vua ? "Nộp bài thành công!" : s ? "Bài em đã nộp" : "Em chưa nộp bài này"}</h1>
          {r.nop_luc_moi_nhat && <p className="mt-2 text-lg text-slate-700">Bạn đã nộp bài lúc {fmtDateTime(r.nop_luc_moi_nhat)}</p>}
          <p className="mt-1 text-sm text-slate-500">{tenBaiTap(r.ma, r.tieu_de)} {r.so_lan_nop ? `· Đã nộp ${r.so_lan_nop} lần` : ""}</p>
          <div className="mt-2 flex justify-center"><NhanBai kq={kq} diem={r.diem} diemToiDa={r.diem_toi_da} /></div>

          <div className="mt-6 grid gap-4 text-center sm:grid-cols-2">
            <div className="rounded-2xl border border-vien bg-white p-5">
              <p className="text-lg font-bold">{daCham ? "Điểm" : "Trạng thái"}</p>
              {daCham
                ? <p className="mt-3 text-5xl font-extrabold text-la-600">{Number(r.diem).toFixed(1)} <span className="text-2xl text-navy-950">/ {r.diem_toi_da}</span></p>
                : <p className="mt-4 text-xl font-semibold text-xanh-700">{r.trang_thai === "can_nop_lai" ? "Cần nộp lại" : "Đã nộp – chờ thầy chấm"}</p>}
            </div>
            <div className="rounded-2xl border border-vien bg-white p-5">
              <p className="text-lg font-bold">Nhận xét của giáo viên</p>
              <p className="mt-4">{r.nhan_xet ? <>{r.nhan_xet} <Star className="inline h-5 w-5 fill-vang-400 text-vang-400" /></> : "Thầy sẽ chấm và nhận xét sớm nhé!"}</p>
            </div>
          </div>

          {s && (
            <div className="mt-6 text-left">
              <p className="mb-2 font-bold">Bài em đã nộp (bản mới nhất)</p>
              {s.code_text ? <XemBaiNop codeText={s.code_text} soBai={soBai} cham={s.cham_tabs} minH={160} /> : (
                <p className="rounded-xl bg-xanh-50 px-4 py-3">📎 {s.ten_goc}</p>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href={b ? `/buoi-hoc/${b.lesson_id}?tab=bai-tap` : "/bai-tap"} size="lg">Quay lại danh sách</ButtonLink>
            {s && <a href={`/api/tai-ve?loai=bai-nop&id=${s.id}`} className={btnClass("outline", "lg")}><Download className="h-4 w-4" /> Tải bài đã nộp</a>}
            {s?.file_path && xemTrucTuyenDuoc(s.mime ?? s.ten_goc) && <a href={`/api/tai-ve?loai=bai-nop&id=${s.id}&xem=1`} target="_blank" rel="noopener noreferrer" className={btnClass("outline", "lg")}>Xem file</a>}
            {choNopLai && <ButtonLink href={`/bai-tap/${id}/lam-bai`} variant="outlineGray" size="lg">Nộp lại bài</ButtonLink>}
          </div>
        </div>
      }
      aside={<>
        <div className="card card-pad text-center">
          <p className="text-3xl font-extrabold">Chúc mừng!</p>
          <Image src={IMG.celebrate} alt="" width={260} height={270} className="mx-auto h-auto w-56" />
          <p className="mt-2 text-lg">{b ? tenBuoi(b.nhan_buoi, b.tieu_de) : tenBaiTap(r.ma, r.tieu_de)}<br />– {kq.daNop ? "Đã nộp bài" : "Chưa nộp"}</p>
        </div>
      </>}
    />
  );
}
