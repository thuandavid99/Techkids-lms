import Link from "next/link";
import Image from "next/image";
import { Trophy, Star, Megaphone, Users, ClipboardList } from "lucide-react";
import { Card, CardTitle, XemTatCa } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/Misc";
import { ButtonLink } from "@/components/ui/Button";
import { IMG } from "@/lib/brand";
import { fmtAgo, fmtDate } from "@/lib/domain/time";
import { tenBaiTap } from "@/lib/domain/naming";

/** "Hành trình học tập": vòng tiến độ + lời động viên */
export function HanhTrinhCard({ xong, tong, phanTram }: { xong: number; tong: number; phanTram: number }) {
  return (
    <Card>
      <CardTitle icon={<Trophy className="h-6 w-6 text-vang-400" />}>Hành trình học tập</CardTitle>
      <div className="flex items-center gap-5">
        <ProgressRing value={phanTram} />
        <div>
          <p className="text-slate-600">Hoàn thành</p>
          <p className="text-xl font-extrabold">{xong} / {tong} buổi học</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-xanh-50 px-4 py-3">
        <Star className="h-6 w-6 shrink-0 fill-vang-400 text-vang-400" />
        <div className="text-sm">
          <p className="font-bold">{phanTram >= 100 ? "Xuất sắc! Em đã hoàn thành tất cả!" : phanTram >= 50 ? "Bạn thật tuyệt vời!" : "Cố lên, em làm được mà!"}</p>
          <p className="text-slate-600">Cố gắng hoàn thành 100% nhé!</p>
        </div>
        <Image src={IMG.sidebarRocket} alt="" width={56} height={44} className="ml-auto hidden rounded-lg sm:block" />
      </div>
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
              <Link href={t.lien_ket ?? href} className={`flex-1 ${t.da_doc ? "text-slate-600" : "font-semibold"}`}>{t.noi_dung}</Link>
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
        <Image src={IMG.school} alt="" width={110} height={86} className="h-auto w-24" />
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
