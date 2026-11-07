import { ShieldCheck, LogOut } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { IMG } from "@/lib/brand";
import { Card, PageGrid, RobotCard, BrandCard } from "@/components/ui/Card";
import { AvatarPicker } from "@/components/student/AvatarPicker";
import { dangXuat } from "@/lib/actions/auth";
import { btnClass } from "@/components/ui/Button";

export const metadata = { title: "Cài đặt tài khoản" };

// Theo spec 5.9: học sinh KHÔNG tự đổi mật khẩu sau lần đầu; KHÔNG lưu SĐT phụ huynh.
export default async function Page() {
  const p = await requireStudent();
  const sb = await createClient();
  const { data: lop } = p.class_id ? await sb.from("classes").select("ten_lop").eq("id", p.class_id).maybeSingle() : { data: null };
  const O = ({ children, mo = false }: { children: React.ReactNode; mo?: boolean }) => (
    <div className={`rounded-xl border border-[#cfdcf3] px-4 py-3 text-lg ${mo ? "bg-slate-100 text-slate-600" : "bg-white"}`}>{children}</div>
  );
  return (
    <PageGrid
      main={
        <Card>
          <h1 className="h-page mb-6">Cài đặt tài khoản</h1>
          <div className="grid gap-6 md:grid-cols-[200px_1fr]">
            <AvatarPicker name={p.ho_ten} avatar={p.avatar} />
            <div className="space-y-3">
              <O>Họ và tên: {p.ho_ten}</O>
              <div className="grid gap-3 sm:grid-cols-2"><O mo>Mã học sinh: {p.ma_hs}</O><O mo>Lớp: {lop?.ten_lop ?? "—"}</O></div>
              <p className="text-sm text-slate-500">Họ tên, mã học sinh và lớp do thầy quản lý. Nếu có sai sót, em báo thầy nhé.</p>
            </div>
          </div>
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
        <RobotCard img={IMG.shield} title="Mẹo nhỏ" text="Hãy đặt mật khẩu dễ nhớ nhưng an toàn nhé!" />
        <BrandCard />
      </>}
    />
  );
}
