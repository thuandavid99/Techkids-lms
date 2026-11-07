"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExcelPicker, ChonCot, type TrangTinh } from "./ExcelPicker";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { useToast } from "@/components/ui/Toast";
import { nhapDiem } from "@/lib/actions/gv/cham";

interface HS { id: string; ma_hs: string; ho_ten: string; class_id: string }
interface BT { id: string; ten: string; class_id: string; diem_toi_da: number; ngoai: boolean }

/** Nhập điểm từ Excel (Contest / Kiểm tra làm ngoài hệ thống): tải file → ghép cột → xem trước + cảnh báo → xác nhận */
export function NhapDiem({ lops, hs, bts }: { lops: { id: string; ten_lop: string }[]; hs: HS[]; bts: BT[] }) {
  const [lop, setLop] = useState(lops[0]?.id ?? "");
  const [bai, setBai] = useState("");
  const [sheets, setSheets] = useState<TrangTinh[] | null>(null);
  const [si, setSi] = useState(0);
  const [hd, setHd] = useState(0);
  const [cMa, setCMa] = useState(-1), [cDiem, setCDiem] = useState(-1), [cNx, setCNx] = useState(-1);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const btLop = bts.filter((b) => b.class_id === lop).sort((a, b) => Number(b.ngoai) - Number(a.ngoai));
  const bt = btLop.find((b) => b.id === bai);
  const rows = sheets?.[si]?.rows ?? [];
  const cot = rows[hd]?.o ?? [];

  const doc = (s: TrangTinh[]) => {
    setSheets(s); setSi(0);
    const r = s[0]?.rows ?? [];
    const h = Math.max(0, r.findIndex((x) => x.o.some((c) => /mã|ma hs|code/i.test(c))));
    setHd(h);
    const o = r[h]?.o ?? [];
    setCMa(o.findIndex((c) => /mã|ma hs/i.test(c)));
    setCDiem(o.findIndex((c) => /điểm|diem|score/i.test(c)));
    setCNx(o.findIndex((c) => /nhận xét|ghi chú/i.test(c)));
  };

  const xemTruoc = useMemo(() => {
    if (!bt || cMa < 0 || cDiem < 0) return [];
    const theoMa = new Map(hs.filter((h) => h.class_id === lop).map((h) => [h.ma_hs.toLowerCase(), h]));
    const daGap = new Set<string>();
    return rows.slice(hd + 1).filter((r) => r.o[cMa]).map((r) => {
      const ma = r.o[cMa].trim();
      const h = theoMa.get(ma.toLowerCase());
      const d = Number(String(r.o[cDiem] ?? "").replace(",", "."));
      let canh = "";
      if (!h) canh = "Mã không khớp học sinh nào trong lớp";
      else if (daGap.has(h.id)) canh = "Trùng mã trong file";
      else if (r.o[cDiem] === "" || Number.isNaN(d)) canh = "Thiếu điểm";
      else if (d < 0 || d > bt.diem_toi_da) canh = `Điểm ngoài khoảng 0–${bt.diem_toi_da}`;
      if (h) daGap.add(h.id);
      return { dong: r.dong, ma, h, d, nx: cNx >= 0 ? r.o[cNx] : "", canh };
    });
  }, [bt, cMa, cDiem, cNx, rows, hd, hs, lop]);
  const hopLe = xemTruoc.filter((x) => !x.canh);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label><span className="label">Lớp</span><select className="input" value={lop} onChange={(e) => { setLop(e.target.value); setBai(""); }}>{lops.map((l) => <option key={l.id} value={l.id}>Lớp {l.ten_lop}</option>)}</select></label>
        <label><span className="label">Bài tập / bài kiểm tra</span><select className="input" value={bai} onChange={(e) => setBai(e.target.value)}>
          <option value="">— Chọn bài —</option>{btLop.map((b) => <option key={b.id} value={b.id}>{b.ten}{b.ngoai ? " (ngoài hệ thống)" : ""}</option>)}
        </select></label>
      </div>
      <ExcelPicker onRead={(s) => doc(s)} />
      {sheets && (
        <div className="grid gap-3 rounded-2xl border border-vien bg-white p-4 sm:grid-cols-4">
          <label><span className="label">Trang tính</span><select className="input" value={si} onChange={(e) => setSi(Number(e.target.value))}>{sheets.map((s, i) => <option key={i} value={i}>{s.ten}</option>)}</select></label>
          <label><span className="label">Dòng tiêu đề</span><input type="number" min={1} className="input" value={hd + 1} onChange={(e) => setHd(Math.max(0, Number(e.target.value) - 1))} /></label>
          <ChonCot label="Cột mã học sinh" value={cMa} onChange={setCMa} cot={cot} batBuoc />
          <ChonCot label="Cột điểm" value={cDiem} onChange={setCDiem} cot={cot} batBuoc />
          <ChonCot label="Cột nhận xét" value={cNx} onChange={setCNx} cot={cot} />
        </div>
      )}
      {!bt && sheets && <p className="text-cam-600">Chọn bài tập để xem trước.</p>}
      {xemTruoc.length > 0 && (
        <div>
          <p className="mb-2 font-semibold">Xem trước: {hopLe.length} dòng hợp lệ, {xemTruoc.length - hopLe.length} dòng có cảnh báo (sẽ bỏ qua)</p>
          <div className="table-wrap max-h-[420px] rounded-2xl border border-vien bg-white">
            <table className="tbl"><thead><tr><th>Dòng</th><th>Mã HS</th><th>Họ tên</th><th>Điểm</th><th>Nhận xét</th><th>Kiểm tra</th></tr></thead>
              <tbody>{xemTruoc.map((x) => (
                <tr key={x.dong} className={x.canh ? "bg-do-50/60" : ""}><td>{x.dong}</td><td>{x.ma}</td><td>{x.h?.ho_ten ?? "—"}</td><td>{Number.isNaN(x.d) ? "—" : x.d}</td><td className="max-w-[220px] truncate">{x.nx}</td>
                  <td>{x.canh ? <Pill mau="red">{x.canh}</Pill> : <Pill mau="green" icon="check">OK</Pill>}</td></tr>
              ))}</tbody></table>
          </div>
          <Button size="lg" className="mt-4" disabled={pending || hopLe.length === 0} onClick={() => start(async () => {
            const kq = await nhapDiem(bt!.id, hopLe.map((x) => ({ studentId: x.h!.id, diem: x.d, nhanXet: x.nx })));
            if (kq.ok) { toast(kq.tb!); setSheets(null); router.refresh(); } else toast(kq.loi!, "loi");
          })}>{pending ? "Đang nhập…" : `Xác nhận nhập điểm cho ${hopLe.length} học sinh`}</Button>
        </div>
      )}
    </div>
  );
}
