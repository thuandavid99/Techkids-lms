import { SubNav } from "./SubNav";

/** Thanh tab chung cho MỌI trang của một lớp (menu "Lớp học") — đổi lớp ở ô chọn lớp trên cùng */
export function SubNavLop({ id }: { id: string }) {
  const b = `/gv/lop/${id}`;
  return (
    <SubNav items={[
      { href: b, label: "Ma trận tiến độ", exact: true },
      { href: `${b}/lich`, label: "Lịch & mở buổi" },
      { href: `${b}/tinh-hinh`, label: "Tình hình nộp" },
      { href: `/gv/hoc-sinh?lop=${id}`, label: "Học sinh" },
      { href: `/gv/bai-tap?lop=${id}`, label: "Bài tập", exact: true },
      { href: `/gv/bao-cao?lop=${id}`, label: "Nhắc phụ huynh", exact: true },
      { href: `/gv/bao-cao/bang-diem?lop=${id}`, label: "Bảng điểm" },
      { href: `${b}/thong-bao`, label: "Đăng thông báo" },
    ]} />
  );
}
