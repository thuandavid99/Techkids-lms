// =====================================================================
// proxy.ts (Next.js 16; trước đây gọi là middleware.ts)
// Làm mới phiên đăng nhập Supabase và chuyển người chưa đăng nhập về /dang-nhap.
// Việc kiểm tra vai trò + bắt đổi mật khẩu lần đầu nằm ở layout (lib/auth.ts).
// =====================================================================
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const CONG_KHAI = ["/dang-nhap", "/quen-mat-khau"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const congKhai = CONG_KHAI.some((p) => path === p || path.startsWith(p + "/"));

  if (!user && !congKhai) {
    const to = request.nextUrl.clone();
    to.pathname = "/dang-nhap";
    to.search = "";
    return NextResponse.redirect(to);
  }
  return response;
}

export const config = {
  // Bỏ qua file tĩnh và ảnh
  matcher: ["/((?!_next/static|_next/image|favicon.png|apple-touch-icon.png|images/|robots.txt).*)"],
};
