import { redirect } from "next/navigation";
import { getTeacherOrNull, laQuanTri, TEN_VAI_TRO } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { lopDangChon } from "@/lib/server/lop";
import { Sidebar, type NavItem } from "@/components/layout/Sidebar";
import { ClassSelect, Bell_, UserMenu } from "@/components/layout/Topbar";
import { KhongCoQuyen } from "@/components/ui/States";

// =====================================================================
// Menu theo VAI TRÒ
//  - Quản trị: đủ 7 mục (spec 12.5) + "Giáo viên" (thêm/khóa GV, gán lớp)
//  - Giáo viên: chỉ lớp mình phụ trách; Chương trình học ở chế độ xem;
//    Cài đặt chỉ có phần cá nhân (đổi mật khẩu)
// =====================================================================
const MENU_QT: NavItem[] = [
  { href: "/gv", label: "Tổng quan", icon: "home", exact: true },
  { href: "/gv/lop", label: "Quản lý lớp", icon: "lop" },
  { href: "/gv/bai-tap", label: "Bài tập", icon: "bai" },
  { href: "/gv/hoc-sinh", label: "Học sinh", icon: "hs" },
  { href: "/gv/bao-cao", label: "Báo cáo", icon: "kq" },
  { href: "/gv/chuong-trinh", label: "Chương trình học", icon: "ct" },
  { href: "/gv/giao-vien", label: "Giáo viên", icon: "gv" },
  { href: "/gv/cai-dat", label: "Cài đặt", icon: "caidat" },
];

const MENU_GV: NavItem[] = [
  { href: "/gv", label: "Tổng quan", icon: "home", exact: true },
  { href: "/gv/lop", label: "Lớp của tôi", icon: "lop" },
  { href: "/gv/bai-tap", label: "Bài tập", icon: "bai" },
  { href: "/gv/hoc-sinh", label: "Học sinh", icon: "hs" },
  { href: "/gv/bao-cao", label: "Báo cáo", icon: "kq" },
  { href: "/gv/chuong-trinh", label: "Chương trình học", icon: "ct" },
  { href: "/gv/cai-dat", label: "Cài đặt", icon: "caidat" },
];

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const p = await getTeacherOrNull();
  if (!p) return <div className="p-4"><KhongCoQuyen /></div>;
  if (p.must_change_password) redirect("/doi-mat-khau-lan-dau");
  const qt = laQuanTri(p);
  const sb = await createClient();
  // Chạy song song: danh sách lớp (RLS tự lọc lớp mình phụ trách) + số thông báo chưa đọc
  const [{ lops, lop }, { count }] = await Promise.all([
    lopDangChon(sb),
    sb.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", p.id).eq("da_doc", false),
  ]);
  return (
    <div className="lg:flex">
      <Sidebar items={qt ? MENU_QT : MENU_GV} nhan={qt ? "Quản trị" : "Giáo viên"} />
      <div className="min-w-0 flex-1 px-4 pb-10 pt-3 sm:px-6 lg:px-8">
        <header className="no-print mb-5 flex items-center justify-between gap-3 pl-14 lg:pl-0">
          <ClassSelect lops={lops.map((l) => ({ id: l.id, ten_lop: l.ten_lop }))} current={lop?.id ?? null} />
          <div className="flex items-center gap-2">
            <Bell_ count={count ?? 0} href="/gv/thong-bao" />
            <UserMenu name={p.ho_ten} avatar={p.avatar} laGv vaiTro={TEN_VAI_TRO[p.vai_tro]} />
          </div>
        </header>
        <main id="noi-dung">{children}</main>
      </div>
    </div>
  );
}
