"use server";
import { revalidatePath } from "next/cache";
import { keyBetween, keysBetween, cmpKey } from "@/lib/domain/order";
import { chuanHoaNhanBuoi, soTrongNhan } from "@/lib/domain/naming";
import { tinhNgayHoc } from "@/lib/domain/schedule";
import { ghiNhatKy } from "@/lib/server/audit";
import { chay, chayQt, chk, kiemTraLop, loi, ok, str, uuid } from "./_util";
import { getProfile, laQuanTri } from "@/lib/auth";
import type { KQ } from "@/lib/types";
import type { createClient } from "@/lib/supabase/server";

type SB = Awaited<ReturnType<typeof createClient>>;
const xong = () => revalidatePath("/gv", "layout");

// ---------------- CHƯƠNG TRÌNH ----------------
export async function taoChuongTrinh(_: KQ, fd: FormData): Promise<KQ> {
  return chayQt(async (sb) => {
    const ten = str(fd, "ten", 200);
    if (!ten) return loi("Nhập tên chương trình.");
    const { data } = chk(await sb.from("curricula").insert({ ten, mo_ta: str(fd, "mo_ta", 1000) || null, nam_hoc: str(fd, "nam_hoc", 20) || null }).select("id").single());
    chk(await sb.from("modules").insert({ curriculum_id: data!.id, ten: "Module 1", thu_tu: keyBetween(null, null) }));
    xong();
    return ok("Đã tạo chương trình", data!.id);
  });
}

export async function suaChuongTrinh(id: string, ten: string, moTa: string): Promise<KQ> {
  return chayQt(async (sb) => {
    if (!ten.trim()) return loi("Nhập tên chương trình.");
    chk(await sb.from("curricula").update({ ten: ten.slice(0, 200), mo_ta: moTa.slice(0, 1000) || null }).eq("id", uuid(id)));
    xong();
    return ok("Đã lưu");
  });
}

export async function xoaChuongTrinh(id: string): Promise<KQ> {
  return chayQt(async (sb) => {
    const { count } = await sb.from("class_curriculum").select("class_id", { count: "exact", head: true }).eq("curriculum_id", uuid(id));
    if (count) return loi(`Chương trình đang được ${count} lớp sử dụng. Hãy đổi chương trình cho các lớp đó trước.`);
    chk(await sb.from("curricula").update({ deleted_at: new Date().toISOString() }).eq("id", id));
    await ghiNhatKy("xoa", "curricula", id);
    xong();
    return ok("Đã chuyển chương trình vào thùng rác");
  });
}

/** Nhân bản chương trình (module, chủ đề, buổi, bài tập, tài liệu) để làm bản cho năm sau */
export async function nhanBanChuongTrinh(id: string): Promise<KQ> {
  return chayQt(async (sb) => {
    const ct = uuid(id);
    const { data: cur } = await sb.from("curricula").select("*").eq("id", ct).single();
    const { data: moi } = chk(await sb.from("curricula").insert({ ten: `${cur!.ten} (bản sao)`, mo_ta: cur!.mo_ta, nam_hoc: cur!.nam_hoc }).select("id").single());
    const mapM = new Map<string, string>(), mapT = new Map<string, string>(), mapL = new Map<string, string>();
    const { data: mods } = await sb.from("modules").select("*").eq("curriculum_id", ct).is("deleted_at", null);
    for (const m of mods ?? []) {
      const { data: x } = chk(await sb.from("modules").insert({ curriculum_id: moi!.id, ten: m.ten, mo_ta: m.mo_ta, thu_tu: m.thu_tu }).select("id").single());
      mapM.set(m.id, x!.id);
    }
    const { data: tps } = mods?.length ? await sb.from("topics").select("*").in("module_id", mods.map((m) => m.id)).is("deleted_at", null) : { data: [] };
    for (const t of tps ?? []) {
      const { data: x } = chk(await sb.from("topics").insert({ module_id: mapM.get(t.module_id)!, ten: t.ten, thu_tu: t.thu_tu }).select("id").single());
      mapT.set(t.id, x!.id);
    }
    const { data: ls } = await sb.from("lessons").select("*").eq("curriculum_id", ct).is("ghi_de_cua", null).is("class_id", null).is("deleted_at", null);
    for (const l of ls ?? []) {
      const { data: x } = chk(await sb.from("lessons").insert({
        curriculum_id: moi!.id, module_id: l.module_id ? mapM.get(l.module_id) ?? null : null, topic_id: l.topic_id ? mapT.get(l.topic_id) ?? null : null,
        thu_tu: l.thu_tu, nhan_buoi: l.nhan_buoi, tieu_de: l.tieu_de, tom_tat: l.tom_tat, loai_id: l.loai_id, noi_dung_kien_thuc: l.noi_dung_kien_thuc,
      }).select("id").single());
      mapL.set(l.id, x!.id);
    }
    await saoNoiDungBuoi(sb, [...mapL.entries()]);
    await ghiNhatKy("nhan_ban", "curricula", ct, null, { ban_moi: moi!.id });
    xong();
    return ok("Đã nhân bản chương trình", moi!.id);
  });
}

/** Sao bài tập + tài liệu từ buổi cũ sang buổi mới */
async function saoNoiDungBuoi(sb: SB, cap: [string, string][]) {
  for (const [cu, moi] of cap) {
    const [{ data: bts }, { data: tls }] = await Promise.all([
      sb.from("assignments").select("*").eq("lesson_id", cu).is("ghi_de_cua", null).is("class_id", null).is("deleted_at", null),
      sb.from("materials").select("*").eq("lesson_id", cu).is("deleted_at", null),
    ]);
    for (const a of bts ?? []) {
      const { id: _id, tao_luc: _t, deleted_at: _d, ...rest } = a;
      chk(await sb.from("assignments").insert({ ...rest, lesson_id: moi }));
    }
    for (const m of tls ?? []) {
      const { id: _id, tao_luc: _t, deleted_at: _d, ...rest } = m;
      chk(await sb.from("materials").insert({ ...rest, lesson_id: moi }));
    }
  }
}

// ---------------- MODULE ----------------
export async function themModule(ctId: string, ten: string): Promise<KQ> {
  return chayQt(async (sb) => {
    const ct = uuid(ctId);
    const { data: ds } = await sb.from("modules").select("thu_tu").eq("curriculum_id", ct).is("deleted_at", null);
    const cuoi = (ds ?? []).map((m) => m.thu_tu).sort(cmpKey).at(-1) ?? null;
    chk(await sb.from("modules").insert({ curriculum_id: ct, ten: ten.trim().slice(0, 200) || `Module ${(ds?.length ?? 0) + 1}`, thu_tu: keyBetween(cuoi, null) }));
    xong();
    return ok("Đã thêm module");
  });
}

export async function suaModule(id: string, ten: string): Promise<KQ> {
  return chayQt(async (sb) => {
    if (!ten.trim()) return loi("Nhập tên module.");
    chk(await sb.from("modules").update({ ten: ten.slice(0, 200) }).eq("id", uuid(id)));
    xong();
    return ok("Đã đổi tên module");
  });
}

export async function diChuyenModule(id: string, huong: "len" | "xuong"): Promise<KQ> {
  return chayQt(async (sb) => {
    const { data: m } = await sb.from("modules").select("curriculum_id, thu_tu").eq("id", uuid(id)).single();
    const { data: ds } = await sb.from("modules").select("id, thu_tu").eq("curriculum_id", m!.curriculum_id).is("deleted_at", null);
    const s = (ds ?? []).sort((a, b) => cmpKey(a.thu_tu, b.thu_tu));
    const i = s.findIndex((x) => x.id === id);
    const j = huong === "len" ? i - 1 : i + 1;
    if (j < 0 || j >= s.length) return ok();
    chk(await sb.from("modules").update({ thu_tu: s[j].thu_tu }).eq("id", s[i].id));
    chk(await sb.from("modules").update({ thu_tu: s[i].thu_tu }).eq("id", s[j].id));
    xong();
    return ok();
  });
}

/** Xóa module: module + các buổi trong module vào thùng rác cùng lúc (khôi phục cùng nhau) */
export async function xoaModule(id: string): Promise<KQ> {
  return chayQt(async (sb) => {
    const t = new Date().toISOString();
    chk(await sb.from("lessons").update({ deleted_at: t }).eq("module_id", uuid(id)).is("deleted_at", null));
    chk(await sb.from("modules").update({ deleted_at: t }).eq("id", id));
    await ghiNhatKy("xoa", "modules", id);
    xong();
    return ok("Đã chuyển module vào thùng rác");
  });
}

// ---------------- BUỔI HỌC ----------------
async function buoiTrongModule(sb: SB, ctId: string, moduleId: string | null) {
  let q = sb.from("lessons").select("id, thu_tu, nhan_buoi").eq("curriculum_id", ctId).is("ghi_de_cua", null).is("deleted_at", null);
  q = moduleId ? q.eq("module_id", moduleId) : q.is("module_id", null);
  const { data } = await q;
  return (data ?? []).sort((a, b) => cmpKey(a.thu_tu, b.thu_tu));
}

/** Thêm buổi: sau buổi `sauId` (null = cuối module) hoặc trước buổi `truocId` */
export async function themBuoi(ctId: string, moduleId0: string | null, vt: { sauId?: string; truocId?: string } = {}): Promise<KQ> {
  const moduleId = moduleId0 || null; // "" = buổi chưa xếp module
  return chayQt(async (sb) => {
    const ct = uuid(ctId);
    const ds = await buoiTrongModule(sb, ct, moduleId ? uuid(moduleId) : null);
    let a: string | null = null, b: string | null = null;
    if (vt.truocId) { const i = ds.findIndex((x) => x.id === vt.truocId); a = ds[i - 1]?.thu_tu ?? null; b = ds[i]?.thu_tu ?? null; }
    else if (vt.sauId) { const i = ds.findIndex((x) => x.id === vt.sauId); a = ds[i]?.thu_tu ?? null; b = ds[i + 1]?.thu_tu ?? null; }
    else a = ds.at(-1)?.thu_tu ?? null;
    const truoc = vt.truocId ? ds[ds.findIndex((x) => x.id === vt.truocId) - 1] : vt.sauId ? ds.find((x) => x.id === vt.sauId) : ds.at(-1);
    const so = truoc ? soTrongNhan(truoc.nhan_buoi).at(-1) : undefined;
    const { data: lt } = await sb.from("lesson_types").select("id").is("deleted_at", null).order("thu_tu").limit(1);
    const { data } = chk(await sb.from("lessons").insert({
      curriculum_id: ct, module_id: moduleId, thu_tu: keyBetween(a, b), nhan_buoi: so ? String(so + 1) : "", tieu_de: "Buổi học mới", loai_id: lt?.[0]?.id ?? null,
    }).select("id").single());
    xong();
    return ok("Đã thêm buổi", data!.id);
  });
}

/** Kéo thả: đặt buổi vào module `moduleId`, ngay sau buổi `sauId` (null = đầu module) */
export async function diChuyenBuoi(lessonId: string, moduleId0: string | null, sauId: string | null): Promise<KQ> {
  const moduleId = moduleId0 || null;
  return chayQt(async (sb) => {
    const { data: l } = await sb.from("lessons").select("curriculum_id, module_id").eq("id", uuid(lessonId)).single();
    const ds = (await buoiTrongModule(sb, l!.curriculum_id, moduleId)).filter((x) => x.id !== lessonId);
    const i = sauId ? ds.findIndex((x) => x.id === sauId) : -1;
    const key = keyBetween(i >= 0 ? ds[i].thu_tu : null, ds[i + 1]?.thu_tu ?? null);
    const patch: Record<string, unknown> = { thu_tu: key, module_id: moduleId };
    if (l!.module_id !== moduleId) patch.topic_id = null;
    chk(await sb.from("lessons").update(patch).eq("id", lessonId));
    xong();
    return ok("Đã sắp xếp lại");
  });
}

export async function nhanBanBuoi(lessonId: string): Promise<KQ> {
  return chayQt(async (sb) => {
    const { data: l } = await sb.from("lessons").select("*").eq("id", uuid(lessonId)).single();
    const ds = await buoiTrongModule(sb, l!.curriculum_id, l!.module_id);
    const i = ds.findIndex((x) => x.id === lessonId);
    const { data: moi } = chk(await sb.from("lessons").insert({
      curriculum_id: l!.curriculum_id, module_id: l!.module_id, topic_id: l!.topic_id, thu_tu: keyBetween(ds[i].thu_tu, ds[i + 1]?.thu_tu ?? null),
      nhan_buoi: l!.nhan_buoi, tieu_de: `${l!.tieu_de} (bản sao)`, tom_tat: l!.tom_tat, loai_id: l!.loai_id, noi_dung_kien_thuc: l!.noi_dung_kien_thuc, class_id: l!.class_id,
    }).select("id").single());
    await saoNoiDungBuoi(sb, [[lessonId, moi!.id]]);
    xong();
    return ok("Đã nhân bản buổi", moi!.id);
  });
}

/** Ẩn/hiện buổi với MỌI lớp (thay vì xóa khi đã có bài nộp) */
export async function anBuoi(lessonId: string, an: boolean): Promise<KQ> {
  return chayQt(async (sb) => {
    chk(await sb.from("class_lessons").update({ hien_thi: !an }).eq("lesson_id", uuid(lessonId)));
    await ghiNhatKy(an ? "an" : "hien", "lessons", lessonId);
    xong();
    return ok(an ? "Đã ẩn buổi với mọi lớp" : "Đã hiện buổi với mọi lớp");
  });
}

export async function xoaBuoi(lessonId: string): Promise<KQ> {
  return chayQt(async (sb) => {
    chk(await sb.from("lessons").update({ deleted_at: new Date().toISOString() }).eq("id", uuid(lessonId)));
    await ghiNhatKy("xoa", "lessons", lessonId);
    xong();
    return ok("Đã chuyển buổi vào thùng rác");
  });
}

/** Gộp với buổi ngay sau (cùng module): "7" + "8" → "7–8"; bài tập/tài liệu chuyển sang buổi đầu */
export async function gopBuoi(lessonId: string): Promise<KQ> {
  return chayQt(async (sb) => {
    const { data: l } = await sb.from("lessons").select("curriculum_id, module_id, nhan_buoi").eq("id", uuid(lessonId)).single();
    const ds = await buoiTrongModule(sb, l!.curriculum_id, l!.module_id);
    const i = ds.findIndex((x) => x.id === lessonId);
    const sau = ds[i + 1];
    if (!sau) return loi("Không có buổi phía sau để gộp.");
    const so = [...soTrongNhan(l!.nhan_buoi), ...soTrongNhan(sau.nhan_buoi)];
    const nhan = so.length ? chuanHoaNhanBuoi(so.join(",")) : `${l!.nhan_buoi}, ${sau.nhan_buoi}`;
    chk(await sb.from("assignments").update({ lesson_id: lessonId }).eq("lesson_id", sau.id));
    chk(await sb.from("materials").update({ lesson_id: lessonId }).eq("lesson_id", sau.id));
    chk(await sb.from("lessons").update({ nhan_buoi: nhan }).eq("id", lessonId));
    chk(await sb.from("lessons").update({ deleted_at: new Date().toISOString() }).eq("id", sau.id));
    await ghiNhatKy("gop_buoi", "lessons", lessonId, null, { gop: sau.id, nhan });
    xong();
    return ok(`Đã gộp thành Buổi ${nhan}`);
  });
}

/** Tách buổi gộp "10–11" → "10" và "11" (buổi mới chưa có bài tập) */
export async function tachBuoi(lessonId: string): Promise<KQ> {
  return chayQt(async (sb) => {
    const { data: l } = await sb.from("lessons").select("*").eq("id", uuid(lessonId)).single();
    const so = soTrongNhan(l!.nhan_buoi);
    if (so.length < 2) return loi("Buổi này không phải buổi gộp (ví dụ 10–11).");
    const ds = await buoiTrongModule(sb, l!.curriculum_id, l!.module_id);
    const i = ds.findIndex((x) => x.id === lessonId);
    chk(await sb.from("lessons").update({ nhan_buoi: String(so[0]) }).eq("id", lessonId));
    const keys = keysBetween(ds[i].thu_tu, ds[i + 1]?.thu_tu ?? null, so.length - 1);
    for (let k = 1; k < so.length; k++) {
      chk(await sb.from("lessons").insert({ curriculum_id: l!.curriculum_id, module_id: l!.module_id, topic_id: l!.topic_id, thu_tu: keys[k - 1], nhan_buoi: String(so[k]), tieu_de: l!.tieu_de, loai_id: l!.loai_id, class_id: l!.class_id }));
    }
    xong();
    return ok(`Đã tách thành ${so.length} buổi`);
  });
}

/**
 * Lưu buổi học. pham_vi = "tat_ca" | id lớp (tạo/sửa BẢN GHI ĐÈ riêng lớp đó, mục 2.2).
 * nut = "luu" | "nhap" (Lưu nháp: học sinh chưa thấy)
 */
export async function luuBuoi(_: KQ, fd: FormData): Promise<KQ> {
  return chay(async (sb) => {
    const id = uuid(fd.get("id"));
    const phamVi = str(fd, "pham_vi") || "tat_ca";
    const qt = laQuanTri(await getProfile());
    // Giáo viên thường chỉ sửa BẢN RIÊNG cho lớp mình phụ trách
    if (phamVi === "tat_ca" && !qt) {
      // Buổi RIÊNG của lớp mình thì giáo viên sửa thẳng được
      const { data: duoc } = await sb.rpc("can_edit_lesson", { p_lesson: id });
      if (!duoc) return loi("Chỉ quản trị sửa được nội dung chung. Thầy/cô chọn \"Chỉ lớp …\" để sửa riêng cho lớp mình.");
    }
    if (phamVi !== "tat_ca") await kiemTraLop(sb, phamVi);
    const nhap = fd.get("nut") === "nhap";
    const moduleId = str(fd, "module_id") || null;
    let topicId = str(fd, "topic_id") || null;
    const chuDeMoi = qt ? str(fd, "chu_de_moi", 200) : "";
    if (chuDeMoi && moduleId) {
      const { data: t } = chk(await sb.from("topics").insert({ module_id: uuid(moduleId), ten: chuDeMoi, thu_tu: keyBetween(null, null) }).select("id").single());
      topicId = t!.id;
    }
    const v = {
      tieu_de: str(fd, "tieu_de", 200), nhan_buoi: chuanHoaNhanBuoi(str(fd, "nhan_buoi", 20)), loai_id: str(fd, "loai_id") || null,
      tom_tat: str(fd, "tom_tat", 2000) || null, noi_dung_kien_thuc: str(fd, "noi_dung_kien_thuc", 100000) || null,
    };
    if (!v.tieu_de) return loi("Nhập tên buổi học.");
    if (phamVi === "tat_ca") {
      const { data: cu } = await sb.from("lessons").select("module_id").eq("id", id).single();
      const patch: Record<string, unknown> = { ...v, topic_id: topicId, ban_nhap: nhap };
      if (moduleId !== cu?.module_id) {
        // Đổi module → đưa xuống cuối module mới
        const { data: l } = await sb.from("lessons").select("curriculum_id").eq("id", id).single();
        const ds = await buoiTrongModule(sb, l!.curriculum_id, moduleId);
        patch.module_id = moduleId; patch.thu_tu = keyBetween(ds.at(-1)?.thu_tu ?? null, null);
      }
      chk(await sb.from("lessons").update(patch).eq("id", id));
    } else {
      const c = uuid(phamVi);
      const { data: base } = await sb.from("lessons").select("curriculum_id, module_id, topic_id, thu_tu").eq("id", id).single();
      const { data: cu } = await sb.from("lessons").select("id").eq("ghi_de_cua", id).eq("class_id", c).is("deleted_at", null).maybeSingle();
      if (cu) chk(await sb.from("lessons").update({ ...v, ban_nhap: nhap }).eq("id", cu.id));
      else chk(await sb.from("lessons").insert({ ...v, ban_nhap: nhap, curriculum_id: base!.curriculum_id, module_id: base!.module_id, topic_id: base!.topic_id, thu_tu: base!.thu_tu, class_id: c, ghi_de_cua: id }));
      await ghiNhatKy("sua_rieng_lop", "lessons", id, null, { lop: c });
    }
    xong();
    return ok(nhap ? "Đã lưu nháp (học sinh chưa thấy)" : "Đã lưu buổi học");
  });
}

/** Bỏ bản ghi đè riêng của lớp (quay về dùng nội dung chung) */
export async function boBanRieng(lessonId: string, classId: string): Promise<KQ> {
  return chay(async (sb) => {
    await kiemTraLop(sb, classId);
    chk(await sb.from("lessons").update({ deleted_at: new Date().toISOString() }).eq("ghi_de_cua", uuid(lessonId)).eq("class_id", uuid(classId)));
    xong();
    return ok("Lớp này đã quay về dùng nội dung chung");
  });
}

/** Thêm buổi RIÊNG cho một lớp (ví dụ buổi bồi dưỡng) */
export async function themBuoiRieng(ctId: string, moduleId: string | null, classId: string): Promise<KQ> {
  return chay(async (sb) => {
    await kiemTraLop(sb, classId);
    const ds = await buoiTrongModule(sb, uuid(ctId), moduleId);
    const { data } = chk(await sb.from("lessons").insert({ curriculum_id: ctId, module_id: moduleId, thu_tu: keyBetween(ds.at(-1)?.thu_tu ?? null, null), tieu_de: "Buổi riêng của lớp", class_id: uuid(classId) }).select("id").single());
    xong();
    return ok("Đã thêm buổi riêng", data!.id);
  });
}

// ---------------- NHẬP PPCT TỪ EXCEL ----------------
export interface PPCTNhap {
  cheDo: "moi" | "noi"; ten?: string; ctId?: string;
  modules: { ten: string; buoi: { nhanBuoi: string; tieuDe: string; tomTat: string; loaiId: string | null; chuDe: string | null; taiLieu: { tieuDe: string; url: string }[] }[] }[];
}

export async function taoTuPPCT(input: PPCTNhap): Promise<KQ> {
  return chayQt(async (sb) => {
    if (!input.modules.length) return loi("Không có buổi học nào để nhập.");
    if (input.modules.reduce((s, m) => s + m.buoi.length, 0) > 500) return loi("Tối đa 500 buổi mỗi lần nhập.");
    let ct: string;
    if (input.cheDo === "moi") {
      if (!input.ten?.trim()) return loi("Nhập tên chương trình.");
      const { data } = chk(await sb.from("curricula").insert({ ten: input.ten.trim().slice(0, 200) }).select("id").single());
      ct = data!.id;
    } else ct = uuid(input.ctId);
    const { data: mcu } = await sb.from("modules").select("thu_tu").eq("curriculum_id", ct).is("deleted_at", null);
    const cuoi = (mcu ?? []).map((m) => m.thu_tu).sort(cmpKey).at(-1) ?? null;
    const keyM = keysBetween(cuoi, null, input.modules.length);
    const { data: cat } = await sb.from("material_categories").select("id, ten").is("deleted_at", null);
    const catKT = (cat ?? []).find((c) => /kiến thức/i.test(c.ten))?.id ?? null;
    let soBuoi = 0;
    for (let i = 0; i < input.modules.length; i++) {
      const m = input.modules[i];
      const { data: mod } = chk(await sb.from("modules").insert({ curriculum_id: ct, ten: m.ten.slice(0, 200) || `Module ${i + 1}`, thu_tu: keyM[i] }).select("id").single());
      const chuDe = new Map<string, string>();
      const keyL = keysBetween(null, null, m.buoi.length);
      for (let j = 0; j < m.buoi.length; j++) {
        const b = m.buoi[j];
        let topicId: string | null = null;
        if (b.chuDe) {
          if (!chuDe.has(b.chuDe)) {
            const { data: t } = chk(await sb.from("topics").insert({ module_id: mod!.id, ten: b.chuDe.slice(0, 200), thu_tu: keyBetween(null, null) }).select("id").single());
            chuDe.set(b.chuDe, t!.id);
          }
          topicId = chuDe.get(b.chuDe)!;
        }
        const { data: l } = chk(await sb.from("lessons").insert({
          curriculum_id: ct, module_id: mod!.id, topic_id: topicId, thu_tu: keyL[j], nhan_buoi: chuanHoaNhanBuoi(b.nhanBuoi),
          tieu_de: b.tieuDe.slice(0, 200) || "(chưa có tên)", tom_tat: b.tomTat?.slice(0, 2000) || null, loai_id: b.loaiId,
        }).select("id").single());
        const tl = b.taiLieu.filter((x) => /^https?:\/\//i.test(x.url)).slice(0, 10);
        if (tl.length) chk(await sb.from("materials").insert(tl.map((x, k) => ({ lesson_id: l!.id, loai: catKT, tieu_de: x.tieuDe.slice(0, 200), nguon: "link", url: x.url.slice(0, 2000), thu_tu: `a${k}` }))));
        soBuoi++;
      }
    }
    await ghiNhatKy("nhap_ppct", "curricula", ct, null, { so_module: input.modules.length, so_buoi: soBuoi });
    xong();
    return ok(`Đã nhập ${soBuoi} buổi, ${input.modules.length} module`, ct);
  });
}

// ---------------- ÁP DỤNG CHO LỚP ----------------
/** Gán chương trình cho lớp + tự điền ngày học theo ngày bắt đầu và các thứ học */
export async function apDungChoLop(input: { classId: string; ctId: string; ngayBatDau: string; thu: number[]; ngay: Record<string, string> }): Promise<KQ> {
  return chay(async (sb) => {
    const c = uuid(input.classId), ct = uuid(input.ctId);
    await kiemTraLop(sb, c);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.ngayBatDau)) return loi("Chọn ngày bắt đầu.");
    if (!input.thu.length) return loi("Chọn ít nhất một thứ học trong tuần.");
    chk(await sb.from("class_curriculum").upsert({ class_id: c, curriculum_id: ct, ngay_bat_dau: input.ngayBatDau, cac_thu_trong_tuan: input.thu.filter((t) => t >= 1 && t <= 7) }));
    const rows = Object.entries(input.ngay).filter(([id, d]) => /^[0-9a-f-]{36}$/i.test(id) && /^\d{4}-\d{2}-\d{2}$/.test(d)).map(([lesson_id, ngay_hoc]) => ({ class_id: c, lesson_id, ngay_hoc }));
    for (let i = 0; i < rows.length; i += 200) chk(await sb.from("class_lessons").upsert(rows.slice(i, i + 200)));
    await ghiNhatKy("ap_dung_ct", "class_curriculum", c, null, { ct, ngay_bat_dau: input.ngayBatDau, thu: input.thu });
    xong();
    return ok(`Đã áp dụng chương trình cho lớp (${rows.length} buổi có ngày học)`);
  });
}

/** Tính trước ngày học (để xem trước) — chạy ở server cho nhất quán */
export async function tinhLich(nhan: string[], ngayBatDau: string, thu: number[]): Promise<KQ> {
  try { return ok(undefined, tinhNgayHoc(ngayBatDau, thu, nhan)); } catch (e) { return loi((e as Error).message); }
}
