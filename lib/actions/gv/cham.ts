"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fromVNInput } from "@/lib/domain/time";
import { laVanBanUtf8 } from "@/lib/domain/files";
import { ghiNhatKy } from "@/lib/server/audit";
import { xoaFile } from "@/lib/server/storage";
import { chay, chk, loi, ok, uuid, kiemTraHs } from "./_util";
import type { KQ } from "@/lib/types";

/**
 * Lưu kết quả chấm. hanhDong: 'cham' | 'can_nop_lai' | 'mo_nop_lai'
 * moc: giờ nộp mới nhất lúc thầy mở bài (để phát hiện học sinh vừa nộp bản mới)
 */
export async function luuDiem(input: {
  submissionId: string; diem: number | null; nhanXet: string; hanhDong: "cham" | "can_nop_lai" | "mo_nop_lai";
  moc: string | null; ep?: boolean; hanNopLai?: string | null; chamTabs?: (string | null)[] | null;
}): Promise<KQ> {
  return chay(async (sb) => {
    const { data, error } = await sb.rpc("gv_luu_diem", {
      p_submission: uuid(input.submissionId), p_diem: input.diem, p_nhan_xet: input.nhanXet.slice(0, 2000) || null,
      p_hanh_dong: input.hanhDong, p_moc: input.moc, p_ep: !!input.ep, p_han_nop_lai: fromVNInput(input.hanNopLai ?? "") ?? null,
    });
    if (error) return loi("Chưa lưu được: " + error.message);
    const kq = data as { ok: boolean; loi?: string; xung_dot?: boolean; nop_luc_moi_nhat?: string };
    if (kq.xung_dot) return { ok: false, loi: "Học sinh vừa nộp bản mới hơn.", data: { xungDot: true }, ts: Date.now() };
    if (!kq.ok) return loi(kq.loi ?? "Chưa lưu được.");
    // Phiếu nhiều bài: lưu kết quả ✓/✗ từng bài (học sinh xem lại được bài nào chưa đúng)
    if (Array.isArray(input.chamTabs) && input.hanhDong !== "mo_nop_lai") {
      const ket = input.chamTabs.slice(0, 50).map((x) => (x === "d" || x === "s" ? x : null));
      chk(await sb.from("submissions").update({ cham_tabs: ket }).eq("id", uuid(input.submissionId)));
    }
    revalidatePath("/gv", "layout");
    return ok(input.hanhDong === "cham" ? "Đã lưu điểm" : "Đã yêu cầu nộp lại");
  });
}

/** Thao tác trên ô ma trận / tình hình nộp: miễn nộp, nộp ngoài hệ thống, gia hạn riêng, mở cho nộp lại */
export async function thaoTacO(assignmentId: string, studentId: string, hanhDong: string, giaTri?: string): Promise<KQ> {
  return chay(async (sb) => {
    const a = uuid(assignmentId), s = uuid(studentId);
    if (hanhDong === "mien" || hanhDong === "bo_mien") {
      const mien = hanhDong === "mien";
      chk(await sb.from("student_overrides").upsert({ assignment_id: a, student_id: s, mien_nop: mien, ly_do: mien ? (giaTri ?? "").slice(0, 200) || null : null }));
      await ghiNhatKy(mien ? "mien_nop" : "bo_mien_nop", "student_overrides", `${a}:${s}`, null, { ly_do: giaTri });
      return ok(mien ? "Đã miễn nộp" : "Đã bỏ miễn nộp");
    }
    if (hanhDong === "gia_han") {
      const han = fromVNInput(giaTri ?? "");
      const { data: cu } = await sb.from("student_overrides").select("han_nop_rieng").eq("assignment_id", a).eq("student_id", s).maybeSingle();
      chk(await sb.from("student_overrides").upsert({ assignment_id: a, student_id: s, han_nop_rieng: han }));
      await ghiNhatKy("sua_han", "student_overrides", `${a}:${s}`, { han_nop_rieng: cu?.han_nop_rieng ?? null }, { han_nop_rieng: han });
      return ok(han ? "Đã gia hạn riêng" : "Đã bỏ gia hạn riêng");
    }
    if (hanhDong === "ngoai") {
      const { data: cu } = await sb.from("submissions").select("id").eq("assignment_id", a).eq("student_id", s).maybeSingle();
      if (cu) chk(await sb.from("submissions").update({ trang_thai: "nop_ngoai_he_thong" }).eq("id", cu.id));
      else chk(await sb.from("submissions").insert({ assignment_id: a, student_id: s, trang_thai: "nop_ngoai_he_thong", nguoi_nop: "giao_vien_nop_ho", so_lan_nop: 0 }));
      return ok("Đã đánh dấu: nộp ngoài hệ thống");
    }
    if (hanhDong === "bo_ngoai") {
      const { data: cu } = await sb.from("submissions").select("id, code_text, file_path, diem").eq("assignment_id", a).eq("student_id", s).maybeSingle();
      if (!cu) return ok();
      if (!cu.code_text && !cu.file_path && cu.diem === null) chk(await sb.from("submissions").delete().eq("id", cu.id));
      else chk(await sb.from("submissions").update({ trang_thai: cu.diem !== null ? "da_cham" : "da_nop" }).eq("id", cu.id));
      return ok("Đã bỏ đánh dấu nộp ngoài hệ thống");
    }
    if (hanhDong === "mo_nop_lai") {
      const { data: cu } = await sb.from("submissions").select("id, nop_luc_moi_nhat").eq("assignment_id", a).eq("student_id", s).maybeSingle();
      if (!cu) return loi("Học sinh chưa có bài nộp.");
      const { data, error } = await sb.rpc("gv_luu_diem", { p_submission: cu.id, p_diem: null, p_nhan_xet: null, p_hanh_dong: "mo_nop_lai", p_moc: null, p_ep: true, p_han_nop_lai: fromVNInput(giaTri ?? "") });
      if (error || !(data as { ok: boolean }).ok) return loi("Chưa mở được.");
      return ok("Đã mở cho nộp lại");
    }
    return loi("Thao tác không hợp lệ.");
  });
}

/** Thầy nộp hộ (dán code của học sinh) */
export async function nopHo(assignmentId: string, studentId: string, code: string): Promise<KQ> {
  return chay(async (sb) => {
    await kiemTraHs(sb, [studentId]); // khóa service_role bỏ qua RLS → tự kiểm tra
    const bytes = new TextEncoder().encode(code);
    if (!code.trim()) return loi("Chưa có nội dung.");
    if (bytes.length > 1024 * 1024 || !laVanBanUtf8(bytes)) return loi("Nội dung không hợp lệ hoặc quá dài.");
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("hs_nop_bai", {
      p_student: uuid(studentId), p_assignment: uuid(assignmentId), p_code: code, p_file_path: null,
      p_ten_goc: null, p_kich_thuoc: bytes.length, p_mime: "text/x-python", p_nguoi_nop: "giao_vien_nop_ho",
    });
    const kq = data as { ok: boolean; loi?: string; file_cu?: string } | null;
    if (error || !kq?.ok) return loi(kq?.loi ?? "Chưa nộp hộ được.");
    if (kq.file_cu) await xoaFile("submissions", [kq.file_cu]);
    await ghiNhatKy("nop_ho", "submissions", `${assignmentId}:${studentId}`);
    return ok("Đã nộp hộ");
  });
}

/** "Đã hỗ trợ": tắt cờ Em chưa làm được */
export async function daHoTro(assignmentId: string, studentId: string): Promise<KQ> {
  return chay(async (sb) => {
    chk(await sb.from("student_flags").update({ da_ho_tro: true, ho_tro_luc: new Date().toISOString(), chua_lam_duoc: false })
      .eq("assignment_id", uuid(assignmentId)).eq("student_id", uuid(studentId)));
    return ok("Đã đánh dấu đã hỗ trợ");
  });
}

/** Ghi nhận "Đã nhắc phụ huynh" */
export async function daNhacPhuHuynh(studentId: string, assignmentIds: string[], noiDung: string): Promise<KQ> {
  return chay(async (sb) => {
    chk(await sb.from("parent_reminders").insert({ student_id: uuid(studentId), assignment_ids: assignmentIds.map(uuid), noi_dung: noiDung.slice(0, 2000) }));
    revalidatePath("/gv/bao-cao");
    return ok("Đã ghi nhận: đã nhắc phụ huynh");
  });
}

export async function boDaNhac(reminderId: string): Promise<KQ> {
  return chay(async (sb) => { chk(await sb.from("parent_reminders").delete().eq("id", uuid(reminderId))); return ok("Đã bỏ đánh dấu"); });
}

/** Nhập điểm hàng loạt (Contest / Kiểm tra làm ngoài hệ thống) */
export async function nhapDiem(assignmentId: string, ds: { studentId: string; diem: number; nhanXet?: string }[]): Promise<KQ> {
  return chay(async (sb) => {
    const a = uuid(assignmentId);
    const { data: bt } = await sb.from("assignments").select("diem_toi_da").eq("id", a).single();
    const max = Number(bt?.diem_toi_da ?? 10);
    let n = 0;
    for (const x of ds.slice(0, 500)) {
      if (!(x.diem >= 0 && x.diem <= max)) continue;
      const { data: cu } = await sb.from("submissions").select("id, diem").eq("assignment_id", a).eq("student_id", uuid(x.studentId)).maybeSingle();
      const now = new Date().toISOString();
      if (cu) {
        chk(await sb.from("submissions").update({ diem: x.diem, nhan_xet: x.nhanXet || null, trang_thai: "da_cham", cham_luc: now }).eq("id", cu.id));
        if (cu.diem !== null && Number(cu.diem) !== x.diem) await ghiNhatKy("sua_diem", "submissions", cu.id, { diem: cu.diem }, { diem: x.diem });
      } else {
        chk(await sb.from("submissions").insert({ assignment_id: a, student_id: x.studentId, diem: x.diem, nhan_xet: x.nhanXet || null, trang_thai: "da_cham", cham_luc: now, nguoi_nop: "giao_vien_nop_ho", so_lan_nop: 0 }));
      }
      n++;
    }
    await ghiNhatKy("nhap_diem_excel", "assignments", a, null, { so_hs: n });
    revalidatePath("/gv", "layout");
    return ok(`Đã nhập điểm cho ${n} học sinh`);
  });
}
