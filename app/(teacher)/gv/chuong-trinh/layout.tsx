import { SubNav } from "@/components/teacher/SubNav";
import { getProfile, laQuanTri } from "@/lib/auth";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const qt = laQuanTri(await getProfile());
  return (
    <div>
      <SubNav items={qt ? [
        { href: "/gv/chuong-trinh", label: "Chương trình (PPCT)", exact: true },
        { href: "/gv/chuong-trinh/nhap-excel", label: "Nhập từ Excel" },
        { href: "/gv/chuong-trinh/ap-dung", label: "Áp dụng cho lớp" },
        { href: "/gv/chuong-trinh/kho-hoc-lieu", label: "Kho học liệu" },
      ] : [
        // Giáo viên thường: xem chương trình, áp dụng cho lớp mình, xem kho học liệu
        { href: "/gv/chuong-trinh", label: "Chương trình (PPCT)", exact: true },
        { href: "/gv/chuong-trinh/ap-dung", label: "Áp dụng cho lớp mình" },
        { href: "/gv/chuong-trinh/kho-hoc-lieu", label: "Kho học liệu" },
      ]} />
      {children}
    </div>
  );
}
