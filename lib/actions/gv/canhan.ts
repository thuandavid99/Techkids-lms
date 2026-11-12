"use server";
// CÁ NHÂN HÓA TỪNG HỌC SINH — chỉ ghi "ngoại lệ" cho em được chọn; lớp và các em khác không bị ảnh hưởng.
// (Gia hạn / miễn nộp riêng dùng thaoTacO() trong cham.ts.)
import { revalidatePath } from "next/cache";
import type { KQ } from "@/lib/types";
import { chay, chk, ok, loi, uuid, kiemTraHs } from "./_util";
import { ghiNhatKy } from "@/lib/server/audit";

/** Mở (hoặc thu hồi) một buổi RIÊNG cho một em — học bù khi nghỉ, hoặc học vượt */
export async function moBuoiRieng(studentId: string, lessonId: string, mo: boolean): Promise<KQ> {
  return chay(async (sb) => {
    const [s] = await kiemTraHs(sb, [studentId]);
    if (!s) return loi("Không tìm thấy học sinh trong lớp của thầy.");
    const l = uuid(lessonId);
    if (mo) chk(await sb.from("student_lesson_access").upsert({ student_id: s, lesson_id: l }));
    else chk(await sb.from("student_lesson_access").delete().eq("student_id", s).eq("lesson_id", l));
    await ghiNhatKy(mo ? "mo_buoi_rieng" : "thu_hoi_buoi_rieng", "student_lesson_access", `${s}:${l}`);
    revalidatePath("/gv", "layout");
    return ok(mo ? "Đã mở buổi riêng cho em" : "Đã thu hồi buổi mở riêng");
  });
}

/** Bài riêng: chiRieng = true → chỉ các em trong danh sách thấy / bị tính bài này. false → giao cả lớp như thường */
export async function datBaiRieng(assignmentId: string, chiRieng: boolean, studentIds: string[]): Promise<KQ> {
  return chay(async (sb) => {
    const a = uuid(assignmentId);
    const { data: bt } = await sb.from("assignments").select("id, ghi_de_cua").eq("id", a).maybeSingle();
    if (!bt) return loi("Không tìm thấy bài tập.");
    const goc = (bt.ghi_de_cua as string | null) ?? a;
    const hs = chiRieng ? await kiemTraHs(sb, studentIds) : [];
    if (chiRieng && !hs.length) return loi("Chọn ít nhất một học sinh cho bài riêng.");
    chk(await sb.from("assignments").update({ chi_rieng: chiRieng }).eq("id", goc));
    // Chỉ thay danh sách các em mà thầy có quyền (RLS) — không đụng học sinh lớp khác
    chk(await sb.from("assignment_students").delete().eq("assignment_id", goc));
    if (hs.length) chk(await sb.from("assignment_students").insert(hs.map((s) => ({ assignment_id: goc, student_id: s }))));
    await ghiNhatKy("bai_rieng", "assignments", goc, null, { chi_rieng: chiRieng, so_hs: hs.length });
    revalidatePath("/gv", "layout");
    return ok(chiRieng ? `Bài riêng: chỉ giao cho ${hs.length} em` : "Bài giao cho cả lớp");
  });
}
