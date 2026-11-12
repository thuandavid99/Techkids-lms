import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, ArrowRight, Download, CupSoda, Sparkles } from "lucide-react";
import { laLinkQuiz } from "@/lib/domain/files";
import { requireStudent } from "@/lib/auth";
import { duLieuHs } from "@/lib/server/hs";
import { IMG } from "@/lib/brand";
import { Card, CardTitle, PageGrid, PageHeader } from "@/components/ui/Card";
import { LessonIcon, LinkTabs } from "@/components/ui/Misc";
import { ButtonLink, btnClass } from "@/components/ui/Button";
import { NhanBai } from "@/components/ui/Pill";
import { Markdown } from "@/components/ui/Markdown";
import { EmptyState } from "@/components/ui/States";
import { MaterialRow } from "@/components/student/MaterialRow";
import { FlagToggle } from "@/components/student/FlagToggle";
import { tinhTrangThai } from "@/lib/domain/status";
import { tenBuoi, tenBaiTap } from "@/lib/domain/naming";
import { fmtDateTime } from "@/lib/domain/time";
import { cmpKey } from "@/lib/domain/order";
import type { TaiLieu } from "@/lib/types";

export const metadata = { title: "Chi tiết buổi học" };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const { tab = "kien-thuc" } = await searchParams;
  const p = await requireStudent();
  const { sb, buoi, dong, loai } = await duLieuHs(p);
  const b = buoi.find((x) => x.lesson_id === id);
  if (!b) notFound();
  const now = new Date();

  const [{ data: mats }, { data: cats }] = await Promise.all([
    sb.from("materials").select("*").in("lesson_id", [b.lesson_id, b.override_id].filter(Boolean) as string[]).is("deleted_at", null),
    sb.from("material_categories").select("id, ten"),
  ]);
  const taiLieu = ((mats as TaiLieu[]) ?? []).sort((x, y) => cmpKey(x.thu_tu, y.thu_tu));
  const tenLoaiTL = new Map(((cats as { id: string; ten: string }[]) ?? []).map((c) => [c.id, c.ten]));
  const quiz = taiLieu.filter((m) => m.nguon === "link" && laLinkQuiz(m.url, m.loai ? tenLoaiTL.get(m.loai) : null));
  const bai = dong.filter((r) => r.lesson_id === b.lesson_id);
  const l = b.loai_id ? loai.get(b.loai_id) : undefined;
  const baiDau = bai.find((r) => !tinhTrangThai(r, now).daNop && r.loai_nop !== "ngoai_he_thong") ?? bai[0];
  const base = `/buoi-hoc/${id}`;

  return (
    <PageGrid
      main={
        <Card>
          <PageHeader back={{ href: "/buoi-hoc", label: "Quay lại danh sách" }} title={
            <span className="flex items-start gap-3 sm:items-center sm:gap-4"><LessonIcon icon={l?.icon ?? "code"} mau={l?.mau ?? "blue"} size={72} className="!h-11 !w-11 !rounded-xl sm:!h-[72px] sm:!w-[72px] sm:!rounded-2xl" /><span className="min-w-0">{tenBuoi(b.nhan_buoi, b.tieu_de)}</span></span>
          } sub={b.tom_tat} />
          {quiz.length > 0 && (
            <div className="-mt-2 mb-4 flex flex-wrap gap-2">
              {quiz.map((m, i) => (
                <a key={m.id} href={`/api/tai-ve?loai=tai-lieu&id=${m.id}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-tim-500 px-5 py-2.5 font-bold text-white shadow-sm hover:brightness-110">
                  <Sparkles className="h-5 w-5" /> {quiz.length > 1 ? `Làm Quiz ${i + 1}` : "Làm Quiz"}
                </a>
              ))}
            </div>
          )}
          <LinkTabs active={tab} tabs={[
            { key: "kien-thuc", label: "Kiến thức", href: `${base}?tab=kien-thuc` },
            { key: "tai-lieu", label: `Tài liệu${taiLieu.length ? ` (${taiLieu.length})` : ""}`, href: `${base}?tab=tai-lieu` },
            { key: "bai-tap", label: `Bài tập${bai.length ? ` (${bai.length})` : ""}`, href: `${base}?tab=bai-tap` },
          ]} />

          <div className="pt-5">
            {tab === "kien-thuc" && (
              <div>
                <div className="min-w-0 max-w-4xl">
                  {b.noi_dung_kien_thuc ? <Markdown>{b.noi_dung_kien_thuc}</Markdown>
                    : <p className="text-slate-500">Thầy chưa soạn phần kiến thức cho buổi này. Em xem tab Tài liệu nhé.</p>}
                  {bai.length > 0 && <ButtonLink href={`${base}?tab=bai-tap`} className="mt-6">Làm bài tập ngay <ArrowRight className="h-4 w-4" /></ButtonLink>}
                </div>
              </div>
            )}

            {tab === "tai-lieu" && (taiLieu.length === 0
              ? <EmptyState title="Buổi này chưa có tài liệu" img={IMG.books} />
              : <div>{taiLieu.map((m) => <MaterialRow key={m.id} m={m} phanLoai={m.loai ? tenLoaiTL.get(m.loai) : undefined} />)}</div>)}

            {tab === "bai-tap" && (bai.length === 0
              ? <EmptyState title="Buổi này không có bài tập" hint="Em ôn lại kiến thức và tài liệu nhé." />
              : (
                <div className="space-y-3">
                  {bai.map((r) => {
                    const kq = tinhTrangThai(r, now);
                    return (
                      <div key={r.assignment_id} className="rounded-2xl border border-vien bg-white p-4">
                        <div className="flex flex-wrap items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-lg font-bold">{tenBaiTap(r.ma, r.tieu_de)} {!r.bat_buoc && <span className="text-sm font-medium text-slate-500">(tùy chọn)</span>}</p>
                            <p className="text-sm text-slate-600">Hạn nộp: <b className={kq.quaHanChuaNop ? "text-do-600" : ""}>{kq.hanHieuLuc ? fmtDateTime(kq.hanHieuLuc) : "chưa đặt"}</b></p>
                            <div className="mt-2"><NhanBai kq={kq} diem={r.diem} diemToiDa={r.diem_toi_da} /></div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {r.loai_nop === "ngoai_he_thong" ? <span className="text-sm text-slate-500">Nộp ngoài hệ thống</span> : <>
                              {kq.daNop && <Link href={`/bai-tap/${r.assignment_id}/da-nop`} className={btnClass("outline", "sm")}>Xem bài đã nộp</Link>}
                              {kq.trangThai !== "da_cham" && kq.trangThai !== "mien_nop" && <ButtonLink size="sm" href={`/bai-tap/${r.assignment_id}/lam-bai`}>{kq.daNop ? "Nộp lại" : "Làm bài"}</ButtonLink>}
                            </>}
                          </div>
                        </div>
                        <div className="mt-2"><FlagToggle assignmentId={r.assignment_id} checked={r.chua_lam_duoc} note={r.ghi_chu_co} disabled={kq.trangThai === "da_cham" || r.mien_nop} /></div>
                      </div>
                    );
                  })}
                </div>
              ))}
          </div>
        </Card>
      }
      aside={<>
        <Card>
          <CardTitle icon={<FileText className="h-6 w-6 text-xanh-600" />}>Tài liệu bài học</CardTitle>
          {taiLieu.length === 0 ? <p className="text-sm text-slate-500">Chưa có tài liệu.</p> : (
            <ul className="divide-y divide-vien">
              {taiLieu.slice(0, 4).map((m) => (
                <li key={m.id}>
                  <a href={`/api/tai-ve?loai=tai-lieu&id=${m.id}${m.cho_phep_tai || m.nguon === "link" ? "" : "&xem=1"}`} target={m.nguon === "link" ? "_blank" : undefined} rel="noopener noreferrer" className="flex items-center gap-3 py-3 hover:text-xanh-600">
                    <span className="shrink-0 rounded-xl bg-xanh-50 p-2.5 text-xanh-600"><Download className="h-5 w-5" /></span>
                    <span className="min-w-0 chu-dai"><span className="block font-medium">{m.loai ? tenLoaiTL.get(m.loai) ?? m.tieu_de : m.tieu_de}</span><span className="block text-sm text-xanh-600">{m.ten_goc ?? m.tieu_de}</span></span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {baiDau && (
          <Card>
            <CardTitle icon={<CupSoda className="h-6 w-6 text-cam-500" />}>Bài tập của buổi học</CardTitle>
            <p className="font-medium">{tenBaiTap(baiDau.ma, baiDau.tieu_de)}</p>
            <p className="mt-1 text-slate-600">{tinhTrangThai(baiDau, now).daNop ? "Đã nộp" : "Chưa nộp"}</p>
            {baiDau.loai_nop !== "ngoai_he_thong" && <ButtonLink href={`/bai-tap/${baiDau.assignment_id}/lam-bai`} className="mt-4 w-full">Bắt đầu làm bài</ButtonLink>}
          </Card>
        )}
      </>}
    />
  );
}
