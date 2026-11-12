import { docNop, noiThanhFile } from "@/lib/domain/bai-nop";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile, laGiaoVien } from "@/lib/auth";
import { linkTaiVe } from "@/lib/server/storage";
import { tenFileTaiVe } from "@/lib/domain/naming";
import { layDuoi, xemTrucTuyenDuoc } from "@/lib/domain/files";

// =====================================================================
// TẢI / XEM FILE: kiểm tra quyền bằng RLS (đọc được dòng = có quyền),
// rồi chuyển hướng tới đường dẫn ký hết hạn sau 5 phút.
//   /api/tai-ve?loai=tai-lieu&id=...[&xem=1]
//   /api/tai-ve?loai=bai-nop&id=...
//   /api/tai-ve?loai=de-bai&id=...
// =====================================================================
const UUID = /^[0-9a-f-]{36}$/i;
const khong = (msg: string, status = 403) => new NextResponse(msg, { status, headers: { "content-type": "text/plain; charset=utf-8" } });

export async function GET(req: NextRequest) {
  const loai = req.nextUrl.searchParams.get("loai");
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const xem = req.nextUrl.searchParams.get("xem") === "1";
  if (!UUID.test(id)) return khong("Đường dẫn không hợp lệ.", 400);
  const p = await getProfile();
  if (!p) return khong("Bạn cần đăng nhập.", 401);
  const gv = laGiaoVien(p);
  const sb = await createClient();

  if (loai === "tai-lieu") {
    const { data: m } = await sb.from("materials").select("nguon, url, file_path, ten_goc, mime, cho_phep_tai").eq("id", id).maybeSingle();
    if (!m) return khong("Không tìm thấy tài liệu hoặc bạn không có quyền xem.", 404);
    if (m.nguon === "link") return NextResponse.redirect(m.url!);
    const chiXem = !gv && !m.cho_phep_tai;
    if (chiXem && !(xem && xemTrucTuyenDuoc(m.mime ?? m.ten_goc))) return khong("Tài liệu này chỉ cho xem trực tuyến.");
    const url = await linkTaiVe("materials", m.file_path!, xem ? undefined : (m.ten_goc ?? "tai-lieu"));
    return url ? NextResponse.redirect(url) : khong("Không tạo được đường dẫn tải.", 500);
  }

  if (loai === "bai-nop") {
    const { data: s } = await sb.from("submissions").select("file_path, ten_goc, code_text, assignment_id, student_id").eq("id", id).maybeSingle();
    if (!s) return khong("Không tìm thấy bài nộp hoặc bạn không có quyền xem.", 404);
    // Tên file chuẩn: 6A1_HS001_NguyenAn_Bai7.1.py
    let ten = s.ten_goc ?? "bai_nop";
    if (gv) {
      const [{ data: hs }, { data: a }] = await Promise.all([
        sb.from("profiles").select("ma_hs, ho_ten, class_id, classes!profiles_class_id_fkey(ten_lop)").eq("id", s.student_id).maybeSingle(),
        sb.from("assignments").select("ma").eq("id", s.assignment_id).maybeSingle(),
      ]);
      const lop = (hs?.classes as unknown as { ten_lop: string } | null)?.ten_lop ?? "";
      ten = tenFileTaiVe(lop, hs?.ma_hs ?? "", hs?.ho_ten ?? "", a?.ma ?? "", layDuoi(s.ten_goc ?? "") || (s.file_path ? layDuoi(s.file_path) : "py"));
    }
    if (!s.file_path) {
      // Bài nộp dạng code: trả về file văn bản
      return new NextResponse(noiThanhFile(docNop(s.code_text)), {
        headers: { "content-type": "text/plain; charset=utf-8", "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(ten.replace(/\.[^.]+$/, "") + ".py")}` },
      });
    }
    const url = await linkTaiVe("submissions", s.file_path, xem ? undefined : ten);
    return url ? NextResponse.redirect(url) : khong("Không tạo được đường dẫn tải.", 500);
  }

  if (loai === "de-bai") {
    const { data: f } = await sb.from("assignment_files").select("file_path, ten_goc").eq("id", id).maybeSingle();
    if (!f) return khong("Không tìm thấy file đề.", 404);
    const url = await linkTaiVe("assignment-files", f.file_path, xem ? undefined : f.ten_goc);
    return url ? NextResponse.redirect(url) : khong("Không tạo được đường dẫn tải.", 500);
  }
  return khong("Loại tải không hợp lệ.", 400);
}
