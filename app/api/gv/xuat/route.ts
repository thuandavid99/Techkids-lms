import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile, laGiaoVien } from "@/lib/auth";
import { duLieuLop } from "@/lib/server/gv";
import { modulesCua, caiDat, cacLoaiBuoi, topicsCua } from "@/lib/server/data";
import { taoXlsx, phanHoiXlsx } from "@/lib/server/excel";
import { lapBangDiem } from "@/lib/domain/bang-diem";
import { tinhTrangThai, oMaTran, NHAN_CHAM, NHAN_THOI_GIAN } from "@/lib/domain/status";
import { tenBaiTap } from "@/lib/domain/naming";
import { fmtDate } from "@/lib/domain/time";
import { cmpKey } from "@/lib/domain/order";
import { boDau } from "@/lib/domain/naming";

// =====================================================================
// XUẤT EXCEL (chỉ giáo viên):
//   ?loai=ma-tran&lop=   · ?loai=bang-diem&lop=&hk=   · ?loai=bao-cao&lop=&trang_thai=
//   ?loai=mau-hs         · ?loai=ppct&ct=
// =====================================================================
const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(req: NextRequest) {
  const p = await getProfile();
  if (!laGiaoVien(p)) return new NextResponse("Không có quyền", { status: 403 });
  const sp = req.nextUrl.searchParams;
  const loai = sp.get("loai");
  const sb = await createClient();
  const homNay = new Date().toISOString().slice(0, 10);

  if (loai === "mau-hs") {
    const buf = await taoXlsx([{ ten: "Danh sách", tieuDe: ["Mã HS", "Họ và tên"], dong: [["HS001", "Nguyễn Văn An"], ["", "Trần Thị Bình (để trống mã = tự tạo)"]] }]);
    return phanHoiXlsx(buf, "mau-danh-sach-hoc-sinh.xlsx");
  }

  if (loai === "ppct") {
    const ct = sp.get("ct") ?? "";
    if (!UUID.test(ct)) return new NextResponse("Thiếu chương trình", { status: 400 });
    const [{ data: cur }, modules, loaiBuoi, { data: lessons }, { data: mats }] = await Promise.all([
      sb.from("curricula").select("ten").eq("id", ct).single(),
      modulesCua(sb, ct), cacLoaiBuoi(sb),
      sb.from("lessons").select("id, module_id, topic_id, thu_tu, nhan_buoi, tieu_de, tom_tat, loai_id").eq("curriculum_id", ct).is("ghi_de_cua", null).is("class_id", null).is("deleted_at", null),
      sb.from("materials").select("lesson_id, tieu_de, nguon, url").is("deleted_at", null),
    ]);
    const topics = new Map((await topicsCua(sb, modules.map((m) => m.id))).map((t) => [t.id, t.ten]));
    const tenLoai = new Map(loaiBuoi.map((l) => [l.id, l]));
    const dong: (string | null)[][] = [];
    const toMau: number[] = [];
    const link: Record<string, string> = {};
    for (const m of modules) {
      dong.push([m.ten, null, null, null, null]);
      toMau.push(dong.length - 1);
      for (const l of (lessons ?? []).filter((x) => x.module_id === m.id).sort((a, b) => cmpKey(a.thu_tu, b.thu_tu))) {
        const tl = (mats ?? []).find((x) => x.lesson_id === l.id && x.nguon === "link");
        const lt = l.loai_id ? tenLoai.get(l.loai_id) : undefined;
        dong.push([l.nhan_buoi.replace("–", ","), l.topic_id ? topics.get(l.topic_id) ?? l.tieu_de : l.tieu_de, l.tom_tat ?? "", tl ? tl.tieu_de : "", lt?.ten ?? ""]);
        if (tl?.url) link[`${dong.length - 1}:3`] = tl.url;
        if (lt?.noi_bat) toMau.push(dong.length - 1);
      }
    }
    const buf = await taoXlsx([{ ten: "PPCT", tieuDe: ["Buổi", "Bài", "Nội dung", "Tài liệu lý thuyết", "Loại"], dong, toMauDong: toMau, link }]);
    return phanHoiXlsx(buf, `PPCT_${boDau(cur?.ten ?? "chuong-trinh").replace(/\s+/g, "_")}.xlsx`);
  }

  const lop = sp.get("lop") ?? "";
  if (!UUID.test(lop)) return new NextResponse("Thiếu lớp", { status: 400 });
  const { data: c } = await sb.from("classes").select("ten_lop").eq("id", lop).single();
  const { rows, hs } = await duLieuLop(sb, lop);
  const now = new Date();

  if (loai === "ma-tran") {
    const cot = [...new Map(rows.map((r) => [r.assignment_id, r])).values()];
    const dong = hs.filter((h) => h.dang_hoc).map((h) => [h.ma_hs, h.ho_ten, ...cot.map((a) => {
      const r = rows.find((x) => x.student_id === h.id && x.assignment_id === a.assignment_id);
      return r ? oMaTran(tinhTrangThai(r, now), r.da_mo).moTa : "";
    })]);
    const buf = await taoXlsx([{ ten: `Ma tran ${c?.ten_lop}`, tieuDe: ["Mã HS", "Họ tên", ...cot.map((a) => tenBaiTap(a.ma, a.tieu_de))], dong }]);
    return phanHoiXlsx(buf, `MaTran_${c?.ten_lop}_${homNay}.xlsx`);
  }

  if (loai === "bang-diem") {
    const hk = sp.get("hk") === "2" ? 2 : 1;
    const [{ data: cc }, cd] = await Promise.all([sb.from("class_curriculum").select("curriculum_id").eq("class_id", lop).maybeSingle(), caiDat(sb)]);
    const modules = cc ? await modulesCua(sb, cc.curriculum_id) : [];
    const bd = lapBangDiem(rows, modules, hk, Number(cd.lam_tron_diem ?? 1));
    const buf = await taoXlsx([{
      ten: `Diem HK${hk}`,
      tieuDe: ["Mã HS", "Họ tên", ...bd.cot.map((x) => `${x.ma}${x.he_so !== 1 ? ` (hệ số ${x.he_so})` : ""}`), ...bd.modules.map((m) => `TB ${m.ten}`), `TB HK${hk}`],
      dong: bd.hs.map((h) => [h.ma_hs, h.ho_ten, ...bd.cot.map((x) => { const v = h.diem[x.assignment_id]; return v && v !== "Miễn" ? Number(v) : v ?? ""; }), ...bd.modules.map((m) => h.tbModule[m.id]), h.tb]),
    }]);
    return phanHoiXlsx(buf, `BangDiem_${c?.ten_lop}_HK${hk}_${homNay}.xlsx`);
  }

  if (loai === "bao-cao") {
    const dong: (string | number | null)[][] = [];
    for (const r of rows) {
      if (!r.da_mo) continue;
      const k = tinhTrangThai(r, now);
      if (!k.canNhac && k.nhanThoiGian !== "khong_nop_bai" && !k.coChuaLamDuoc && !(k.chuaDenHan && !k.daNop)) continue;
      dong.push([r.ma_hs, r.ho_ten, tenBaiTap(r.ma, r.tieu_de), k.hanHieuLuc ? fmtDate(k.hanHieuLuc) : "", k.nhanThoiGian ? NHAN_THOI_GIAN[k.nhanThoiGian].text : "", NHAN_CHAM[k.trangThai].text,
        k.canNhac ? "Có" : "", k.coChuaLamDuoc ? `Có${r.ghi_chu_co ? `: ${r.ghi_chu_co}` : ""}` : ""]);
    }
    const buf = await taoXlsx([{ ten: `Bao cao ${c?.ten_lop}`, tieuDe: ["Mã HS", "Họ tên", "Bài tập", "Hạn nộp", "Nhãn thời gian", "Trạng thái", "Cần nhắc PH", "Em báo chưa làm được"], dong }]);
    return phanHoiXlsx(buf, `BaoCao_${c?.ten_lop}_${homNay}.xlsx`);
  }
  return new NextResponse("Loại xuất không hợp lệ", { status: 400 });
}
