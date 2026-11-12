"use server";
import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth";
import { fromVNInput, addDays } from "@/lib/domain/time";
import { buoiLop } from "@/lib/server/data";
import { ghiNhatKy } from "@/lib/server/audit";
import { chay, chayQt, chk, kiemTraLop, loi, ok, str, uuid } from "./_util";
import type { KQ } from "@/lib/types";

/** Thêm / sửa lớp */
export async function luuLop(_: KQ, fd: FormData): Promise<KQ> {
  return chayQt(async (sb) => {
    const id = str(fd, "id");
    const ten = str(fd, "ten_lop", 50);
    const namHoc = str(fd, "nam_hoc", 20);
    if (!ten) return loi("Nhập tên lớp.");
    if (id) {
      chk(await sb.from("classes").update({ ten_lop: ten, nam_hoc: namHoc }).eq("id", uuid(id)));
    } else {
      const { data } = chk(await sb.from("classes").insert({ ten_lop: ten, nam_hoc: namHoc || "2026-2027" }).select("id").single());
      // Giáo viên phụ trách: chọn trong form (ô "gv"); quản trị luôn thấy mọi lớp nên không cần gán
      const gvs = fd.getAll("gv").map(String).filter((x) => /^[0-9a-f-]{36}$/i.test(x));
      if (gvs.length && data) chk(await sb.from("class_teachers").insert(gvs.map((g) => ({ class_id: data.id, teacher_id: g }))));
    }
    revalidatePath("/gv", "layout");
    return ok(id ? "Đã lưu lớp" : "Đã thêm lớp");
  });
}

export async function luuTruLop(id: string, luuTru: boolean): Promise<KQ> {
  return chayQt(async (sb) => {
    chk(await sb.from("classes").update({ archived: luuTru }).eq("id", uuid(id)));
    revalidatePath("/gv", "layout");
    return ok(luuTru ? "Đã lưu trữ lớp" : "Đã bỏ lưu trữ");
  });
}

export async function xoaLop(id: string): Promise<KQ> {
  return chayQt(async (sb) => {
    chk(await sb.from("classes").update({ deleted_at: new Date().toISOString() }).eq("id", uuid(id)));
    await ghiNhatKy("xoa", "classes", id);
    revalidatePath("/gv", "layout");
    return ok("Đã chuyển lớp vào thùng rác");
  });
}

/** Gán giáo viên phụ trách lớp */
export async function ganGiaoVien(classId: string, teacherIds: string[]): Promise<KQ> {
  return chayQt(async (sb) => {
    const c = uuid(classId);
    chk(await sb.from("class_teachers").delete().eq("class_id", c));
    if (teacherIds.length) chk(await sb.from("class_teachers").insert(teacherIds.map((t) => ({ class_id: c, teacher_id: uuid(t) }))));
    await ghiNhatKy("gan_gv", "class_teachers", c, null, { giao_vien: teacherIds });
    revalidatePath("/gv", "layout");
    return ok("Đã lưu giáo viên phụ trách");
  });
}

/** Cập nhật tình trạng một buổi trong lớp: ngày học, hiện/ẩn, hẹn giờ mở, đã dạy, ghi chú */
export async function capNhatBuoiLop(classId: string, lessonId: string, v: { ngay_hoc?: string | null; hien_thi?: boolean; ngay_mo?: string | null; da_day?: boolean; ghi_chu?: string }): Promise<KQ> {
  return chay(async (sb) => {
    await kiemTraLop(sb, classId);
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
    for (const c of lops) await kiemTraLop(sb, c);
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

// ---------------- MỞ BUỔI BẰNG NÚT GẠT ----------------
/** Gạt mở / khóa một buổi cho lớp. Mở = hiện ngay (bỏ hẹn giờ nếu có). */
export async function gatMoBuoi(classId: string, lessonId: string, mo: boolean): Promise<KQ> {
  return chay(async (sb) => {
    await kiemTraLop(sb, classId);
    const patch = mo ? { hien_thi: true, ngay_mo: null } : { hien_thi: false };
    chk(await sb.from("class_lessons").upsert({ class_id: uuid(classId), lesson_id: uuid(lessonId), ...patch }));
    await ghiNhatKy(mo ? "mo_buoi" : "an", "class_lessons", `${classId}:${lessonId}`);
    revalidatePath("/", "layout");
    return ok(mo ? "Đã mở buổi cho học sinh" : "Đã khóa buổi");
  });
}

/** Lớp nào còn để chế độ cũ "tự mở theo lịch" thì chuyển về "thầy tự mở" (tiến độ giờ tính theo nút Xong buổi) */
async function veThuCong(sb: Parameters<Parameters<typeof chay>[0]>[0], c: string) {
  const { data } = await sb.from("classes").select("che_do_mo").eq("id", c).maybeSingle();
  if ((data as { che_do_mo?: string } | null)?.che_do_mo === "theo_lich") await sb.rpc("gv_dat_che_do_mo", { p_class: c, p_che_do: "thu_cong" });
}

async function capNhatNhieu(sb: Parameters<Parameters<typeof chay>[0]>[0], c: string, ids: string[], patch: Record<string, unknown>) {
  for (let i = 0; i < ids.length; i += 100) {
    chk(await sb.from("class_lessons").update(patch).eq("class_id", c).in("lesson_id", ids.slice(i, i + 100)));
  }
}

/** "Xong buổi này": buổi đang học → Đã học; buổi kế tiếp → Đang học và MỞ cho học sinh. Không đụng tới khóa/mở của buổi vừa xong. */
export async function xongBuoi(classId: string, lessonId: string): Promise<KQ> {
  return chay(async (sb) => {
    const c = uuid(classId);
    await kiemTraLop(sb, c);
    const ds = (await buoiLop(sb, c)).filter((b) => !b.ban_nhap);
    const i = ds.findIndex((b) => !b.da_day);
    if (i < 0 || ds[i].lesson_id !== lessonId) return loi("Tiến độ lớp vừa thay đổi — thầy tải lại trang rồi bấm lại nhé.");
    chk(await sb.from("class_lessons").update({ da_day: true }).eq("class_id", c).eq("lesson_id", ds[i].lesson_id));
    const ke = ds[i + 1];
    if (ke) chk(await sb.from("class_lessons").update({ hien_thi: true, ngay_mo: null }).eq("class_id", c).eq("lesson_id", ke.lesson_id));
    await veThuCong(sb, c);
    await ghiNhatKy("xong_buoi", "class_lessons", `${classId}:${lessonId}`);
    revalidatePath("/", "layout");
    return ok(ke ? "Đã chuyển sang buổi tiếp theo và mở cho học sinh" : "Lớp đã học hết chương trình 🎉");
  });
}

/** "Quay lại": bỏ đánh dấu Đã học của buổi gần nhất (khi lỡ bấm Xong). Giữ nguyên mở/khóa. */
export async function quayLaiBuoi(classId: string): Promise<KQ> {
  return chay(async (sb) => {
    const c = uuid(classId);
    await kiemTraLop(sb, c);
    const ds = (await buoiLop(sb, c)).filter((b) => !b.ban_nhap);
    const truoc = [...ds].reverse().find((b) => b.da_day);
    if (!truoc) return loi("Lớp chưa có buổi nào đã học.");
    chk(await sb.from("class_lessons").update({ da_day: false }).eq("class_id", c).eq("lesson_id", truoc.lesson_id));
    await ghiNhatKy("quay_lai_buoi", "class_lessons", `${classId}:${truoc.lesson_id}`);
    revalidatePath("/", "layout");
    return ok("Đã quay lại 1 buổi");
  });
}

/**
 * Đặt "lớp đang học tới buổi …" (dùng khi lớp áp dụng chương trình giữa chừng, hoặc chỉnh lại tiến độ):
 * các buổi TRƯỚC → Đã học (buổi nào mới được đánh dấu thì mở luôn cho HS; buổi đã học từ trước giữ nguyên mở/khóa),
 * buổi được chọn → Đang học + mở; các buổi SAU → chưa học (giữ nguyên mở/khóa).
 */
export async function datDangHoc(classId: string, lessonId: string): Promise<KQ> {
  return chay(async (sb) => {
    const c = uuid(classId);
    await kiemTraLop(sb, c);
    const ds = (await buoiLop(sb, c)).filter((b) => !b.ban_nhap);
    const i = ds.findIndex((b) => b.lesson_id === lessonId);
    if (i < 0) return loi("Không tìm thấy buổi.");
    const moiXong = ds.slice(0, i).filter((b) => !b.da_day).map((b) => b.lesson_id);
    await capNhatNhieu(sb, c, moiXong, { da_day: true, hien_thi: true, ngay_mo: null });
    chk(await sb.from("class_lessons").update({ da_day: false, hien_thi: true, ngay_mo: null }).eq("class_id", c).eq("lesson_id", ds[i].lesson_id));
    await capNhatNhieu(sb, c, ds.slice(i + 1).filter((b) => b.da_day).map((b) => b.lesson_id), { da_day: false });
    await veThuCong(sb, c);
    await ghiNhatKy("dat_dang_hoc", "class_lessons", `${classId}:${lessonId}`, null, { vi_tri: i + 1 });
    revalidatePath("/", "layout");
    return ok(`Lớp đang học buổi ${i + 1}/${ds.length}; ${i} buổi trước đã mở cho học sinh xem lại`);
  });
}

/** Chế độ mở buổi của lớp: 'thu_cong' (thầy gạt mở) | 'theo_lich' (đến ngày học tự mở) */
export async function datCheDoMo(classId: string, cheDo: "thu_cong" | "theo_lich"): Promise<KQ> {
  return chay(async (sb) => {
    const { data, error } = await sb.rpc("gv_dat_che_do_mo", { p_class: uuid(classId), p_che_do: cheDo });
    if (error) return loi("Chưa lưu được: " + error.message);
    const kq = data as { ok: boolean; loi?: string };
    if (!kq.ok) return loi(kq.loi ?? "Chưa lưu được.");
    revalidatePath("/", "layout");
    return ok(cheDo === "theo_lich" ? "Lớp sẽ tự mở buổi khi đến ngày học" : "Thầy tự gạt mở từng buổi");
  });
}

/** Khóa mọi buổi CHƯA HỌC (sau buổi đang học) — dùng cho lớp cũ trước đây mở hết */
export async function khoaBuoiChuaDay(classId: string): Promise<KQ> {
  return chay(async (sb) => {
    const c = uuid(classId);
    await kiemTraLop(sb, c);
    const ds0 = (await buoiLop(sb, c)).filter((b) => !b.ban_nhap);
    const iDang = ds0.findIndex((b) => !b.da_day);
    // Giữ buổi đang học; khóa các buổi chưa học đang mở
    const ds = ds0.filter((b, j) => !b.da_day && j !== iDang && b.hien_thi);
    for (let i = 0; i < ds.length; i += 100) {
      chk(await sb.from("class_lessons").update({ hien_thi: false }).eq("class_id", c).in("lesson_id", ds.slice(i, i + 100).map((b) => b.lesson_id)));
    }
    await ghiNhatKy("khoa_buoi_chua_day", "class_lessons", c, null, { so_buoi: ds.length });
    revalidatePath("/", "layout");
    return ok(ds.length ? `Đã khóa ${ds.length} buổi chưa dạy` : "Không có buổi nào cần khóa");
  });
}
