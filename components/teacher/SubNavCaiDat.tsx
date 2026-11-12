import { SubNav } from "./SubNav";

/** Tab chung của khu "Cài đặt" (menu gọn: Giáo viên, Nhật ký, Thùng rác, Hướng dẫn đều nằm ở đây) */
export function SubNavCaiDat({ qt }: { qt: boolean }) {
  const items = qt
    ? [
        { href: "/gv/cai-dat?tab=chung", label: "Chung" },
        { href: "/gv/cai-dat?tab=mau", label: "Mẫu nhận xét & tin nhắn" },
        { href: "/gv/cai-dat?tab=tai-khoan", label: "Tài khoản & sao lưu" },
        { href: "/gv/giao-vien", label: "Giáo viên" },
        { href: "/gv/cai-dat/nhat-ky", label: "Nhật ký" },
        { href: "/gv/cai-dat/thung-rac", label: "Thùng rác" },
        { href: "/gv/huong-dan", label: "Hướng dẫn" },
      ]
    : [
        { href: "/gv/cai-dat", label: "Tài khoản", exact: true },
        { href: "/gv/huong-dan", label: "Hướng dẫn" },
      ];
  return <SubNav items={items} />;
}
