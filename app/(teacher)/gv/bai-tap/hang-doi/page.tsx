import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cacLop, dongBaiTatCa, toDongBai } from "@/lib/server/data";
import { Card, PageHeader } from "@/components/ui/Card";
import { LinkTabs } from "@/components/ui/Misc";
import { NhanBai } from "@/components/ui/Pill";
import { ButtonLink, btnClass } from "@/components/ui/Button";
import { ActionButton } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/States";
import { daHoTro } from "@/lib/actions/gv/cham";
import { tinhTrangThai } from "@/lib/domain/status";
import { tenBaiTap } from "@/lib/domain/naming";
import { fmtShort } from "@/lib/domain/time";

export const metadata = { title: "Hàng đợi chấm bài" };

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string; lop?: string; bai?: string }> }) {
  const { tab = "cho-cham", lop = "", bai = "" } = await searchParams;
  const sb = await createClient();
  const [lops, all] = await Promise.all([cacLop(sb), dongBaiTatCa(sb)]);
  const tenLop = new Map(lops.map((l) => [l.id, l.ten_lop]));
  const now = new Date();
  const rows = all.map(toDongBai).filter((r) => (!lop || r.class_id === lop) && (!bai || r.assignment_id === bai));
  const choCham = rows.filter((r) => r.trang_thai === "da_nop").sort((a, b) => (a.nop_luc_moi_nhat ?? "").localeCompare(b.nop_luc_moi_nhat ?? ""));
  const canHoTro = rows.filter((r) => tinhTrangThai(r, now).coChuaLamDuoc).sort((a, b) => (b.danh_dau_luc ?? "").localeCompare(a.danh_dau_luc ?? ""));
  const baiDs = [...new Map(all.map((r) => [r.assignment_id, tenBaiTap(r.ma, r.tieu_de)])).entries()];
  const q = (t: string) => `/gv/bai-tap/hang-doi?` + new URLSearchParams({ tab: t, ...(lop && { lop }), ...(bai && { bai }) });
  const cumTen = (r: (typeof rows)[number]) => <>{tenLop.get(r.class_id) ?? "?"} · <b>{r.ho_ten}</b> ({r.ma_hs}) · {tenBaiTap(r.ma, r.tieu_de)}</>;

  return (
    <Card>
      <PageHeader title="Hàng đợi chấm bài" actions={choCham[0] && <ButtonLink href={`/gv/bai-tap/cham/${choCham[0].submission_id}${lop ? `?lop=${lop}` : ""}`}>Chấm tiếp ({choCham.length})</ButtonLink>} />
      <form className="mb-4 flex flex-wrap gap-2" action="/gv/bai-tap/hang-doi">
        <input type="hidden" name="tab" value={tab} />
        <select name="lop" defaultValue={lop} className="input !w-auto !rounded-2xl" aria-label="Lọc lớp">
          <option value="">Tất cả lớp</option>{lops.map((l) => <option key={l.id} value={l.id}>Lớp {l.ten_lop}</option>)}
        </select>
        <select name="bai" defaultValue={bai} className="input !w-auto max-w-[320px] !rounded-2xl" aria-label="Lọc bài">
          <option value="">Tất cả bài</option>{baiDs.map(([id, t]) => <option key={id} value={id}>{t}</option>)}
        </select>
        <button className={btnClass("outline", "md")}>Lọc</button>
      </form>
      <LinkTabs active={tab} tabs={[
        { key: "cho-cham", label: `Chờ chấm (${choCham.length})`, href: q("cho-cham") },
        { key: "can-ho-tro", label: `🙋 Cần hỗ trợ (${canHoTro.length})`, href: q("can-ho-tro") },
      ]} />
      <div className="pt-4">
        {tab === "cho-cham" ? (choCham.length === 0 ? <EmptyState title="Không còn bài chờ chấm 🎉" hint="Thầy đã chấm hết rồi!" /> : (
          <ul className="divide-y divide-vien rounded-2xl border border-vien bg-white">
            {choCham.map((r) => (
              <li key={r.submission_id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1 text-[0.95rem]">{cumTen(r)} · {fmtShort(r.nop_luc_moi_nhat)}</div>
                <NhanBai kq={tinhTrangThai(r, now)} />
                <ButtonLink href={`/gv/bai-tap/cham/${r.submission_id}${lop ? `?lop=${lop}` : ""}`} size="sm">Chấm</ButtonLink>
              </li>
            ))}
          </ul>
        )) : (canHoTro.length === 0 ? <EmptyState title="Không có em nào cần hỗ trợ" /> : (
          <ul className="divide-y divide-vien rounded-2xl border border-vien bg-white">
            {canHoTro.map((r) => (
              <li key={`${r.student_id}:${r.assignment_id}`} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1 text-[0.95rem]">
                  {cumTen(r)} · báo lúc {fmtShort(r.danh_dau_luc)}
                  {r.ghi_chu_co && <p className="mt-1 rounded-lg bg-tim-50 px-2 py-1 text-sm text-tim-500">“{r.ghi_chu_co}”</p>}
                </div>
                {r.submission_id ? <Link href={`/gv/bai-tap/cham/${r.submission_id}`} className={btnClass("outline", "sm")}>Mở bài</Link> : <span className="text-sm text-slate-500">Chưa nộp bài</span>}
                <ActionButton action={daHoTro.bind(null, r.assignment_id, r.student_id)} variant="secondary">Đã hỗ trợ</ActionButton>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </Card>
  );
}
