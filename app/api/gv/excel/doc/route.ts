import { NextResponse, type NextRequest } from "next/server";
import { getProfile, laGiaoVien } from "@/lib/auth";
import { docCsv, docXlsx } from "@/lib/server/excel";
import { layDuoi, laVanBanUtf8 } from "@/lib/domain/files";

// Đọc file Excel/CSV giáo viên tải lên (nhập PPCT, học sinh, điểm) → trả về dòng thô để xem trước.
// Chưa ghi gì vào database ở bước này.
export async function POST(req: NextRequest) {
  const p = await getProfile();
  if (!laGiaoVien(p)) return NextResponse.json({ loi: "Không có quyền." }, { status: 403 });
  const fd = await req.formData();
  const f = fd.get("file");
  if (!(f instanceof File)) return NextResponse.json({ loi: "Chưa chọn file." }, { status: 400 });
  if (f.size > 4 * 1024 * 1024) return NextResponse.json({ loi: "File quá lớn (tối đa 4 MB)." }, { status: 400 });
  const duoi = layDuoi(f.name);
  const buf = await f.arrayBuffer();
  const dau = new Uint8Array(buf.slice(0, 8));
  try {
    if (duoi === "xlsx") {
      if (!(dau[0] === 0x50 && dau[1] === 0x4b)) return NextResponse.json({ loi: "File không phải .xlsx hợp lệ. Nếu là .xls cũ, mở bằng Excel và Lưu thành .xlsx." }, { status: 400 });
      return NextResponse.json({ sheets: await docXlsx(buf) });
    }
    if (duoi === "csv") {
      const b = new Uint8Array(buf);
      if (!laVanBanUtf8(b)) return NextResponse.json({ loi: "File CSV cần lưu dạng UTF-8 (Excel: Lưu thành → CSV UTF-8)." }, { status: 400 });
      return NextResponse.json({ sheets: docCsv(new TextDecoder().decode(b)) });
    }
    return NextResponse.json({ loi: "Chỉ nhận file .xlsx hoặc .csv." }, { status: 400 });
  } catch {
    return NextResponse.json({ loi: "Không đọc được file. File có thể bị hỏng hoặc đang được bảo vệ bằng mật khẩu." }, { status: 400 });
  }
}
