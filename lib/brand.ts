// =====================================================================
// THƯƠNG HIỆU — đổi tên/slogan/hình ở MỘT chỗ này.
// Hình minh họa nằm trong public/images (đã cắt từ bộ mockup). Muốn thay:
// chép file mới đè lên cùng tên (ví dụ public/images/mascot-hero.png).
// =====================================================================
export const BRAND = {
  ten: "TechKids Academy",
  phan1: "Tech",        // phần chữ trắng/navy
  phan2: "Kids",        // phần chữ vàng/cam
  phu: "Academy",
  tagline: "Learn. Code. Grow.",
  slogan: "Học Python thật vui – Vững vàng tương lai!",
  khauHieu: "Học hôm nay - Tỏa sáng ngày mai!",
  loiSidebar: ["Cùng TechKids", "chinh phục", "thế giới Python!"],
  dangNhapTieuDe: "Học Python thật vui!",
  dangNhapPhuDe: "Khám phá lập trình, chinh phục tương lai",
} as const;

export const IMG = {
  logo: "/images/logo-circle.png",
  logoRobot: "/images/logo-robot.png",
  sidebarRocket: "/images/mascot-sidebar.png",
  hero: "/images/mascot-hero.png",
  login: "/images/login-illustration.png",
  school: "/images/school-illustration.png",
  avatar: "/images/default-avatar.png",
  celebrate: "/images/robot-celebrate.png",
  tablet: "/images/robot-tablet.png",
  clipboard: "/images/robot-clipboard.png",
  clipboardGv: "/images/robot-clipboard-gv.png", // bản đã tách nền, dùng trên nền tối (trang /giao-vien)
  cheer: "/images/robot-cheer.png",
  books: "/images/robot-books.png",
  check: "/images/robot-check.png",
  trophy: "/images/robot-trophy.png",
  shield: "/images/robot-shield.png",
  laptop: "/images/robot-laptop.png",
  laptopSmall: "/images/robot-laptop-small.png",
} as const;
