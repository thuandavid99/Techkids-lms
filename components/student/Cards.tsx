import Link from "next/link";
import Image from "next/image";
import { Trophy, Star, Megaphone, Users, ClipboardList } from "lucide-react";
import { Card, CardTitle, XemTatCa } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { IMG } from "@/lib/brand";
import { fmtAgo, fmtDate } from "@/lib/domain/time";
import { tenBaiTap } from "@/lib/domain/naming";

type SoLieu = { buoi: { xong: number; tong: number }; bai: { xong: number; tong: number } };

/** Thanh tiến độ "x/y" — dùng chung mọi trang học sinh để con số luôn khớp nhau */
export function ThanhXY({ nhan, xong, tong, mau = "bg-xanh-600" }: { nhan: string; xong: number; tong: number; mau?: string }) {
  const w = tong === 0 ? 0 : Math.min(100, Math.round((xong / tong) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm"><span className="font-semibold text-slate-700">{nhan}</span><span className="text-lg font-extrabold text-navy-950">{xong}/{tong}</span></div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-xanh-50"><div className={`h-full rounded-full ${mau}`} style={{ width: `${w}%` }} /></div>
    </div>
  );
}

/** "Tiến độ của em": Buổi học x/y + Bài tập a/b (cùng một nguồn số liệu soLieuHs) */
export function HanhTrinhCard({ buoi, bai, diemTb, huyHieu }: SoLieu & { diemTb?: string | null; huyHieu?: number }) {
  const xongHet = bai.tong > 0 && bai.xong >= bai.tong && buoi.xong >= buoi.tong;
  return (
    <Card>
      <CardTitle icon={<Trophy className="h-6 w-6 text-vang-400" />}>Tiến độ của em</CardTitle>
      <div className="space-y-3">
        <ThanhXY nhan="Buổi học đã hoàn thành" xong={buoi.xong} tong={buoi.tong} />
        <ThanhXY nhan="Bài tập đã nộp" xong={bai.xong} tong={bai.tong} mau="bg-la-500" />
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-navy-800">
        <Star className="h-5 w-5 shrink-0 fill-vang-400 text-vang-400" />
        {xongHet ? "Xuất sắc! Em đã hoàn thành tất cả!" : bai.tong - bai.xong > 0 ? `Còn ${bai.tong - bai.xong} bài nữa thôi, cố lên!` : "Em đang làm rất tốt!"}
      </p>
      {diemTb !== undefined && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm">
          <Link href="/ket-qua" className="rounded-xl bg-xanh-50 px-2 py-2 hover:bg-xanh-100">Điểm TB<br /><b className="text-lg">{diemTb ?? "—"}</b></Link>
          <Link href="/ket-qua" className="rounded-xl bg-xanh-50 px-2 py-2 hover:bg-xanh-100">Huy hiệu<br /><b className="text-lg">{huyHieu ?? 0}</b></Link>
        </div>
      )}
    </Card>
  );
}

export interface TB { id: string; noi_dung: string; tao_luc: string; loai: string; da_doc: boolean; lien_ket: string | null }
const CHAM: Record<string, string> = { sap_han: "bg-cam-500", bai_moi: "bg-xanh-500", da_cham: "bg-la-500", can_nop_lai: "bg-do-600", lop: "bg-tim-500" };

export function ThongBaoCard({ ds, href = "/thong-bao" }: { ds: TB[]; href?: string }) {
  return (
    <Card>
      <CardTitle icon={<Megaphone className="h-6 w-6 text-cam-500" />} action={<XemTatCa href={href} />}>Thông báo</CardTitle>
      {ds.length === 0 ? <p className="text-sm text-slate-500">Chưa có thông báo nào.</p> : (
        <ul className="space-y-3">
          {ds.map((t) => (
            <li key={t.id} className="flex gap-3 text-sm">
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${CHAM[t.loai] ?? "bg-slate-400"}`} />
              <Link href={t.lien_ket ?? href} className={`min-w-0 flex-1 chu-dai ${t.da_doc ? "text-slate-600" : "font-semibold"}`}>{t.noi_dung}</Link>
              <span className="shrink-0 text-xs text-slate-400">{fmtAgo(t.tao_luc)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function LopCuaBanCard({ ten, siSo }: { ten: string; siSo: number }) {
  return (
    <Card>
      <CardTitle icon={<Users className="h-6 w-6 text-xanh-600" />}>Lớp học của bạn</CardTitle>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl font-extrabold">Lớp {ten}</p>
          <p className="text-sm text-slate-600">Sĩ số: {siSo} học sinh</p>
        </div>
        <Image src={IMG.school} alt="" width={120} height={90} unoptimized className="h-auto w-24 shrink-0" />
      </div>
      <ButtonLink href="/lop-cua-toi" variant="ghost" size="sm" className="mt-3 w-full !rounded-xl bg-xanh-50">Xem chi tiết lớp →</ButtonLink>
    </Card>
  );
}

/** "Bài tập sắp đến hạn" (nền cam nhạt, hạn đỏ, nút Làm ngay) */
export function SapDenHanCard({ bai }: { bai: { assignment_id: string; ma: string; tieu_de: string; han: string | null } | null }) {
  return (
    <Card className="!bg-cam-50/70">
      <CardTitle icon={<ClipboardList className="h-6 w-6 text-cam-500" />}>Bài tập sắp đến hạn</CardTitle>
      {bai ? (
        <>
          <p className="text-[1.05rem] font-semibold">{tenBaiTap(bai.ma, bai.tieu_de)}</p>
          <p className="mt-1 font-semibold text-do-600">Hạn nộp: {bai.han ? fmtDate(bai.han) : "chưa đặt"}</p>
          <ButtonLink href={`/bai-tap/${bai.assignment_id}/lam-bai`} className="mt-4 w-full">Làm ngay</ButtonLink>
        </>
      ) : <p className="text-sm text-slate-600">Em đã nộp hết bài rồi. Tuyệt vời! 🎉</p>}
    </Card>
  );
}
