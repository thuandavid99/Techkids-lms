"use server";
import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth";
import { fromVNInput, addDays } from "@/lib/domain/time";
import { buoiLop } from "@/lib/server/data";
import { ghiNhatKy } from "@/lib/server/audit";
import { chay, chk, loi, ok, str, uuid } from "./_util";
import type { KQ } from "@/lib/types";

/** Thêm / sửa lớp */
export async function luuLop(_: KQ, fd: FormData): Promise<KQ> {
  return chay(async (sb) => {
    const id = str(fd, "id");
    const ten = str(fd, "ten_lop", 50);
    const namHoc = str(fd, "nam_hoc", 20);
    if (!ten) return loi("Nhập tên lớp.");
    if (id) {
      chk(await sb.from("classes").update({ ten_lop: ten, nam_hoc: namHoc }).eq("id", uuid(id)));
    } else {
      const { data } = chk(await sb.from("classes").insert({ ten_lop: ten, nam_hoc: namHoc || "2026-2027" }).select("id").single());
      // Gán giáo viên phụ trách (MVP: mọi giáo viên)
      const { data: gvs } = await sb.from("profiles").select("id").eq("vai_tro", "giao_vien").is("deleted_at", null);
      if (gvs?.length && data) await sb.from("class_teachers").insert(gvs.map((g) => ({ class_id: data.id, teacher_id: g.id })));
    }
    revalidatePath("/gv", "layout");
    return ok(id ? "Đã lưu lớp" : "Đã thêm lớp");
  });
}

export async function luuTruLop(id: string, luuTru: boolean): Promise<KQ> {
  return chay(async (sb) => {
    chk(await sb.from("classes").update({ archived: luuTru }).eq("id", uuid(id)));
    revalidatePath("/gv", "layout");
    return ok(luuTru ? "Đã lưu trữ lớp" : "Đã bỏ lưu trữ");
  });
}

export async function xoaLop(id: string): Promise<KQ> {
  return chay(async (sb) => {
    chk(await sb.from("classes").update({ deleted_at: new Date().toISOString() }).eq("id", uuid(id)));
    await ghiNhatKy("xoa", "classes", id);
    revalidatePath("/gv", "layout");
    return ok("Đã chuyển lớp vào thùng rác");
  });
}

/** Gán giáo viên phụ trách lớp */
export async function ganGiaoVien(classId: string, teacherIds: string[]): Promise<KQ> {
  return chay(async (sb) => {
    const c = uuid(classId);
    chk(await sb.from("class_teachers").delete().eq("class_id", c));
    if (teacherIds.length) chk(await sb.from("class_teachers").insert(teacherIds.map((t) => ({ class_id: c, teacher_id: uuid(t) }))));
    return ok("Đã lưu giáo viên phụ trách");
  });
}

/** Cập nhật tình trạng một buổi trong lớp: ngày học, hiện/ẩn, hẹn giờ mở, đã dạy, ghi chú */
export async function capNhatBuoiLop(classId: string, lessonId: string, v: { ngay_hoc?: string | null; hien_thi?: boolean; ngay_mo?: string | null; da_day?: boolean; ghi_chu?: string }): Promise<KQ> {
  return chay(async (sb) => {
    const patch: Record<string, unknown> = {};
    if (v.ngay_hoc !== undefined) patch.ngay_hoc = v.ngay_hoc && /^\d{4}-\d{2}-\d{2}$/.test(v.ngay_hoc) ? v.ngay_hoc : null;
    if (v.hien_thi !== undefined) patch.hien_thi = v.hien_thi;
    if (v.ngay_mo !== undefined) patch.ngay_mo = fromVNInput(v.ngay_mo);
    if (v.da_day !== undefined) patch.da_day = v.da_day;
    if (v.ghi_chu !== undefined) patch.ghi_chu = v.ghi_chu.slice(0, 500) || null;
    chk(await sb.from("class_lessons").upsert({ class_id: uuid(classId), lesson_id: uuid(lessonId), ...patch }));
    if (v.hien_thi === false) await ghiNhatKy("an", "class_lessons", `${classId}:${lessonId}`);
    revalidatePath("/gv", "layout");
    return ok("Đã lưu");
  });
}

/** Dời lịch: các buổi TỪ buổi đã chọn trở đi cộng thêm N ngày */
export async function doiLich(classId: string, tuLessonId: string, soNgay: number): Promise<KQ> {
  return chay(async (sb) => {
    if (!Number.isInteger(soNgay) || Math.abs(soNgay) > 365) return loi("Số ngày không hợp lệ.");
    const c = uuid(classId);
    const ds = await buoiLop(sb, c); // thứ tự chuẩn: module → buổi
    const i = ds.findIndex((x) => x.lesson_id === tuLessonId);
    if (i < 0) return loi("Không tìm thấy buổi.");
    for (const x of ds.slice(i)) if (x.ngay_hoc) chk(await sb.from("class_lessons").update({ ngay_hoc: addDays(x.ngay_hoc, soNgay) }).eq("class_id", c).eq("lesson_id", x.lesson_id));
    await ghiNhatKy("doi_lich", "class_lessons", c, null, { tu_buoi: tuLessonId, so_ngay: soNgay });
    revalidatePath("/gv", "layout");
    return ok(`Đã dời ${ds.length - i} buổi thêm ${soNgay} ngày`);
  });
}

/** Đăng thông báo cho một hoặc nhiều lớp */
export async function dangThongBao(_: KQ, fd: FormData): Promise<KQ> {
  return chay(async (sb) => {
    const nd = str(fd, "noi_dung", 2000);
    const lops = fd.getAll("lop").map(String).filter(Boolean).map(uuid);
    if (!nd) return loi("Chưa có nội dung.");
    if (!lops.length) return loi("Chọn ít nhất một lớp nhận.");
    chk(await sb.from("announcements").insert(lops.map((c) => ({ class_id: c, noi_dung: nd }))));
    revalidatePath("/gv", "layout");
    return ok(`Đã đăng cho ${lops.length} lớp`);
  });
}

export async function suaThongBao(id: string, noiDung: string): Promise<KQ> {
  return chay(async (sb) => {
    if (!noiDung.trim()) return loi("Chưa có nội dung.");
    chk(await sb.from("announcements").update({ noi_dung: noiDung.slice(0, 2000) }).eq("id", uuid(id)));
    return ok("Đã sửa thông báo");
  });
}

export async function xoaThongBao(id: string): Promise<KQ> {
  return chay(async (sb) => {
    chk(await sb.from("announcements").update({ deleted_at: new Date().toISOString() }).eq("id", uuid(id)));
    await ghiNhatKy("xoa", "announcements", id);
    return ok("Đã xóa thông báo (có thể khôi phục trong Thùng rác)");
  });
}

/** Giáo viên tự lấy id của mình (dùng ở client khi cần) */
export async function toiLa(): Promise<string | null> {
  return (await getProfile())?.id ?? null;
}
