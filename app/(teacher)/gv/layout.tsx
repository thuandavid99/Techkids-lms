import { getTeacherOrNull } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { lopDangChon } from "@/lib/server/lop";
import { Sidebar, type NavItem } from "@/components/layout/Sidebar";
import { ClassSelect, Bell_, UserMenu } from "@/components/layout/Topbar";
import { KhongCoQuyen } from "@/components/ui/States";

// Sidebar giáo viên: đúng 7 mục (spec 12.5); các màn khác là trang con / tab
const MENU: NavItem[] = [
  { href: "/gv", label: "Tổng quan", icon: "home", exact: true },
  { href: "/gv/lop", label: "Quản lý lớp", icon: "lop" },
  { href: "/gv/bai-tap", label: "Bài tập", icon: "bai" },
  { href: "/gv/hoc-sinh", label: "Học sinh", icon: "hs" },
  { href: "/gv/bao-cao", label: "Báo cáo", icon: "kq" },
  { href: "/gv/chuong-trinh", label: "Chương trình học", icon: "ct" },
  { href: "/gv/cai-dat", label: "Cài đặt", icon: "caidat" },
];

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const p = await getTeacherOrNull();
  if (!p) return <div className="p-4"><KhongCoQuyen /></div>;
  if (p.must_change_password) {
    const { redirect } = await import("next/navigation");
    redirect("/doi-mat-khau-lan-dau");
  }
  const sb = await createClient();
  const [{ lops, lop }, { count }] = await Promise.all([
    lopDangChon(sb),
    sb.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", p.id).eq("da_doc", false),
  ]);
  return (
    <div className="lg:flex">
      <Sidebar items={MENU} />
      <div className="min-w-0 flex-1 px-4 pb-10 pt-3 sm:px-6 lg:px-8">
        <header className="no-print mb-5 flex items-center justify-between gap-3 pl-14 lg:pl-0">
          <ClassSelect lops={lops.map((l) => ({ id: l.id, ten_lop: l.ten_lop }))} current={lop?.id ?? null} />
          <div className="flex items-center gap-2">
            <Bell_ count={count ?? 0} href="/gv/thong-bao" />
            <UserMenu name={p.ho_ten} avatar={p.avatar} laGv />
          </div>
        </header>
        <main id="noi-dung">{children}</main>
      </div>
    </div>
  );
}
