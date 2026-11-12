"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertStudent } from "@/lib/auth";
import { DUOI_CHO_PHEP, GIOI_HAN_MB, layDuoi, laVanBanUtf8 } from "@/lib/domain/files";
import { capLinkTaiLen, tenLuuAnToan, xacMinhFile, xoaFile } from "@/lib/server/storage";
import { coNoiDung, ghiNop, linkHopLe, type NoiDungNop } from "@/lib/domain/bai-nop";
import type { KQ } from "@/lib/types";

const UUID = /^[0-9a-f-]{36}$/i;
const loi = (s: string): KQ => ({ ok: false, loi: s, ts: Date.now() });

async function baiCuaEm(assignmentId: string) {
  const p = await assertStudent();
  if (!UUID.test(assignmentId)) throw new Error("Bài tập không hợp lệ.");
  const sb = await createClient();
  const { data: a } = await sb.from("v_bai_tap_hieu_luc").select("assignment_id, loai_nop, class_id")
    .eq("assignment_id", assignmentId).eq("class_id", p.class_id ?? "").maybeSingle();
  if (!a) throw new Error("Không tìm thấy bài tập (có thể bài chưa mở).");
  return { p, sb, a: a as { assignment_id: string; loai_nop: string; class_id: string } };
}

/** Tự lưu nháp code (gọi mỗi vài giây khi em gõ) */
export async function luuNhap(assignmentId: string, code: string): Promise<KQ> {
  try {
    const { p, sb } = await baiCuaEm(assignmentId);
    if (code.length > 1_000_000) return loi("Code quá dài.");
    const saved_at = new Date().toISOString();
    const { error } = await sb.from("drafts").upsert({ assignment_id: assignmentId, student_id: p.id, code_text: code, saved_at });
    if (error) return loi("Chưa lưu được nháp.");
    return { ok: true, data: saved_at };
  } catch (e) { return loi((e as Error).message); }
}

/** Nộp bài dạng code (soạn trực tiếp hoặc file .py/.txt đã đọc thành chữ). Giờ nộp do DATABASE ghi. */
export async function nopBaiCode(assignmentId: string, noiDung: string | NoiDungNop, tenGoc?: string): Promise<KQ> {
  try {
    const { p, a } = await baiCuaEm(assignmentId);
    // noiDung: code thuần (bài 1 ô / file .py) hoặc { tabs, link } (bài nhiều tab / nộp bằng link)
    const nd: NoiDungNop = typeof noiDung === "string" ? { tabs: [noiDung], link: null } : { tabs: (noiDung.tabs ?? []).slice(0, 50).map(String), link: noiDung.link ? String(noiDung.link).trim() : null };
    if (nd.link && !linkHopLe(nd.link)) return loi("Đường link chưa đúng (cần bắt đầu bằng https://).");
    if (a.loai_nop === "file" && !tenGoc && !nd.link) return loi("Bài này cần nộp file hoặc dán link bài làm.");
    if (tenGoc && !DUOI_CHO_PHEP.code.includes(layDuoi(tenGoc))) return loi("Chỉ nhận file .py hoặc .txt.");
    if (!coNoiDung(nd)) return loi("Em chưa viết code nào.");
    const code = ghiNop(nd);
    const bytes = new TextEncoder().encode(code);
    if (bytes.length > GIOI_HAN_MB.code * 1024 * 1024) return loi(`Code quá dài (tối đa ${GIOI_HAN_MB.code} MB).`);
    if (!laVanBanUtf8(bytes)) return loi("Nội dung không phải văn bản hợp lệ.");
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("hs_nop_bai", {
      p_student: p.id, p_assignment: assignmentId, p_code: code, p_file_path: null,
      p_ten_goc: tenGoc ?? null, p_kich_thuoc: bytes.length, p_mime: nd.link && !nd.tabs.some((t) => t.trim()) ? "text/uri-list" : "text/x-python", p_nguoi_nop: "hs",
    });
    if (error) return loi("Chưa nộp được. Kiểm tra mạng rồi thử lại.");
    const kq = data as { ok: boolean; loi?: string; nop_luc?: string; file_cu?: string };
    if (!kq.ok) return loi(kq.loi ?? "Chưa nộp được.");
    if (kq.file_cu) await xoaFile("submissions", [kq.file_cu]);
    revalidatePath("/", "layout");
    return { ok: true, tb: "Nộp bài thành công!", data: kq.nop_luc, ts: Date.now() };
  } catch (e) { return loi((e as Error).message); }
}

/** Bước 1 nộp file: xin đường dẫn ký để tải file thẳng lên kho */
export async function xinLinkNopFile(assignmentId: string, tenGoc: string, kichThuoc: number): Promise<KQ> {
  try {
    const { p, a } = await baiCuaEm(assignmentId);
    if (a.loai_nop === "code" || a.loai_nop === "ngoai_he_thong") return loi("Bài này không nộp bằng file.");
    const duoi = layDuoi(tenGoc);
    if (!DUOI_CHO_PHEP.bai_nop_file.includes(duoi)) return loi(`Loại file không được hỗ trợ. Chỉ nhận: ${DUOI_CHO_PHEP.bai_nop_file.map((d) => "." + d).join(", ")}.`);
    if (kichThuoc > GIOI_HAN_MB.bai_nop_file * 1024 * 1024) return loi(`File quá lớn (tối đa ${GIOI_HAN_MB.bai_nop_file} MB).`);
    const path = tenLuuAnToan(`${a.class_id}/${p.ma_hs}/${assignmentId}`, tenGoc);
    const link = await capLinkTaiLen("submissions", path);
    return { ok: true, data: link };
  } catch (e) { return loi((e as Error).message); }
}

/** Bước 2 nộp file: server kiểm tra nội dung thật rồi mới ghi nhận bài nộp */
export async function xacNhanNopFile(assignmentId: string, path: string, tenGoc: string): Promise<KQ> {
  try {
    const { p, a } = await baiCuaEm(assignmentId);
    const tienTo = `${a.class_id}/${p.ma_hs}/${assignmentId}/`;
    if (!path.startsWith(tienTo) || path.includes("..")) return loi("Đường dẫn file không hợp lệ.");
    const kt = await xacMinhFile("submissions", path, tenGoc, "bai_nop_file");
    if (!kt.ok) return loi(kt.loi);
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("hs_nop_bai", {
      p_student: p.id, p_assignment: assignmentId, p_code: null, p_file_path: path,
      p_ten_goc: tenGoc.slice(0, 200), p_kich_thuoc: kt.size, p_mime: kt.mime, p_nguoi_nop: "hs",
    });
    const kq = data as { ok: boolean; loi?: string; nop_luc?: string; file_cu?: string } | null;
    if (error || !kq?.ok) {
      await xoaFile("submissions", [path]);
      return loi(kq?.loi ?? "Chưa nộp được. Thử lại nhé.");
    }
    if (kq.file_cu) await xoaFile("submissions", [kq.file_cu]);
    revalidatePath("/", "layout");
    return { ok: true, tb: "Nộp bài thành công!", data: kq.nop_luc, ts: Date.now() };
  } catch (e) { return loi((e as Error).message); }
}

/** Tích / bỏ tích "Em chưa làm được bài này" (kèm ghi chú ≤ 200 ký tự) */
export async function datCoChuaLamDuoc(assignmentId: string, chuaLamDuoc: boolean, ghiChu: string): Promise<KQ> {
  try {
    const { p, sb } = await baiCuaEm(assignmentId);
    const note = ghiChu.trim().slice(0, 200) || null;
    const { error } = await sb.from("student_flags").upsert({
      assignment_id: assignmentId, student_id: p.id, chua_lam_duoc: chuaLamDuoc, ghi_chu: note,
      danh_dau_luc: new Date().toISOString(), da_ho_tro: false, ho_tro_luc: null,
    });
    if (error) return loi("Bài đã chấm hoặc chưa mở nên không đánh dấu được.");
    revalidatePath("/", "layout");
    return { ok: true, tb: chuaLamDuoc ? "Đã báo thầy: em chưa làm được bài này" : "Đã bỏ đánh dấu", ts: Date.now() };
  } catch (e) { return loi((e as Error).message); }
}

export async function doiAvatar(avatar: string): Promise<KQ> {
  const sb = await createClient();
  const { error } = await sb.rpc("hs_doi_avatar", { p_avatar: avatar });
  revalidatePath("/", "layout");
  return error ? loi("Chưa đổi được ảnh đại diện.") : { ok: true, tb: "Đã đổi ảnh đại diện", ts: Date.now() };
}
