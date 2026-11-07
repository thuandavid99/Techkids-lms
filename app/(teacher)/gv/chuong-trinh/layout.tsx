import { SubNav } from "@/components/teacher/SubNav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <SubNav items={[
        { href: "/gv/chuong-trinh", label: "Chương trình (PPCT)", exact: true },
        { href: "/gv/chuong-trinh/nhap-excel", label: "Nhập từ Excel" },
        { href: "/gv/chuong-trinh/ap-dung", label: "Áp dụng cho lớp" },
        { href: "/gv/chuong-trinh/kho-hoc-lieu", label: "Kho học liệu" },
      ]} />
      {children}
    </div>
  );
}
