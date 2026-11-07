"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { xoaFile } from "@/lib/server/storage";
import { ghiNhatKy } from "@/lib/server/audit";
import { chay, chk, loi, ok, str, bool, uuid } from "./_util";
import type { KQ } from "@/lib/types";

const xong = () => revalidatePath("/", "layout");

// ---------- DANH MỤC (giáo viên tự thêm/sửa/xóa) ----------
export async function luuLoaiBuoi(_: KQ, fd: FormData): Promise<KQ> {
  return chay(async (sb) => {
    const id = str(fd, "id");
    const v = {
      ten: str(fd, "ten", 60), mau: str(fd, "mau", 20) || "blue", icon: str(fd, "icon", 30) || "book-open",
      co_bai_nop_mac_dinh: bool(fd, "co_bai_nop_mac_dinh"), tinh_diem: bool(fd, "tinh_diem"), noi_bat: bool(fd, "noi_bat"),
      tu_khoa: str(fd, "tu_khoa", 200) || null, thu_tu: Number(fd.get("thu_tu") || 0),
    };
    if (!v.ten) return loi("Nhập tên loại buổi.");
    if (id) chk(await sb.from("lesson_types").update(v).eq("id", uuid(id)));
    else chk(await sb.from("lesson_types").insert(v));
    xong();
    return ok("Đã lưu loại buổi");
  });
}

export async function luuDanhMuc(_: KQ, fd: FormData): Promise<KQ> {
  return chay(async (sb) => {
    const bang = str(fd, "bang");
    const id = str(fd, "id");
    if (bang === "material_categories") {
      const v = { ten: str(fd, "ten", 60), thu_tu: Number(fd.get("thu_tu") || 0) };
      if (!v.ten) return loi("Nhập tên phân loại.");
      chk(id ? await sb.from(bang).update(v).eq("id", uuid(id)) : await sb.from(bang).insert(v));
    } else if (bang === "comment_templates") {
      const v = { noi_dung: str(fd, "noi_dung", 500), thu_tu: Number(fd.get("thu_tu") || 0) };
      if (!v.noi_dung) return loi("Nhập nội dung nhận xét.");
      chk(id ? await sb.from(bang).update(v).eq("id", uuid(id)) : await sb.from(bang).insert(v));
    } else if (bang === "message_templates") {
      const v = { ten: str(fd, "ten", 100), noi_dung: str(fd, "noi_dung", 2000), mac_dinh: bool(fd, "mac_dinh") };
      if (!v.ten || !v.noi_dung) return loi("Nhập tên và nội dung mẫu tin.");
      if (v.mac_dinh) await sb.from("message_templates").update({ mac_dinh: false }).neq("id", id || "00000000-0000-0000-0000-000000000000");
      chk(id ? await sb.from(bang).update(v).eq("id", uuid(id)) : await sb.from(bang).insert(v));
    } else return loi("Danh mục không hợp lệ.");
    xong();
    return ok("Đã lưu");
  });
}

export async function xoaDanhMuc(bang: "lesson_types" | "material_categories" | "comment_templates" | "message_templates", id: string): Promise<KQ> {
  return chay(async (sb) => {
    if (bang === "lesson_types" || bang === "material_categories") chk(await sb.from(bang).update({ deleted_at: new Date().toISOString() }).eq("id", uuid(id)));
    else if (bang === "comment_templates" || bang === "message_templates") chk(await sb.from(bang).delete().eq("id", uuid(id)));
    else return loi("Danh mục không hợp lệ.");
    xong();
    return ok("Đã xóa");
  });
}

export async function luuCaiDat(_: KQ, fd: FormData): Promise<KQ> {
  return chay(async (sb) => {
    const lt = Number(fd.get("lam_tron_diem") ?? 1);
    if (![0, 1, 2].includes(lt)) return loi("Số chữ số làm tròn là 0, 1 hoặc 2.");
    chk(await sb.from("app_settings").upsert([
      { key: "lam_tron_diem", value: lt },
      { key: "cho_nop_tre_mac_dinh", value: bool(fd, "cho_nop_tre_mac_dinh") },
      { key: "hs_tai_phieu_tien_do", value: bool(fd, "hs_tai_phieu_tien_do") },
    ]));
    xong();
    return ok("Đã lưu cài đặt");
  });
}

// ---------- THÙNG RÁC ----------
const BANG_RAC = ["lessons", "modules", "topics", "assignments", "materials", "classes", "curricula", "profiles", "announcements"] as const;
type BangRac = (typeof BANG_RAC)[number];

export async function khoiPhuc(bang: BangRac, id: string): Promise<KQ> {
  return chay(async (sb) => {
    if (!BANG_RAC.includes(bang)) return loi("Không hợp lệ.");
    const { data: cu } = await sb.from(bang).select("deleted_at").eq("id", uuid(id)).single();
    chk(await sb.from(bang).update({ deleted_at: null }).eq("id", id));
    // Module: khôi phục luôn các buổi bị xóa cùng lúc
    if (bang === "modules" && cu?.deleted_at) await sb.from("lessons").update({ deleted_at: null }).eq("module_id", id).eq("deleted_at", cu.deleted_at);
    await ghiNhatKy("khoi_phuc", bang, id);
    xong();
    return ok("Đã khôi phục");
  });
}

export async function xoaVinhVien(bang: BangRac, id: string): Promise<KQ> {
  return chay(async (sb) => {
    if (!BANG_RAC.includes(bang)) return loi("Không hợp lệ.");
    const x = uuid(id);
    if (bang === "assignments") {
      const { count } = await sb.from("submissions").select("id", { count: "exact", head: true }).eq("assignment_id", x);
      if (count) return loi(`Bài tập đã có ${count} bài nộp nên không thể xóa vĩnh viễn (vẫn giữ trong thùng rác/ẩn).`);
    }
    if (bang === "lessons") {
      const { data: bt } = await sb.from("assignments").select("id, submissions(count)").eq("lesson_id", x);
      if ((bt ?? []).some((b) => ((b as unknown as { submissions: { count: number }[] }).submissions?.[0]?.count ?? 0) > 0)) return loi("Buổi này đã có bài nộp nên không thể xóa vĩnh viễn.");
    }
    if (bang === "materials") {
      const { data: m } = await sb.from("materials").select("file_path").eq("id", x).single();
      chk(await sb.from("materials").delete().eq("id", x));
      if (m?.file_path) {
        const { count } = await sb.from("materials").select("id", { count: "exact", head: true }).eq("file_path", m.file_path);
        if (!count) await xoaFile("materials", [m.file_path]);
      }
    } else if (bang === "profiles") {
      const { error } = await createAdminClient().auth.admin.deleteUser(x);
      if (error) return loi("Chưa xóa được tài khoản: " + error.message);
    } else {
      chk(await sb.from(bang).delete().eq("id", x));
    }
    await ghiNhatKy("xoa_vinh_vien", bang, x);
    xong();
    return ok("Đã xóa vĩnh viễn");
  });
}

/** Làm sạch: xóa vĩnh viễn mọi mục đã nằm trong thùng rác quá 30 ngày */
export async function lamSachThungRac(): Promise<KQ> {
  return chay(async (sb) => {
    const moc = new Date(Date.now() - 30 * 864e5).toISOString();
    // File tài liệu sắp bị xóa
    const { data: mats } = await sb.from("materials").select("id, file_path").lt("deleted_at", moc);
    const { data, error } = await sb.rpc("gv_lam_sach_thung_rac");
    if (error) return loi("Chưa làm sạch được: " + error.message);
    for (const m of mats ?? []) {
      if (!m.file_path) continue;
      const { count } = await sb.from("materials").select("id", { count: "exact", head: true }).eq("file_path", m.file_path);
      if (!count) await xoaFile("materials", [m.file_path]);
    }
    // Học sinh / lớp / chương trình quá 30 ngày
    const admin = createAdminClient();
    const { data: hs } = await sb.from("profiles").select("id").lt("deleted_at", moc);
    for (const h of hs ?? []) await admin.auth.admin.deleteUser(h.id);
    await sb.from("classes").delete().lt("deleted_at", moc);
    await sb.from("curricula").delete().lt("deleted_at", moc);
    xong();
    return ok(`Đã làm sạch ${(data as { so_muc: number }).so_muc + (hs?.length ?? 0)} mục`);
  });
}
