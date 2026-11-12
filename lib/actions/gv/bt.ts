"use server";
import { revalidatePath } from "next/cache";
import { fromVNInput } from "@/lib/domain/time";
import { DUOI_CHO_PHEP, GIOI_HAN_MB, layDuoi } from "@/lib/domain/files";
import { keyBetween } from "@/lib/domain/order";
import { soTrongNhan } from "@/lib/domain/naming";
import { capLinkTaiLen, tenLuuAnToan, xacMinhFile, xoaFile } from "@/lib/server/storage";
import { ghiNhatKy } from "@/lib/server/audit";
import { chay, chk, kiemTraLop, loi, ok, str, bool, uuid } from "./_util";
import { getProfile, laQuanTri } from "@/lib/auth";

const KHONG_QUYEN = "Bạn không có quyền sửa bài tập này (bài chung chỉ quản trị sửa; giáo viên sửa bản riêng cho lớp mình).";
import type { KQ } from "@/lib/types";

const COT = ["ma", "tieu_de", "de_bai", "diem_toi_da", "loai_nop", "cho_nop_tre", "khoa_nop", "tinh_diem", "bat_buoc", "he_so", "hoc_ky", "hien_thi", "so_bai"] as const;

/** Thêm bài tập mới cho buổi (mã tự đặt "số buổi.thứ tự") → trả id để mở trang soạn */
export async function themBaiTap(lessonId: string): Promise<KQ> {
  return chay(async (sb) => {
    const l = uuid(lessonId);
    const [{ data: buoi }, { data: ds }, { data: cd }] = await Promise.all([
      sb.from("lessons").select("nhan_buoi, loai_id, class_id, lesson_types(co_bai_nop_mac_dinh, tinh_diem)").eq("id", l).single(),
      sb.from("assignments").select("thu_tu").eq("lesson_id", l).is("ghi_de_cua", null).order("thu_tu", { ascending: false }),
      sb.from("app_settings").select("value").eq("key", "cho_nop_tre_mac_dinh").maybeSingle(),
    ]);
    const so = soTrongNhan(buoi?.nhan_buoi ?? "")[0] ?? "";
    const lt = buoi?.lesson_types as unknown as { tinh_diem: boolean } | null;
    const { data } = chk(await sb.from("assignments").insert({
      lesson_id: l, ma: so ? `${so}.${(ds?.length ?? 0) + 1}` : String((ds?.length ?? 0) + 1),
      tieu_de: "Bài tập mới", loai_nop: "code", thu_tu: keyBetween(ds?.[0]?.thu_tu ?? null, null),
      cho_nop_tre: cd?.value !== false, tinh_diem: lt?.tinh_diem ?? true,
      class_id: buoi?.class_id ?? null, // buổi riêng của lớp → bài tập cũng thuộc lớp đó
    }).select("id").single());
    revalidatePath("/gv", "layout");
    return ok("Đã thêm bài tập", data!.id);
  });
}

/** Lưu bài tập. pham_vi = "tat_ca" (sửa bản gốc) hoặc id lớp (bản ghi đè riêng lớp đó) */
export async function luuBaiTap(_: KQ, fd: FormData): Promise<KQ> {
  return chay(async (sb) => {
    const id = uuid(fd.get("id"));
    const phamVi = str(fd, "pham_vi") || "tat_ca";
    if (phamVi === "tat_ca" && !laQuanTri(await getProfile())) {
      // Giáo viên thường: chỉ sửa được bài thuộc buổi riêng của lớp mình
      const { data: ok_ } = await sb.rpc("can_edit_assignment", { p_assignment: id });
      if (!ok_) return loi("Chỉ quản trị sửa được bài tập chung. Thầy/cô chọn \"Chỉ lớp …\" để sửa riêng cho lớp mình.");
    }
    if (phamVi !== "tat_ca") await kiemTraLop(sb, phamVi);
    const v = {
      ma: str(fd, "ma", 20), tieu_de: str(fd, "tieu_de", 200), de_bai: str(fd, "de_bai", 20000) || null,
      diem_toi_da: Number(fd.get("diem_toi_da") || 10), loai_nop: str(fd, "loai_nop"),
      cho_nop_tre: bool(fd, "cho_nop_tre"), khoa_nop: bool(fd, "khoa_nop"), tinh_diem: bool(fd, "tinh_diem"),
      bat_buoc: bool(fd, "bat_buoc"), he_so: Number(fd.get("he_so") || 1), hoc_ky: Number(fd.get("hoc_ky") || 1), hien_thi: bool(fd, "hien_thi"),
      so_bai: Math.round(Number(fd.get("so_bai") || 1)),
    };
    if (!v.tieu_de) return loi("Nhập tên bài tập.");
    if (!["code", "file", "ca_hai", "ngoai_he_thong"].includes(v.loai_nop)) return loi("Loại bài nộp không hợp lệ.");
    if (!(v.diem_toi_da > 0 && v.diem_toi_da <= 100)) return loi("Điểm tối đa từ 1 đến 100.");
    if (!(v.he_so > 0 && v.he_so <= 10)) return loi("Hệ số từ 0.1 đến 10.");
    if (![1, 2].includes(v.hoc_ky)) return loi("Học kỳ là 1 hoặc 2.");
    if (!(v.so_bai >= 1 && v.so_bai <= 50)) return loi("Số bài nhỏ từ 1 đến 50.");

    if (phamVi === "tat_ca") {
      const { data: cu } = await sb.from("assignments").select("ma, tieu_de, de_bai, diem_toi_da, loai_nop, cho_nop_tre, khoa_nop, tinh_diem, bat_buoc, he_so, hoc_ky, hien_thi, so_bai").eq("id", id).single();
      chk(await sb.from("assignments").update(v).eq("id", id));
      if (cu && (cu as unknown as Record<string, unknown>).hien_thi !== v.hien_thi && !v.hien_thi) await ghiNhatKy("an", "assignments", id);
      await ghiNhatKy("sua", "assignments", id, cu, v);
    } else {
      const c = uuid(phamVi);
      const { data: base } = await sb.from("assignments").select("lesson_id, thu_tu").eq("id", id).single();
      const { data: cu } = await sb.from("assignments").select("id").eq("ghi_de_cua", id).eq("class_id", c).is("deleted_at", null).maybeSingle();
      if (cu) chk(await sb.from("assignments").update(v).eq("id", cu.id));
      else chk(await sb.from("assignments").insert({ ...v, lesson_id: base!.lesson_id, thu_tu: base!.thu_tu, ghi_de_cua: id, class_id: c }));
      await ghiNhatKy("sua_rieng_lop", "assignments", id, null, { lop: c, ...v });
    }
    // Tùy chọn: báo cho lớp biết đề/hạn đã thay đổi
    if (bool(fd, "bao_lop")) {
      const lops = fd.getAll("lop_bao").map(String).filter((x) => /^[0-9a-f-]{36}$/i.test(x));
      if (lops.length) await sb.from("announcements").insert(lops.map((class_id) => ({ class_id, noi_dung: `Thầy đã cập nhật Bài tập ${v.ma}: ${v.tieu_de}. Các em xem lại đề và hạn nộp nhé.` })));
    }
    revalidatePath("/gv", "layout");
    return ok("Đã lưu bài tập");
  });
}

/** Đặt hạn nộp cho một lớp (ghi nhật ký khi đổi hạn) */
export async function datHanNop(assignmentId: string, classId: string, hanVN: string): Promise<KQ> {
  return chay(async (sb) => {
    const a = uuid(assignmentId), c = uuid(classId);
    await kiemTraLop(sb, c);
    const han = fromVNInput(hanVN);
    const { data: cu } = await sb.from("assignment_deadlines").select("han_nop").eq("assignment_id", a).eq("class_id", c).maybeSingle();
    chk(await sb.from("assignment_deadlines").upsert({ assignment_id: a, class_id: c, han_nop: han }));
    if ((cu?.han_nop ?? null) !== han) await ghiNhatKy("sua_han", "assignment_deadlines", `${a}:${c}`, { han_nop: cu?.han_nop ?? null }, { han_nop: han });
    revalidatePath("/gv", "layout");
    return ok(han ? "Đã đặt hạn nộp" : "Đã bỏ hạn nộp");
  });
}

export async function xoaBaiTap(id: string): Promise<KQ> {
  return chay(async (sb) => {
    const { data } = chk(await sb.from("assignments").update({ deleted_at: new Date().toISOString() }).eq("id", uuid(id)).select("id"));
    if (!data?.length) return loi(KHONG_QUYEN);
    await ghiNhatKy("xoa", "assignments", id);
    revalidatePath("/gv", "layout");
    return ok("Đã chuyển bài tập vào thùng rác");
  });
}

export async function anHienBaiTap(id: string, hien: boolean): Promise<KQ> {
  return chay(async (sb) => {
    const { data } = chk(await sb.from("assignments").update({ hien_thi: hien }).eq("id", uuid(id)).select("id"));
    if (!data?.length) return loi(KHONG_QUYEN);
    await ghiNhatKy(hien ? "hien" : "an", "assignments", id);
    revalidatePath("/gv", "layout");
    return ok(hien ? "Đã hiện bài tập" : "Đã ẩn bài tập");
  });
}

/** File đề: xin link tải lên */
export async function xinLinkFileDe(assignmentId: string, ten: string, size: number): Promise<KQ> {
  return chay(async (sb) => {
    const a = uuid(assignmentId);
    const { data: duoc } = await sb.rpc("can_edit_assignment", { p_assignment: a });
    if (!duoc) return loi(KHONG_QUYEN);
    if (!DUOI_CHO_PHEP.de_bai.includes(layDuoi(ten))) return loi("Loại file đề không được hỗ trợ.");
    if (size > GIOI_HAN_MB.de_bai * 1024 * 1024) return loi(`File quá lớn (tối đa ${GIOI_HAN_MB.de_bai} MB).`);
    return ok(undefined, await capLinkTaiLen("assignment-files", tenLuuAnToan(a, ten)));
  });
}

export async function xacNhanFileDe(assignmentId: string, path: string, ten: string): Promise<KQ> {
  return chay(async (sb) => {
    const a = uuid(assignmentId);
    if (!path.startsWith(`${a}/`)) return loi("Đường dẫn không hợp lệ.");
    const kt = await xacMinhFile("assignment-files", path, ten, "de_bai");
    if (!kt.ok) return loi(kt.loi);
    chk(await sb.from("assignment_files").insert({ assignment_id: a, file_path: path, ten_goc: ten.slice(0, 200), kich_thuoc: kt.size, mime: kt.mime }));
    return ok("Đã đính kèm file đề");
  });
}

export async function xoaFileDe(id: string): Promise<KQ> {
  return chay(async (sb) => {
    const { data: xoa } = chk(await sb.from("assignment_files").delete().eq("id", uuid(id)).select("file_path"));
    if (!xoa?.length) return loi(KHONG_QUYEN); // RLS chặn → không xóa file trong kho
    await xoaFile("assignment-files", [xoa[0].file_path]);
    return ok("Đã xóa file đề");
  });
}
