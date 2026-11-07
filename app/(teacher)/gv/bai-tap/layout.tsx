import { SubNav } from "@/components/teacher/SubNav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <SubNav items={[
        { href: "/gv/bai-tap", label: "Tất cả bài tập", exact: true },
        { href: "/gv/bai-tap/hang-doi", label: "Hàng đợi chấm & Cần hỗ trợ" },
        { href: "/gv/bai-tap/nhap-diem", label: "Nhập điểm từ Excel" },
      ]} />
      {children}
    </div>
  );
}
