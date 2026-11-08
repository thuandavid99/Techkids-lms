"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ui/ActionForm";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { MarkdownEditor } from "./MarkdownEditor";
import { luuBaiTap, datHanNop } from "@/lib/actions/gv/bt";

export interface BaiTapVals {
  id: string; ma: string; tieu_de: string; de_bai: string; diem_toi_da: number; loai_nop: string; cho_nop_tre: boolean;
  khoa_nop: boolean; tinh_diem: boolean; bat_buoc: boolean; he_so: number; hoc_ky: number; hien_thi: boolean;
}

/** Form soạn bài tập; hỏi "Tất cả lớp / Chỉ lớp này" khi chương trình dùng cho nhiều lớp (mục 2.2) */
// suaChung = false (giáo viên thường): chỉ sửa bản riêng cho lớp mình
export function BaiTapForm({ v, lops, soBaiNop, banRieng, suaChung = true }: { v: BaiTapVals; lops: { id: string; ten_lop: string }[]; soBaiNop: number; banRieng: Record<string, BaiTapVals>; suaChung?: boolean }) {
  const [phamVi, setPhamVi] = useState(suaChung ? "tat_ca" : lops[0]?.id ?? "tat_ca");
  const [baoLop, setBaoLop] = useState(false);
  const cur = phamVi === "tat_ca" ? v : banRieng[phamVi] ?? v;
  const Chk = ({ n, l, d }: { n: string; l: string; d: boolean }) => (
    <label className="inline-flex items-center gap-2"><input type="checkbox" name={n} defaultChecked={d} className="h-4 w-4 accent-blue-600" /> {l}</label>
  );
  return (
    <ActionForm action={luuBaiTap} className="space-y-4" key={phamVi}>
      <input type="hidden" name="id" value={v.id} />
      {(suaChung ? lops.length > 1 : lops.length > 0) && (
        <div className="rounded-2xl border border-xanh-100 bg-xanh-50 p-3">
          <p className="mb-2 font-semibold">Thay đổi này áp dụng cho:</p>
          {!suaChung && <p className="mb-2 text-xs text-slate-600">Bài tập chung do quản trị soạn. Thầy/cô sửa được <b>bản riêng</b> cho lớp mình.</p>}
          <div className="flex flex-wrap gap-3">
            {suaChung && <label className="inline-flex items-center gap-2"><input type="radio" name="pham_vi" value="tat_ca" checked={phamVi === "tat_ca"} onChange={() => setPhamVi("tat_ca")} /> <b>Tất cả lớp</b> dùng chương trình này</label>}
            {lops.map((l) => (
              <label key={l.id} className="inline-flex items-center gap-2"><input type="radio" name="pham_vi" value={l.id} checked={phamVi === l.id} onChange={() => setPhamVi(l.id)} /> Chỉ lớp {l.ten_lop}{banRieng[l.id] ? " (đang có bản riêng)" : ""}</label>
            ))}
          </div>
        </div>
      )}
      {soBaiNop > 0 && <p className="rounded-xl bg-cam-50 px-3 py-2 text-sm text-cam-600">⚠️ Đã có <b>{soBaiNop} bài nộp</b>. Sửa đề/hạn vẫn được, nhưng nên báo cho lớp biết.</p>}
      <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
        <div><label className="label" htmlFor="ma">Mã bài</label><input id="ma" name="ma" defaultValue={cur.ma} className="input" placeholder="7.1" /></div>
        <div><label className="label" htmlFor="td">Tên bài tập</label><input id="td" name="tieu_de" required defaultValue={cur.tieu_de} className="input" /></div>
      </div>
      <div><span className="label">Đề bài</span><MarkdownEditor name="de_bai" defaultValue={cur.de_bai} rows={10} placeholder="Viết đề bài… (có thể chèn khối code mẫu)" /></div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div><label className="label" htmlFor="ln">Loại bài nộp</label>
          <select id="ln" name="loai_nop" defaultValue={cur.loai_nop} className="input">
            <option value="code">Nộp code</option><option value="file">Nộp file</option><option value="ca_hai">Cả hai</option><option value="ngoai_he_thong">Ngoài hệ thống</option>
          </select></div>
        <div><label className="label" htmlFor="dm">Điểm tối đa</label><input id="dm" name="diem_toi_da" type="number" step="0.5" min="1" max="100" defaultValue={cur.diem_toi_da} className="input" /></div>
        <div><label className="label" htmlFor="hs">Hệ số</label><input id="hs" name="he_so" type="number" step="0.5" min="0.5" max="10" defaultValue={cur.he_so} className="input" /></div>
        <div><label className="label" htmlFor="hk">Học kỳ</label><select id="hk" name="hoc_ky" defaultValue={cur.hoc_ky} className="input"><option value="1">Học kỳ 1</option><option value="2">Học kỳ 2</option></select></div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Chk n="bat_buoc" l="Bắt buộc (bỏ tích = tùy chọn)" d={cur.bat_buoc} />
        <Chk n="cho_nop_tre" l="Cho phép nộp trễ" d={cur.cho_nop_tre} />
        <Chk n="khoa_nop" l="Khóa nộp" d={cur.khoa_nop} />
        <Chk n="tinh_diem" l="Tính vào điểm" d={cur.tinh_diem} />
        <Chk n="hien_thi" l="Hiện cho học sinh" d={cur.hien_thi} />
      </div>
      {soBaiNop > 0 && (
        <div>
          <label className="inline-flex items-center gap-2"><input type="checkbox" name="bao_lop" checked={baoLop} onChange={(e) => setBaoLop(e.target.checked)} /> Gửi thông báo cho lớp</label>
          {baoLop && <div className="mt-2 flex flex-wrap gap-3">{lops.map((l) => <label key={l.id} className="inline-flex items-center gap-1.5"><input type="checkbox" name="lop_bao" value={l.id} defaultChecked /> {l.ten_lop}</label>)}</div>}
        </div>
      )}
      <SubmitButton size="lg">Lưu bài tập</SubmitButton>
    </ActionForm>
  );
}

/** Bảng hạn nộp từng lớp (giờ Việt Nam) */
export function HanNopLop({ assignmentId, ds }: { assignmentId: string; ds: { classId: string; ten: string; han: string }[] }) {
  const [vals, setVals] = useState(Object.fromEntries(ds.map((d) => [d.classId, d.han])));
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  if (ds.length === 0) return <p className="text-sm text-slate-500">Chưa có lớp nào dùng chương trình này. Hãy “Áp dụng cho lớp” trước.</p>;
  return (
    <ul className="space-y-2">
      {ds.map((d) => (
        <li key={d.classId} className="flex flex-wrap items-center gap-2">
          <span className="w-24 font-semibold">Lớp {d.ten}</span>
          <input type="datetime-local" value={vals[d.classId] ?? ""} onChange={(e) => setVals((x) => ({ ...x, [d.classId]: e.target.value }))} className="input !w-56" aria-label={`Hạn nộp lớp ${d.ten}`} />
          <Button size="sm" variant="outline" disabled={pending || vals[d.classId] === d.han}
            onClick={() => start(async () => { const kq = await datHanNop(assignmentId, d.classId, vals[d.classId] ?? ""); if (kq.ok) { toast(kq.tb!); router.refresh(); } else toast(kq.loi!, "loi"); })}>Lưu hạn</Button>
        </li>
      ))}
    </ul>
  );
}
