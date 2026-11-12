import { createClient } from "@/lib/supabase/server";
import { lopDangChon } from "@/lib/server/lop";
import { duLieuLop } from "@/lib/server/gv";
import { modulesCua, caiDat } from "@/lib/server/data";
import { Card, PageHeader } from "@/components/ui/Card";
import { btnClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { lapBangDiem } from "@/lib/domain/bang-diem";

export const metadata = { title: "Bảng điểm" };

export default async function Page({ searchParams }: { searchParams: Promise<{ lop?: string; hk?: string }> }) {
  const sp = await searchParams;
  const hk = sp.hk === "2" ? 2 : 1;
  const sb = await createClient();
  const { lops, lop } = await lopDangChon(sb, sp.lop);
  if (!lop) return <Card><EmptyState title="Chưa có lớp" /></Card>;
  const [{ rows }, { data: cc }, cd] = await Promise.all([duLieuLop(sb, lop.id), sb.from("class_curriculum").select("curriculum_id").eq("class_id", lop.id).maybeSingle(), caiDat(sb)]);
  const modules = cc ? await modulesCua(sb, cc.curriculum_id) : [];
  const bd = lapBangDiem(rows, modules, hk, Number(cd.lam_tron_diem ?? 1));
  return (
    <Card>
      <PageHeader back={{ href: "/gv/bao-cao", label: "Báo cáo" }} title={`Bảng điểm – Lớp ${lop.ten_lop} – Học kỳ ${hk}`}
        actions={<a href={`/api/gv/xuat?loai=bang-diem&lop=${lop.id}&hk=${hk}`} className={btnClass("navy", "md")}>Tải Excel</a>} />
      <form action="/gv/bao-cao/bang-diem" className="mb-4 flex flex-wrap gap-2">
        <select name="lop" defaultValue={lop.id} className="input !w-auto !rounded-2xl">{lops.map((l) => <option key={l.id} value={l.id}>Lớp {l.ten_lop}</option>)}</select>
        <select name="hk" defaultValue={hk} className="input !w-auto !rounded-2xl"><option value="1">Học kỳ 1</option><option value="2">Học kỳ 2</option></select>
        <button className={btnClass("outline", "md")}>Xem</button>
      </form>
      {bd.cot.length === 0 ? <EmptyState title="Chưa có bài tính điểm trong học kỳ này" /> : (
        <div className="table-wrap rounded-2xl border border-vien bg-white">
          <table className="tbl text-sm">
            <thead><tr><th className="sticky left-0 bg-white">Mã HS</th><th className="sticky left-16 bg-white">Họ tên</th>
              {bd.cot.map((c) => <th key={c.assignment_id} title={c.tieu_de} className="text-center">{c.ma}{c.he_so !== 1 && <span className="block text-[0.7rem] text-slate-500">hệ số {c.he_so}</span>}</th>)}
              {bd.modules.map((m) => <th key={m.id} className="bg-xanh-50 text-center">TB {m.ten.replace(/:.*/, "")}</th>)}
              <th className="bg-cam-50 text-center">TB HK{hk}</th></tr></thead>
            <tbody>{bd.hs.map((h) => (
              <tr key={h.id}><td className="sticky left-0 bg-white font-mono">{h.ma_hs}</td><td className="sticky left-16 bg-white whitespace-nowrap">{h.ho_ten}</td>
                {bd.cot.map((c) => <td key={c.assignment_id} className="text-center">{h.diem[c.assignment_id] ?? ""}</td>)}
                {bd.modules.map((m) => <td key={m.id} className="bg-xanh-50/50 text-center font-semibold">{h.tbModule[m.id] ?? ""}</td>)}
                <td className="bg-cam-50/60 text-center font-extrabold">{h.tb ?? ""}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-sm text-slate-500">TB = Σ(điểm quy thang 10 × hệ số) / Σ hệ số, chỉ tính bài đã chấm, không tính bài miễn nộp.</p>
    </Card>
  );
}
