import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile, laGiaoVien } from "@/lib/auth";
import { dongBaiHs, toDongBai, caiDat, modulesCua } from "@/lib/server/data";
import { BRAND, IMG } from "@/lib/brand";
import { PrintButton } from "@/components/shared/PrintButton";
import { tinhTrangThai, NHAN_CHAM, NHAN_THOI_GIAN } from "@/lib/domain/status";
import { diemTrungBinh, phanTramHoanThanh, tinhHuyHieu } from "@/lib/domain/stats";
import { tenBaiTap } from "@/lib/domain/naming";
import { fmtDate } from "@/lib/domain/time";

export const metadata = { title: "Phiếu tiến độ" };

/** Phiếu tiến độ: trang định dạng in A4 → In → Lưu PDF của trình duyệt */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const me = await getProfile();
  if (!me) redirect("/dang-nhap");
  const sb = await createClient();
  const cd = await caiDat(sb);
  // Giáo viên xem mọi em; học sinh chỉ xem của mình và khi thầy cho phép
  if (!laGiaoVien(me) && (me.id !== id || cd.hs_tai_phieu_tien_do !== true)) notFound();
  const { data: p } = await sb.from("profiles").select("ho_ten, ma_hs, class_id, classes!profiles_class_id_fkey(ten_lop, nam_hoc)").eq("id", id).maybeSingle();
  if (!p) notFound();
  const rows = (await dongBaiHs(sb, id)).map(toDongBai).filter((r) => r.da_mo);
  const { data: cc } = p.class_id ? await sb.from("class_curriculum").select("curriculum_id").eq("class_id", p.class_id).maybeSingle() : { data: null };
  const modules = cc ? await modulesCua(sb, cc.curriculum_id) : [];
  const now = new Date();
  const soLe = Number(cd.lam_tron_diem ?? 1);
  const lop = p.classes as unknown as { ten_lop: string; nam_hoc: string } | null;
  const pt = phanTramHoanThanh(rows, now);

  return (
    <main className="mx-auto max-w-[800px] bg-white p-6 text-[13px] text-black print:p-0">
      <div className="no-print mb-4 flex justify-end gap-2"><PrintButton /></div>
      <header className="flex items-center gap-4 border-b-2 border-navy-800 pb-3">
        <Image src={IMG.logo} alt="" width={64} height={64} className="rounded-full" />
        <div className="flex-1">
          <p className="text-lg font-extrabold">{BRAND.ten}</p>
          <p className="text-xs">{BRAND.slogan}</p>
        </div>
        <div className="text-right text-xs">Ngày in: {fmtDate(now)}</div>
      </header>
      <h1 className="my-4 text-center text-2xl font-extrabold uppercase">Phiếu tiến độ học tập</h1>
      <table className="mb-4 w-full"><tbody>
        <tr><td className="py-0.5">Học sinh: <b>{p.ho_ten}</b></td><td>Mã HS: <b>{p.ma_hs}</b></td></tr>
        <tr><td className="py-0.5">Lớp: <b>{lop?.ten_lop}</b></td><td>Năm học: <b>{lop?.nam_hoc}</b></td></tr>
      </tbody></table>
      <div className="mb-4 grid grid-cols-4 gap-2 text-center">
        {[["Điểm TB HK1", diemTrungBinh(rows, { hocKy: 1, soChuSo: soLe })], ["Điểm TB HK2", diemTrungBinh(rows, { hocKy: 2, soChuSo: soLe })], ["Hoàn thành", `${pt.phanTram}%`], ["Đã nộp", `${pt.daNop}/${pt.tong}`]].map(([t, v]) => (
          <div key={t as string} className="rounded border border-slate-300 p-2"><p className="text-xs">{t as string}</p><p className="text-xl font-bold">{v ?? "—"}</p></div>
        ))}
      </div>
      {modules.map((m) => {
        const ds = rows.filter((r) => r.module_id === m.id);
        if (!ds.length) return null;
        return (
          <section key={m.id} className="mb-4 break-inside-avoid">
            <h2 className="mb-1 font-bold">{m.ten} — TB: {diemTrungBinh(ds, { soChuSo: soLe }) ?? "—"}</h2>
            <table className="w-full border-collapse text-xs">
              <thead><tr className="bg-slate-100"><th className="border p-1 text-left">Bài tập</th><th className="border p-1">Nộp</th><th className="border p-1">Trạng thái</th><th className="border p-1">Điểm</th><th className="border p-1 text-left">Nhận xét</th></tr></thead>
              <tbody>{ds.map((r) => { const k = tinhTrangThai(r, now); return (
                <tr key={r.assignment_id}><td className="border p-1">{tenBaiTap(r.ma, r.tieu_de)}</td>
                  <td className="border p-1 text-center">{k.nhanThoiGian ? NHAN_THOI_GIAN[k.nhanThoiGian].text : "—"}</td>
                  <td className="border p-1 text-center">{NHAN_CHAM[k.trangThai].text}</td>
                  <td className="border p-1 text-center">{r.diem !== null ? Number(r.diem).toFixed(1) : ""}</td>
                  <td className="border p-1">{r.nhan_xet ?? ""}</td></tr>); })}</tbody>
            </table>
          </section>
        );
      })}
      <p className="mt-2">Huy hiệu: {tinhHuyHieu(rows, now).map((h) => h.ten).join(", ") || "Chưa có"}</p>
      <div className="mt-10 grid grid-cols-2 text-center"><div>Phụ huynh<br /><br /><br />(ký, ghi rõ họ tên)</div><div>Giáo viên<br /><br /><br />(ký, ghi rõ họ tên)</div></div>
    </main>
  );
}
