// =====================================================================
// TẠO TÀI KHOẢN GIÁO VIÊN ĐẦU TIÊN
// Cách chạy (trong thư mục dự án, đã có file .env.local):
//   npm run create-teacher -- thaythuan "Thầy Thuận" MatKhauManh123
// Đăng nhập web bằng: thaythuan  +  MatKhauManh123
// Chạy lại với cùng tên đăng nhập = đặt lại mật khẩu giáo viên.
// =====================================================================
import { createClient } from "@supabase/supabase-js";

const [, , tenDangNhap, hoTen, matKhau] = process.argv;
if (!tenDangNhap || !hoTen || !matKhau) {
  console.error('Cách dùng: npm run create-teacher -- <ten_dang_nhap> "<Họ tên>" <mật_khẩu>');
  process.exit(1);
}
if (matKhau.length < 8) { console.error("Mật khẩu giáo viên cần ít nhất 8 ký tự."); process.exit(1); }
if (!/^[A-Za-z0-9._@-]+$/.test(tenDangNhap)) { console.error("Tên đăng nhập chỉ gồm chữ không dấu, số, dấu . _ -"); process.exit(1); }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const domain = process.env.HS_EMAIL_DOMAIN;
if (!url || !key || !domain) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / HS_EMAIL_DOMAIN trong .env.local");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const email = tenDangNhap.includes("@") ? tenDangNhap.toLowerCase() : `${tenDangNhap.toLowerCase()}@${domain}`;
const maHs = tenDangNhap.includes("@") ? tenDangNhap.split("@")[0] : tenDangNhap;

async function timUser(email) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const u = data.users.find((x) => x.email === email);
    if (u) return u;
    if (data.users.length < 200) return null;
  }
  return null;
}

let user = await timUser(email);
if (user) {
  const { error } = await admin.auth.admin.updateUserById(user.id, { password: matKhau });
  if (error) { console.error("Lỗi đặt lại mật khẩu:", error.message); process.exit(1); }
  console.log("Đã có tài khoản này → đã đặt lại mật khẩu.");
} else {
  const { data, error } = await admin.auth.admin.createUser({ email, password: matKhau, email_confirm: true });
  if (error) { console.error("Lỗi tạo tài khoản:", error.message); process.exit(1); }
  user = data.user;
}

const { error: e2 } = await admin.from("profiles").upsert({
  id: user.id, ma_hs: maHs, ho_ten: hoTen, vai_tro: "giao_vien", must_change_password: false, dang_hoc: true, deleted_at: null,
});
if (e2) { console.error("Lỗi lưu hồ sơ (đã chạy các file SQL chưa?):", e2.message); process.exit(1); }

const { data: lops } = await admin.from("classes").select("id");
if (lops?.length) await admin.from("class_teachers").upsert(lops.map((l) => ({ class_id: l.id, teacher_id: user.id, quyen: "chinh" })));

console.log("✅ Xong! Đăng nhập web bằng:");
console.log("   Tên đăng nhập:", maHs);
console.log("   Mật khẩu     :", "(mật khẩu bạn vừa gõ)");
