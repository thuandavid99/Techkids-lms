// Điểm "báo còn sống": GitHub Actions gọi mỗi ngày để dự án Supabase gói miễn phí không bị tạm dừng
// (Supabase tạm dừng dự án miễn phí nếu ~1 tuần ít truy vấn database). Không trả dữ liệu riêng tư.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sb = createClient(supabaseUrl(), supabaseAnonKey(), { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb.rpc("song");
    if (error) return NextResponse.json({ ok: false }, { status: 503 });
    return NextResponse.json({ ok: true, luc: data });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
