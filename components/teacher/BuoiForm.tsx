"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ui/ActionForm";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { MarkdownEditor } from "./MarkdownEditor";
import { luuBuoi, boBanRieng } from "@/lib/actions/gv/ct";
import { capNhatBuoiLop } from "@/lib/actions/gv/lop";

export interface BuoiVals { tieu_de: string; nhan_buoi: string; loai_id: string; tom_tat: string; noi_dung_kien_thuc: string; ban_nhap: boolean }
interface Opt { id: string; ten: string }

/** Form soạn buổi; hỏi "Tất cả lớp / Chỉ lớp này" khi chương trình dùng cho nhiều lớp (mục 2.2) */
// suaChung = false (giáo viên thường): không có lựa chọn "Tất cả lớp", chỉ sửa bản riêng lớp mình
export function BuoiForm({ id, v, banRieng, lops, loai, modules, topics, moduleId, topicId, laBuoiRieng, suaChung = true }: {
  id: string; v: BuoiVals; banRieng: Record<string, BuoiVals>; lops: Opt[]; loai: Opt[]; modules: Opt[]; topics: (Opt & { module_id: string })[];
  moduleId: string; topicId: string; laBuoiRieng: boolean; suaChung?: boolean;
}) {
  const macDinh = suaChung || laBuoiRieng ? "tat_ca" : lops[0]?.id ?? "tat_ca";
  const [phamVi, setPhamVi] = useState(macDinh);
  const [mod, setMod] = useState(moduleId);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const cur = phamVi === "tat_ca" ? v : banRieng[phamVi] ?? v;
  return (
    <ActionForm action={luuBuoi} className="space-y-4" key={phamVi}>
      <input type="hidden" name="id" value={id} />
      {!suaChung && !laBuoiRieng && lops.length === 0 && (
        <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">Chế độ xem: buổi chung do quản trị soạn. Lớp của thầy/cô chưa dùng chương trình này.</p>
      )}
      {(suaChung ? lops.length > 1 : lops.length > 0) && !laBuoiRieng && (
        <div className="rounded-2xl border border-xanh-100 bg-xanh-50 p-3">
          <p className="mb-2 font-semibold">Thay đổi này áp dụng cho:</p>
          {!suaChung && <p className="mb-2 text-xs text-slate-600">Nội dung chung do quản trị soạn. Thầy/cô sửa được <b>bản riêng</b> cho lớp mình (lớp khác không bị ảnh hưởng).</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {suaChung && <label className="inline-flex items-center gap-2"><input type="radio" name="pham_vi" value="tat_ca" checked={phamVi === "tat_ca"} onChange={() => setPhamVi("tat_ca")} /> <b>Tất cả lớp</b> đang dùng chương trình này</label>}
            {lops.map((l) => <label key={l.id} className="inline-flex items-center gap-2"><input type="radio" name="pham_vi" value={l.id} checked={phamVi === l.id} onChange={() => setPhamVi(l.id)} /> Chỉ lớp {l.ten}{banRieng[l.id] ? " (đang có bản riêng)" : ""}</label>)}
          </div>
          {phamVi !== "tat_ca" && banRieng[phamVi] && (
            <Button size="sm" variant="outlineGray" className="mt-2" disabled={pending} onClick={() => start(async () => { const kq = await boBanRieng(id, phamVi); if (kq.ok) { toast(kq.tb!); setPhamVi(macDinh); router.refresh(); } else toast(kq.loi!, "loi"); })}>Bỏ bản riêng, dùng nội dung chung</Button>
          )}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-[120px_1fr_200px]">
        <div><label className="label" htmlFor="nb">Nhãn buổi</label><input id="nb" name="nhan_buoi" defaultValue={cur.nhan_buoi} className="input" placeholder="7 hoặc 10–11" /></div>
        <div><label className="label" htmlFor="td">Tên bài / chủ đề</label><input id="td" name="tieu_de" required defaultValue={cur.tieu_de} className="input" /></div>
        <div><label className="label" htmlFor="lo">Loại buổi</label><select id="lo" name="loai_id" defaultValue={cur.loai_id} className="input"><option value="">—</option>{loai.map((l) => <option key={l.id} value={l.id}>{l.ten}</option>)}</select></div>
      </div>
      {phamVi === "tat_ca" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label className="label" htmlFor="md">Module</label><select id="md" name="module_id" value={mod} onChange={(e) => setMod(e.target.value)} className="input"><option value="">(chưa xếp module)</option>{modules.map((m) => <option key={m.id} value={m.id}>{m.ten}</option>)}</select></div>
          <div><label className="label" htmlFor="cd">Chủ đề (tùy chọn)</label><select id="cd" name="topic_id" defaultValue={topicId} className="input"><option value="">—</option>{topics.filter((t) => t.module_id === mod).map((t) => <option key={t.id} value={t.id}>{t.ten}</option>)}</select></div>
          <div><label className="label" htmlFor="cdm">…hoặc tạo chủ đề mới</label><input id="cdm" name="chu_de_moi" className="input" placeholder="Ví dụ: Cấu trúc rẽ nhánh" /></div>
        </div>
      )}
      <div><label className="label" htmlFor="tt">Tóm tắt / nội dung (hiện dưới tiêu đề)</label><textarea id="tt" name="tom_tat" rows={2} defaultValue={cur.tom_tat} className="input" /></div>
      <div><span className="label">Kiến thức (Markdown — có nút chèn khối code, bấm “Xem trước” để kiểm tra)</span><MarkdownEditor name="noi_dung_kien_thuc" defaultValue={cur.noi_dung_kien_thuc} rows={16} placeholder={"## 1. Biến trong Python\nBiến là nơi lưu trữ dữ liệu…"} /></div>
      {cur.ban_nhap && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">Buổi đang ở chế độ <b>bản nháp</b>: học sinh chưa thấy. Bấm “Lưu” để công bố.</p>}
      <div className="flex flex-wrap gap-2">
        <SubmitButton name="nut" value="luu" size="lg">Lưu</SubmitButton>
        <SubmitButton name="nut" value="nhap" variant="outline" size="lg">Lưu nháp</SubmitButton>
        <a href={`/gv/chuong-trinh/buoi/${id}/xem-thu${phamVi !== "tat_ca" ? `?lop=${phamVi}` : ""}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center rounded-full px-5 font-semibold text-xanh-700 hover:bg-xanh-50">Xem thử như học sinh ↗</a>
      </div>
    </ActionForm>
  );
}

/** Cài đặt theo lớp cho MỘT buổi: ngày học, hiện/ẩn, hẹn giờ mở, đã dạy */
export function BuoiTheoLop({ lessonId, ds }: { lessonId: string; ds: { classId: string; ten: string; ngay_hoc: string; hien_thi: boolean; ngay_mo: string; da_day: boolean }[] }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const luu = (c: string, v: Parameters<typeof capNhatBuoiLop>[2]) => start(async () => { const kq = await capNhatBuoiLop(c, lessonId, v); if (kq.ok) { toast("Đã lưu"); router.refresh(); } else toast(kq.loi!, "loi"); });
  if (!ds.length) return <p className="text-sm text-slate-500">Chưa lớp nào dùng chương trình này.</p>;
  return (
    <ul className="space-y-3">
      {ds.map((d) => (
        <li key={d.classId} className="rounded-xl border border-vien bg-white p-3 text-sm">
          <p className="mb-2 font-bold">Lớp {d.ten}</p>
          <div className="grid grid-cols-2 gap-2">
            <label>Ngày học<input type="date" defaultValue={d.ngay_hoc} disabled={pending} className="input !py-1" onBlur={(e) => e.target.value !== d.ngay_hoc && luu(d.classId, { ngay_hoc: e.target.value || null })} /></label>
            <label>Hẹn giờ mở<input type="datetime-local" defaultValue={d.ngay_mo} disabled={pending} className="input !py-1" onBlur={(e) => e.target.value !== d.ngay_mo && luu(d.classId, { ngay_mo: e.target.value || null })} /></label>
            <label className="flex items-center gap-2"><input type="checkbox" defaultChecked={d.hien_thi} disabled={pending} onChange={(e) => luu(d.classId, { hien_thi: e.target.checked })} /> Hiện cho HS</label>
            <label className="flex items-center gap-2"><input type="checkbox" defaultChecked={d.da_day} disabled={pending} onChange={(e) => luu(d.classId, { da_day: e.target.checked })} /> Đã dạy</label>
          </div>
        </li>
      ))}
    </ul>
  );
}
