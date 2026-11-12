// =====================================================================
// THƯƠNG HIỆU — đổi tên/slogan/hình ở MỘT chỗ này.
// Hình minh họa nằm trong public/images (WebP nền trong suốt). Muốn thay:
// chép file mới (.webp/.png nền trong suốt) vào đó rồi sửa đường dẫn trong IMG bên dưới.
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
  // Đã tách nền (trong suốt), làm mềm mép, nén WebP (12/11/2026) — nhẹ hơn ~9 lần so với PNG cũ
  logo: "/images/logo-circle.webp",          // logo tròn, dùng được trên nền tối (menu) và nền sáng
  logoRobot: "/images/logo-circle.webp",
  sidebarRocket: "/images/mascot-sidebar.webp",
  hero: "/images/mascot-hero.webp",
  login: "/images/login-illustration.webp",
  school: "/images/school.svg",              // vẽ lại bằng SVG (ảnh cũ quá nhỏ, bị cắt)
  avatar: "/images/default-avatar.webp",
  avatarNu: "/images/avatar-nu.svg",
  celebrate: "/images/robot-celebrate.webp",
  tablet: "/images/robot-tablet.webp",
  clipboard: "/images/robot-clipboard.webp",
  clipboardGv: "/images/robot-clipboard-gv.webp", // dùng trên nền tối (trang /giao-vien)
  cheer: "/images/robot-cheer.webp",
  books: "/images/robot-books.webp",
  check: "/images/robot-clipboard.webp",     // ảnh "robot cầm bảng" cũ bị cắt mất bảng → dùng robot cầm bảng kẹp
  trophy: "/images/robot-trophy.webp",
  shield: "/images/robot-shield.webp",
  laptop: "/images/robot-laptop.webp",
  laptopSmall: "/images/robot-laptop-small.webp",
} as const;
