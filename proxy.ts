// =====================================================================
// proxy.ts (Next.js 16; trước đây gọi là middleware.ts)
// Làm mới phiên đăng nhập Supabase và chuyển người chưa đăng nhập về trang đăng nhập
// (khu giáo viên /gv/* → /giao-vien; còn lại → /dang-nhap).
// Dùng getClaims(): kiểm chữ ký phiên ngay tại server (khóa ký bất đối xứng) thay vì
// gọi máy chủ Auth mỗi lần như getUser() → mỗi lần chuyển trang nhanh hơn.
// Việc kiểm tra vai trò + bắt đổi mật khẩu lần đầu nằm ở layout (lib/auth.ts).
// =====================================================================
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const CONG_KHAI = ["/dang-nhap", "/quen-mat-khau", "/giao-vien", "/api/song"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response; // chưa cấu hình: để trang báo lỗi rõ ràng

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const daDangNhap = !!data?.claims?.sub;
  const path = request.nextUrl.pathname;
  const congKhai = CONG_KHAI.some((p) => path === p || path.startsWith(p + "/"));

  if (!daDangNhap && !congKhai) {
    const to = request.nextUrl.clone();
    to.pathname = path === "/gv" || path.startsWith("/gv/") ? "/giao-vien" : "/dang-nhap";
    to.search = "";
    return NextResponse.redirect(to);
  }
  // Học sinh: việc "tạo thông báo tự động + tự mở buổi theo lịch" chỉ chạy tối đa 15 phút/lần
  // (layout học sinh thấy chưa có cookie này thì mới chạy) → bớt truy vấn mỗi lần chuyển trang.
  if (daDangNhap && !congKhai && !path.startsWith("/gv") && !path.startsWith("/api") && !request.cookies.get(COOKIE_TB)) {
    response.cookies.set(COOKIE_TB, "1", { maxAge: 15 * 60, httpOnly: true, sameSite: "lax", path: "/" });
  }
  return response;
}

const COOKIE_TB = "lms_tb";

export const config = {
  // Bỏ qua file tĩnh và ảnh
  matcher: ["/((?!_next/static|_next/image|favicon.png|apple-touch-icon.png|images/|robots.txt|py-worker.js).*)"],
};
