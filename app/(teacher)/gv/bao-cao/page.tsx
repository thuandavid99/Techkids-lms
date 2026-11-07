import { BarChart3, MessageCircle, FileSpreadsheet, Printer } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { lopDangChon } from "@/lib/server/lop";
import { duLieuLop } from "@/lib/server/gv";
import { IMG } from "@/lib/brand";
import { Card, PageGrid, RobotCard, CardTitle } from "@/components/ui/Card";
import { ButtonLink, btnClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { BaoCaoList, type DongBC } from "@/components/teacher/BaoCaoList";
import { tinhTrangThai } from "@/lib/domain/status";

export const metadata = { title: "Báo cáo & Nhắc phụ huynh" };

const TT = [
  { v: "can_nhac", t: "Cần nhắc phụ huynh" }, { v: "khong_nop", t: "Không nộp bài (quá hạn)" },
  { v: "chua_nop", t: "Chưa nộp (còn hạn)" }, { v: "co", t: "Em báo chưa làm được" },
];

export default async function Page({ searchParams }: { searchParams: Promise<{ lop?: string; trang_thai?: string; tu?: string }> }) {
  const sp = await searchParams;
  const tt = TT.some((x) => x.v === sp.trang_thai) ? sp.trang_thai! : "can_nhac";
  const tu = /^\d{4}-\d{2}-\d{2}$/.test(sp.tu ?? "") ? sp.tu! : "";
  const sb = await createClient();
  const { lops, lop } = await lopDangChon(sb, sp.lop);
  if (!lop) return <Card><EmptyState title="Chưa có lớp nào" /></Card>;
  const [{ rows, hs }, { data: mau }, { data: nhac }] = await Promise.all([
    duLieuLop(sb, lop.id),
    sb.from("message_templates").select("ten, noi_dung, mac_dinh").order("mac_dinh", { ascending: false }),
    sb.from("parent_reminders").select("id, student_id, nhac_luc").order("nhac_luc", { ascending: false }),
  ]);
  const now = new Date();
  const tuMoc = tu ? new Date(`${tu}T00:00:00+07:00`) : null;
  const dsMap = new Map<string, DongBC>();
  let quaHan = 0, chuaDen = 0;
  const hsQuaHan = new Set<string>(), hsChuaDen = new Set<string>();
  for (const r of rows) {
    if (!r.da_mo) continue;
    const k = tinhTrangThai(r, now);
    if (k.quaHanChuaNop && r.bat_buoc) hsQuaHan.add(r.student_id);
    if (k.chuaDenHan && !k.daNop) hsChuaDen.add(r.student_id);
    if (tuMoc && k.hanHieuLuc && k.hanHieuLuc < tuMoc) continue;
    let lyDo: DongBC["muc"][number]["lyDo"] | null = null;
    if (tt === "can_nhac" && k.canNhac) lyDo = k.canNhac;
    if (tt === "khong_nop" && k.nhanThoiGian === "khong_nop_bai") lyDo = "chua_lam_bai";
    if (tt === "chua_nop" && k.chuaDenHan && r.loai_nop !== "ngoai_he_thong") lyDo = "chua_nop";
    if (tt === "co" && k.coChuaLamDuoc) lyDo = "co";
    if (!lyDo) continue;
    if (!dsMap.has(r.student_id)) dsMap.set(r.student_id, { studentId: r.student_id, hoTen: r.ho_ten, maHs: r.ma_hs, muc: [], daNhac: null });
    const han = lyDo === "chua_lam_duoc" ? r.han_nop_lai : k.hanHieuLuc?.toISOString() ?? null;
    dsMap.get(r.student_id)!.muc.push({ assignment_id: r.assignment_id, ma: r.ma, tieu_de: r.tieu_de, lyDo, han, ghiChu: lyDo === "co" ? r.ghi_chu_co : null });
  }
  quaHan = hsQuaHan.size; chuaDen = hsChuaDen.size;
  // "Đã nhắc": có lần nhắc SAU hạn muộn nhất trong các bài cần nhắc (tránh nhắc trùng)
  for (const d of dsMap.values()) {
    const moc = d.muc.map((m) => m.han ?? "").sort().at(-1) ?? "";
    const n = (nhac ?? []).find((x) => x.student_id === d.studentId && x.nhac_luc >= moc);
    if (n) d.daNhac = { id: n.id, luc: n.nhac_luc };
  }
  const ds = [...dsMap.values()].sort((a, b) => Number(!!a.daNhac) - Number(!!b.daNhac) || a.hoTen.localeCompare(b.hoTen, "vi"));
  const q = new URLSearchParams({ lop: lop.id, trang_thai: tt, ...(tu && { tu }) }).toString();

  return (
    <PageGrid
      main={<>
        <h1 className="h-page">Báo cáo &amp; Nhắc phụ huynh</h1>
        <Card className="!py-3">
          <form action="/gv/bao-cao" className="flex flex-wrap items-center gap-2">
            <select name="lop" defaultValue={lop.id} className="input !w-auto !rounded-2xl" aria-label="Lớp">{lops.map((l) => <option key={l.id} value={l.id}>Lớp: Lớp {l.ten_lop}</option>)}</select>
            <select name="trang_thai" defaultValue={tt} className="input !w-auto !rounded-2xl" aria-label="Trạng thái">{TT.map((x) => <option key={x.v} value={x.v}>Trạng thái: {x.t}</option>)}</select>
            <label className="inline-flex items-center gap-1 text-sm">Từ ngày <input type="date" name="tu" defaultValue={tu} className="input !w-auto !rounded-2xl" /></label>
            <button className={btnClass("outline", "md")}>Lọc</button>
            <a href={`/api/gv/xuat?loai=bao-cao&${q}`} className={btnClass("navy", "md", "ml-auto")}>Xuất Excel</a>
          </form>
        </Card>
        <Card>
          <BaoCaoList ds={ds} tenLop={lop.ten_lop} mau={mau ?? []} tieuDe={tt === "co" ? "Danh sách em báo chưa làm được" : tt === "chua_nop" ? "Danh sách học sinh chưa nộp (còn hạn)" : "Danh sách học sinh chưa nộp bài"} />
        </Card>
      </>}
      aside={<>
        <Card>
          <CardTitle icon={<BarChart3 className="h-6 w-6 text-xanh-600" />}>Thống kê chưa nộp</CardTitle>
          <dl className="space-y-2 text-[1.05rem]">
            <div className="flex justify-between"><dt>Lớp {lop.ten_lop}</dt><dd>{hs.filter((h) => h.dang_hoc).length} học sinh</dd></div>
            <div className="flex justify-between"><dt>Quá hạn</dt><dd className="font-bold text-do-600">{quaHan} học sinh</dd></div>
            <div className="flex justify-between"><dt>Chưa đến hạn</dt><dd>{chuaDen} học sinh</dd></div>
          </dl>
        </Card>
        <Card>
          <CardTitle icon={<MessageCircle className="h-6 w-6 fill-xanh-500 text-xanh-500" />}>Mẹo gửi tin</CardTitle>
          <p className="text-slate-700">Hãy sao chép tin nhắn và gửi nhanh qua nhóm Zalo phụ huynh để nhắc nhở các bạn kịp thời nhé! Sau khi gửi, tích <b>“Đã nhắc”</b> để không nhắc trùng.</p>
        </Card>
        <Card>
          <CardTitle>Xuất dữ liệu</CardTitle>
          <div className="flex flex-col gap-2">
            <ButtonLink href={`/gv/bao-cao/bang-diem?lop=${lop.id}`} variant="secondary"><FileSpreadsheet className="h-4 w-4" /> Xuất bảng điểm</ButtonLink>
            <form action="/gv/bao-cao/phieu" className="flex gap-2">
              <select name="hs" className="input !rounded-full" aria-label="Chọn học sinh">{hs.map((h) => <option key={h.id} value={h.id}>{h.ho_ten}</option>)}</select>
              <button className={btnClass("outline", "md")}><Printer className="h-4 w-4" /> Phiếu PDF</button>
            </form>
          </div>
        </Card>
        <RobotCard img={IMG.cheer} title="Học hôm nay - Tỏa sáng ngày mai!" />
      </>}
    />
  );
}
