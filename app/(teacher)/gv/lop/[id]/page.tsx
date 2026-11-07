import { Info, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { duLieuLop } from "@/lib/server/gv";
import { modulesCua } from "@/lib/server/data";
import { IMG } from "@/lib/brand";
import { Card, CardTitle, PageGrid, RobotCard } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/States";
import { btnClass } from "@/components/ui/Button";
import { MaTran, OIcon, type NhomCot, type OData } from "@/components/teacher/MaTran";
import { tinhTrangThai, oMaTran } from "@/lib/domain/status";
import { phanTramHoanThanh } from "@/lib/domain/stats";
import { tenBaiTap } from "@/lib/domain/naming";
import { toVNInput } from "@/lib/domain/time";

export const metadata = { title: "Ma trận tiến độ" };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ module?: string }> }) {
  const { id } = await params;
  const { module: locModule = "" } = await searchParams;
  const sb = await createClient();
  const [{ data: lop }, { data: cc }] = await Promise.all([
    sb.from("classes").select("ten_lop").eq("id", id).single(),
    sb.from("class_curriculum").select("curriculum_id").eq("class_id", id).maybeSingle(),
  ]);
  const { rows, hs } = await duLieuLop(sb, id);
  const modules = cc ? await modulesCua(sb, cc.curriculum_id) : [];
  const now = new Date();

  // Cột: bài tập, nhóm theo module, giữ thứ tự chương trình
  const daThay = new Set<string>();
  const nhomMap = new Map<string, NhomCot>();
  for (const r of rows) {
    if (daThay.has(r.assignment_id)) continue;
    if (locModule && r.module_id !== locModule) continue;
    daThay.add(r.assignment_id);
    const key = r.module_id ?? "khac";
    if (!nhomMap.has(key)) nhomMap.set(key, { ten: modules.find((m) => m.id === key)?.ten ?? "Khác", cot: [] });
    nhomMap.get(key)!.cot.push({ assignment_id: r.assignment_id, ma: r.ma, ten: tenBaiTap(r.ma, r.tieu_de), batBuoc: r.bat_buoc });
  }
  const o: Record<string, OData> = {};
  for (const r of rows) {
    const kq = tinhTrangThai(r, now);
    const x = oMaTran(kq, r.da_mo);
    o[`${r.student_id}:${r.assignment_id}`] = {
      kieu: x.kieu, moTa: x.moTa, submissionId: r.submission_id, co: kq.coChuaLamDuoc, ghiChu: r.ghi_chu_co,
      o: { assignmentId: r.assignment_id, studentId: r.student_id, tenHs: r.ho_ten, tenBai: tenBaiTap(r.ma, r.tieu_de), mien: r.mien_nop, ngoai: r.trang_thai === "nop_ngoai_he_thong", daCham: r.trang_thai === "da_cham", coBai: !!r.submission_id, hanRieng: toVNInput(r.han_nop_rieng) },
    };
  }
  const pt = phanTramHoanThanh(rows, now);

  return (
    <PageGrid
      main={<>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="h-page">Ma trận tiến độ học tập - Lớp {lop?.ten_lop}</h1>
          <form className="flex gap-2" action={`/gv/lop/${id}`}>
            <select name="module" defaultValue={locModule} aria-label="Lọc bài học" className="input !w-auto !rounded-2xl">
              <option value="">Bài học: Tất cả</option>
              {modules.map((m) => <option key={m.id} value={m.id}>{m.ten}</option>)}
            </select>
            <button className={btnClass("outline", "md")}>Lọc</button>
            <a href={`/api/gv/xuat?loai=ma-tran&lop=${id}`} className={btnClass("secondary", "md")}>Xuất báo cáo</a>
          </form>
        </div>
        <Card>
          {hs.length === 0 ? <EmptyState title="Lớp chưa có học sinh" hint="Vào tab Học sinh để thêm." />
            : daThay.size === 0 ? <EmptyState title="Chưa có bài tập nào" hint="Thêm bài tập trong Chương trình học, rồi áp dụng chương trình cho lớp." />
            : <MaTran hs={hs.filter((h) => h.dang_hoc)} nhom={[...nhomMap.values()]} o={o} />}
        </Card>
      </>}
      aside={<>
        <Card>
          <CardTitle icon={<Info className="h-6 w-6 text-xanh-600" />}>Chú giải trạng thái</CardTitle>
          <ul className="space-y-2.5 text-[0.95rem]">
            <li className="flex items-center gap-3"><OIcon kieu="da_cham" size={26} /> Đã chấm / đã hoàn thành</li>
            <li className="flex items-center gap-3"><OIcon kieu="cho_cham" size={26} /> Đã nộp, chờ chấm</li>
            <li className="flex items-center gap-3"><OIcon kieu="canh_bao" size={26} /> Nộp trễ / Cần nộp lại</li>
            <li className="flex items-center gap-3"><OIcon kieu="khong_nop" size={26} /> Không nộp bài (quá hạn)</li>
            <li className="flex items-center gap-3"><OIcon kieu="trung_tinh" size={26} /> Chưa đến hạn / Chưa học / Miễn</li>
            <li className="flex items-center gap-3"><span className="w-[26px] text-center">🙋</span> Em báo chưa làm được</li>
          </ul>
        </Card>
        <Card>
          <CardTitle icon={<CalendarDays className="h-6 w-6 text-xanh-600" />}>Tiến độ lớp</CardTitle>
          <div className="flex items-center gap-4">
            <ProgressRing value={pt.phanTram} size={100} />
            <div><p className="text-xl font-extrabold">Lớp {lop?.ten_lop}</p><p className="text-sm text-slate-500">{pt.daNop}/{pt.tong} lượt bài bắt buộc đã nộp</p></div>
          </div>
        </Card>
        <RobotCard img={IMG.tablet} title="Theo dõi sát sao, hỗ trợ kịp thời!" />
      </>}
    />
  );
}
