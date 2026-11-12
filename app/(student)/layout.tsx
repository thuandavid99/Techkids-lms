import { cookies } from "next/headers";
import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Sidebar, BottomNav, type NavItem } from "@/components/layout/Sidebar";
import { ClassPill, Bell_, UserMenu } from "@/components/layout/Topbar";

const MENU: NavItem[] = [
  { href: "/", label: "Trang chủ", icon: "home", exact: true },
  { href: "/buoi-hoc", label: "Buổi học", icon: "buoi" },
  { href: "/kho-hoc-lieu", label: "Kho học liệu", icon: "kho" },
  { href: "/bai-tap", label: "Bài tập", icon: "bai" },
  { href: "/ket-qua", label: "Kết quả", icon: "kq" },
  { href: "/cai-dat", label: "Cài đặt", icon: "caidat" },
];
const DUOI: NavItem[] = [MENU[0], MENU[1], MENU[3], MENU[4], MENU[2]];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const p = await requireStudent();
  const sb = await createClient();
  // Sinh thông báo tự động (bài mới, sắp đến hạn 24h) + tự mở buổi theo lịch — không cần tác vụ định kỳ.
  // Chỉ chạy khi chưa có cookie "lms_tb" (proxy.ts đặt cookie sống 15 phút) → không chạy lại mỗi lần chuyển trang.
  if (!(await cookies()).get("lms_tb")) await sb.rpc("hs_tao_thong_bao_tu_dong");
  const [{ count }, { data: lop }] = await Promise.all([
    sb.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", p.id).eq("da_doc", false),
    p.class_id ? sb.from("classes").select("ten_lop").eq("id", p.class_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return (
    <div className="lg:flex">
      <Sidebar items={MENU} />
      <div className="min-w-0 flex-1 px-4 pb-24 pt-3 sm:px-6 lg:px-8 lg:pb-8">
        <header className="no-print mb-5 flex min-w-0 items-center justify-between gap-2 pl-14 sm:gap-3 lg:pl-0">
          <ClassPill ten={lop?.ten_lop ?? "—"} href="/lop-cua-toi" />
          <div className="flex shrink-0 items-center gap-2">
            <Bell_ count={count ?? 0} href="/thong-bao" />
            <UserMenu name={p.ho_ten} avatar={p.avatar} laGv={false} />
          </div>
        </header>
        <main id="noi-dung">{children}</main>
      </div>
      <BottomNav items={DUOI} />
    </div>
  );
}
