import { ShieldCheck, LogOut, Award } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { duLieuHs } from "@/lib/server/hs";
import { Card, PageGrid } from "@/components/ui/Card";
import { ThanhXY } from "@/components/student/Cards";
import { soLieuHs, diemTrungBinh, tinhHuyHieu } from "@/lib/domain/stats";
import { AvatarPicker } from "@/components/student/AvatarPicker";
import { dangXuat } from "@/lib/actions/auth";
import { btnClass } from "@/components/ui/Button";

export const metadata = { title: "Tài khoản của em" };

// Theo spec 5.9: học sinh KHÔNG tự đổi mật khẩu sau lần đầu; KHÔNG lưu SĐT phụ huynh.
export default async function Page() {
  const p = await requireStudent();
  const { lop, buoi, dong, cd } = await duLieuHs(p);
  const now = new Date();
  const so = soLieuHs(buoi, dong, now);
  const tb = diemTrungBinh(dong, { soChuSo: Number(cd.lam_tron_diem ?? 1) });
  const hh = tinhHuyHieu(dong, now);
  const O = ({ children, mo = false }: { children: React.ReactNode; mo?: boolean }) => (
    <div className={`rounded-xl border border-[#cfdcf3] px-4 py-3 text-lg ${mo ? "bg-slate-100 text-slate-600" : "bg-white"}`}>{children}</div>
  );
  return (
    <PageGrid
      main={
        <Card>
          <h1 className="h-page mb-6">Tài khoản của em</h1>
          <div className="grid gap-6 md:grid-cols-[200px_1fr]">
            <AvatarPicker name={p.ho_ten} avatar={p.avatar} />
            <div className="space-y-3">
              <O>Họ và tên: {p.ho_ten}</O>
              <div className="grid gap-3 sm:grid-cols-2"><O mo>Mã học sinh: {p.ma_hs}</O><O mo>Lớp: {lop?.ten_lop ?? "—"}</O></div>
              <p className="text-sm text-slate-500">Họ tên, mã học sinh và lớp do thầy quản lý. Nếu có sai sót, em báo thầy nhé.</p>
            </div>
          </div>
          <hr className="my-6 border-vien" />
          <h2 className="text-xl font-extrabold">Thành tích</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <ThanhXY nhan="Buổi học đã hoàn thành" xong={so.buoi.xong} tong={so.buoi.tong} />
            <ThanhXY nhan="Bài tập đã nộp" xong={so.bai.xong} tong={so.bai.tong} mau="bg-la-500" />
          </div>
          <p className="mt-3">Điểm trung bình: <b>{tb === null ? "—" : tb.toFixed(1)}</b></p>
          {hh.length === 0 ? <p className="mt-2 text-sm text-slate-600">Chưa có huy hiệu — nộp đúng hạn 5 bài liên tiếp để nhận huy hiệu đầu tiên nhé!</p> : (
            <div className="mt-3 flex flex-wrap gap-3">
              {hh.map((h) => (
                <div key={h.ma} className="flex items-center gap-3 rounded-2xl border border-vien bg-white px-4 py-3">
                  <Award className="h-7 w-7 text-cam-500" /><div><p className="font-bold">{h.ten}</p><p className="text-xs text-slate-500">{h.moTa}</p></div>
                </div>
              ))}
            </div>
          )}
          <hr className="my-6 border-vien" />
          <h2 className="text-xl font-extrabold">Mật khẩu</h2>
          <p className="mt-2 text-slate-600">Em đã đặt mật khẩu riêng ở lần đăng nhập đầu tiên. Nếu quên mật khẩu, bấm <b>&quot;Quên mật khẩu?&quot;</b> ở trang đăng nhập để thầy cấp lại.</p>
          <form action={dangXuat} className="mt-6"><button className={btnClass("primary", "lg", "w-full")}><LogOut className="h-5 w-5" /> Đăng xuất</button></form>
        </Card>
      }
      aside={<>
        <Card>
          <h2 className="h-card mb-3 flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-xanh-600" /> Bảo mật tài khoản</h2>
          <ul className="list-disc space-y-2 pl-5 text-[1.05rem]">
            <li>Không chia sẻ tài khoản</li>
            <li>Đăng xuất khi dùng máy chung</li>
            <li>Quên mật khẩu thì nhờ thầy cấp lại</li>
          </ul>
        </Card>
      </>}
    />
  );
}
