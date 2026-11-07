"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { apDungChoLop } from "@/lib/actions/gv/ct";
import { tinhNgayHoc } from "@/lib/domain/schedule";
import { TEN_THU, fmtDate, isoDow } from "@/lib/domain/time";

interface Lop { id: string; ten_lop: string; ctId: string | null; ngayBatDau: string | null; thu: number[] }
interface Buoi { id: string; ten: string; nhan: string; classId: string | null }

/** Áp dụng chương trình cho lớp: chọn lớp, ngày bắt đầu, các thứ học → xem trước ngày từng buổi → xác nhận */
export function ApDung({ lops, cts, buoiTheoCt, lopMacDinh, ctMacDinh }: { lops: Lop[]; cts: { id: string; ten: string }[]; buoiTheoCt: Record<string, Buoi[]>; lopMacDinh: string; ctMacDinh: string }) {
  const l0 = lops.find((l) => l.id === lopMacDinh) ?? lops[0];
  const [lop, setLop] = useState(l0?.id ?? "");
  const [ct, setCt] = useState(ctMacDinh || l0?.ctId || cts[0]?.id || "");
  const [bd, setBd] = useState(l0?.ngayBatDau ?? new Date().toISOString().slice(0, 10));
  const [thu, setThu] = useState<number[]>(l0?.thu?.length ? l0.thu : [1, 4]);
  const [sua, setSua] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const lopObj = lops.find((l) => l.id === lop);
  const buoi = (buoiTheoCt[ct] ?? []).filter((b) => !b.classId || b.classId === lop);
  const ngay = useMemo(() => {
    try { return thu.length && bd ? tinhNgayHoc(bd, thu, buoi.map((b) => b.nhan)) : []; } catch { return []; }
  }, [bd, thu, buoi]);
  const chonLop = (id: string) => {
    setLop(id); setSua({});
    const l = lops.find((x) => x.id === id);
    if (l?.ctId) setCt(l.ctId);
    if (l?.ngayBatDau) setBd(l.ngayBatDau);
    if (l?.thu?.length) setThu(l.thu);
  };
  if (!lops.length) return <p>Chưa có lớp nào. Hãy tạo lớp ở mục Quản lý lớp.</p>;
  if (!cts.length) return <p>Chưa có chương trình nào. Hãy tạo hoặc nhập PPCT trước.</p>;
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <label><span className="label">Lớp</span><select className="input" value={lop} onChange={(e) => chonLop(e.target.value)}>{lops.map((l) => <option key={l.id} value={l.id}>Lớp {l.ten_lop}</option>)}</select></label>
        <label><span className="label">Chương trình</span><select className="input" value={ct} onChange={(e) => { setCt(e.target.value); setSua({}); }}>{cts.map((c) => <option key={c.id} value={c.id}>{c.ten}</option>)}</select></label>
        <label><span className="label">Ngày bắt đầu</span><input type="date" className="input" value={bd} onChange={(e) => { setBd(e.target.value); setSua({}); }} /></label>
      </div>
      <fieldset>
        <legend className="label">Các thứ học trong tuần</legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((t) => (
            <label key={t} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 ${thu.includes(t) ? "border-xanh-600 bg-xanh-50 font-semibold text-xanh-700" : "border-vien bg-white"}`}>
              <input type="checkbox" className="sr-only" checked={thu.includes(t)} onChange={(e) => { setThu((x) => (e.target.checked ? [...x, t].sort() : x.filter((y) => y !== t))); setSua({}); }} />{TEN_THU[t]}
            </label>
          ))}
        </div>
      </fieldset>
      {lopObj?.ctId && lopObj.ctId !== ct && <p className="rounded-xl bg-cam-50 px-3 py-2 text-sm text-cam-600">⚠️ Lớp {lopObj.ten_lop} đang dùng chương trình khác. Đổi chương trình: học sinh sẽ thấy các buổi của chương trình mới; bài nộp cũ vẫn được giữ.</p>}
      {bd && isoDow(bd) && !thu.includes(isoDow(bd)) && <p className="text-sm text-slate-500">Ngày bắt đầu là {TEN_THU[isoDow(bd)]} — buổi 1 sẽ rơi vào thứ học gần nhất sau đó.</p>}
      <div>
        <p className="mb-2 font-semibold">Xem trước ngày học ({buoi.length} buổi) — có thể sửa từng ngày trước khi lưu</p>
        <div className="table-wrap max-h-[50dvh] rounded-2xl border border-vien bg-white">
          <table className="tbl"><thead><tr><th>Buổi</th><th>Ngày học</th><th>Thứ</th></tr></thead>
            <tbody>{buoi.map((b, i) => {
              const d = sua[b.id] ?? ngay[i] ?? "";
              return (
                <tr key={b.id}><td>{b.ten}</td>
                  <td><input type="date" value={d} onChange={(e) => setSua((x) => ({ ...x, [b.id]: e.target.value }))} className="input !w-40 !py-1" aria-label={`Ngày học ${b.ten}`} /></td>
                  <td className="text-sm text-slate-500">{d ? `${TEN_THU[isoDow(d)]} · ${fmtDate(d)}` : "—"}</td></tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>
      <Button size="lg" disabled={pending || !buoi.length || !thu.length} onClick={() => start(async () => {
        const map = Object.fromEntries(buoi.map((b, i) => [b.id, sua[b.id] ?? ngay[i] ?? ""]));
        const kq = await apDungChoLop({ classId: lop, ctId: ct, ngayBatDau: bd, thu, ngay: map });
        if (kq.ok) { toast(kq.tb!); router.push(`/gv/lop/${lop}/lich`); } else toast(kq.loi!, "loi");
      })}>{pending ? "Đang lưu…" : "Xác nhận áp dụng"}</Button>
    </div>
  );
}
