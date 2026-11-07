"use server";
import { revalidatePath } from "next/cache";
import { DUOI_CHO_PHEP, GIOI_HAN_MB, layDuoi } from "@/lib/domain/files";
import { capLinkTaiLen, tenLuuAnToan, xacMinhFile, xoaFile } from "@/lib/server/storage";
import { ghiNhatKy } from "@/lib/server/audit";
import { chay, chk, loi, ok, str, uuid } from "./_util";
import type { KQ } from "@/lib/types";
import type { createClient } from "@/lib/supabase/server";

type SB = Awaited<ReturnType<typeof createClient>>;
const xong = () => revalidatePath("/", "layout");
const laLink = (u: string) => { try { const x = new URL(u); return x.protocol === "https:" || x.protocol === "http:"; } catch { return false; } };

/** Xóa file trong kho chỉ khi không còn tài liệu nào dùng chung đường dẫn đó (do nhân bản chương trình) */
async function xoaFileNeuKhongDung(sb: SB, path: string | null) {
  if (!path) return;
  const { count } = await sb.from("materials").select("id", { count: "exact", head: true }).eq("file_path", path);
  if (!count) await xoaFile("materials", [path]);
}

export async function xinLinkTaiLieu(ten: string, size: number): Promise<KQ> {
  return chay(async () => {
    if (!DUOI_CHO_PHEP.tai_lieu.includes(layDuoi(ten))) return loi(`Loại file không hỗ trợ. Nhận: ${DUOI_CHO_PHEP.tai_lieu.join(", ")}`);
    if (size > GIOI_HAN_MB.tai_lieu * 1024 * 1024) return loi(`File quá lớn (tối đa ${GIOI_HAN_MB.tai_lieu} MB). File lớn/video nên dùng link.`);
    return ok(undefined, await capLinkTaiLen("materials", tenLuuAnToan(new Date().toISOString().slice(0, 7), ten)));
  });
}

/** Sau khi tải lên: kiểm tra nội dung thật rồi tạo tài liệu (lessonId null = kho chung) */
export async function xacNhanTaiLieu(lessonId: string | null, path: string, ten: string): Promise<KQ> {
  return chay(async (sb) => {
    if (path.includes("..")) return loi("Đường dẫn không hợp lệ.");
    const kt = await xacMinhFile("materials", path, ten, "tai_lieu");
    if (!kt.ok) return loi(kt.loi);
    chk(await sb.from("materials").insert({
      lesson_id: lessonId ? uuid(lessonId) : null, tieu_de: ten.replace(/\.[^.]+$/, "").slice(0, 200), nguon: "file",
      file_path: path, ten_goc: ten.slice(0, 200), kich_thuoc: kt.size, mime: kt.mime, thu_tu: `b${Date.now().toString(36)}`,
    }));
    xong();
    return ok("Đã thêm tài liệu");
  });
}

export async function themLink(_: KQ, fd: FormData): Promise<KQ> {
  return chay(async (sb) => {
    const url = str(fd, "url", 2000);
    const tieuDe = str(fd, "tieu_de", 200);
    const lesson = str(fd, "lesson_id");
    if (!laLink(url)) return loi("Link phải bắt đầu bằng https:// hoặc http://");
    chk(await sb.from("materials").insert({
      lesson_id: lesson ? uuid(lesson) : null, tieu_de: tieuDe || url, nguon: "link", url, loai: str(fd, "loai") || null, thu_tu: `b${Date.now().toString(36)}`,
    }));
    xong();
    return ok("Đã thêm link");
  });
}

export async function suaTaiLieu(id: string, patch: { tieu_de?: string; loai?: string | null; cho_phep_tai?: boolean; hien_thi?: boolean; lesson_id?: string | null; url?: string }): Promise<KQ> {
  return chay(async (sb) => {
    const p: Record<string, unknown> = {};
    if (patch.tieu_de !== undefined) { if (!patch.tieu_de.trim()) return loi("Tên không được trống."); p.tieu_de = patch.tieu_de.slice(0, 200); }
    if (patch.loai !== undefined) p.loai = patch.loai ? uuid(patch.loai) : null;
    if (patch.cho_phep_tai !== undefined) p.cho_phep_tai = patch.cho_phep_tai;
    if (patch.hien_thi !== undefined) p.hien_thi = patch.hien_thi;
    if (patch.lesson_id !== undefined) p.lesson_id = patch.lesson_id ? uuid(patch.lesson_id) : null;
    if (patch.url !== undefined) { if (!laLink(patch.url)) return loi("Link không hợp lệ."); p.url = patch.url; }
    chk(await sb.from("materials").update(p).eq("id", uuid(id)));
    if (patch.hien_thi === false) await ghiNhatKy("an", "materials", id);
    xong();
    return ok("Đã lưu");
  });
}

/** Chọn lớp được xem tài liệu (không chọn lớp nào = mọi lớp) */
export async function datLopXem(id: string, classIds: string[]): Promise<KQ> {
  return chay(async (sb) => {
    chk(await sb.from("material_classes").delete().eq("material_id", uuid(id)));
    if (classIds.length) chk(await sb.from("material_classes").insert(classIds.map((c) => ({ material_id: id, class_id: uuid(c) }))));
    xong();
    return ok(classIds.length ? `Chỉ ${classIds.length} lớp được xem` : "Mọi lớp được xem");
  });
}

/** Thay file mới (giữ nguyên chỗ gắn, tên hiển thị) */
export async function thayFile(id: string, path: string, ten: string): Promise<KQ> {
  return chay(async (sb) => {
    const kt = await xacMinhFile("materials", path, ten, "tai_lieu");
    if (!kt.ok) return loi(kt.loi);
    const { data: cu } = await sb.from("materials").select("file_path").eq("id", uuid(id)).single();
    chk(await sb.from("materials").update({ nguon: "file", file_path: path, ten_goc: ten.slice(0, 200), kich_thuoc: kt.size, mime: kt.mime, url: null }).eq("id", id));
    await xoaFileNeuKhongDung(sb, cu?.file_path ?? null);
    xong();
    return ok("Đã thay file mới");
  });
}

export async function xoaTaiLieu(id: string): Promise<KQ> {
  return chay(async (sb) => {
    chk(await sb.from("materials").update({ deleted_at: new Date().toISOString() }).eq("id", uuid(id)));
    await ghiNhatKy("xoa", "materials", id);
    xong();
    return ok("Đã chuyển tài liệu vào thùng rác");
  });
}

/** Thao tác hàng loạt ở Kho học liệu */
export async function hangLoatTaiLieu(ids: string[], viec: "an" | "hien" | "chuyen_buoi" | "lop_xem" | "xoa", giaTri?: string | string[]): Promise<KQ> {
  return chay(async (sb) => {
    const ds = ids.slice(0, 500).map(uuid);
    if (!ds.length) return loi("Chưa chọn tài liệu nào.");
    if (viec === "an" || viec === "hien") chk(await sb.from("materials").update({ hien_thi: viec === "hien" }).in("id", ds));
    else if (viec === "chuyen_buoi") chk(await sb.from("materials").update({ lesson_id: giaTri ? uuid(giaTri) : null }).in("id", ds));
    else if (viec === "xoa") chk(await sb.from("materials").update({ deleted_at: new Date().toISOString() }).in("id", ds));
    else if (viec === "lop_xem") {
      const lops = (Array.isArray(giaTri) ? giaTri : []).map(uuid);
      chk(await sb.from("material_classes").delete().in("material_id", ds));
      if (lops.length) chk(await sb.from("material_classes").insert(ds.flatMap((m) => lops.map((c) => ({ material_id: m, class_id: c })))));
    }
    await ghiNhatKy(`hang_loat_${viec}`, "materials", null, null, { so: ds.length });
    xong();
    return ok(`Đã cập nhật ${ds.length} tài liệu`);
  });
}
