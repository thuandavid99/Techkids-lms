"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ui/ActionForm";
import { ConfirmButton } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { dangThongBao, suaThongBao, xoaThongBao } from "@/lib/actions/gv/lop";
import { fmtDateTime } from "@/lib/domain/time";

export function SoanThongBao({ lops, macDinh }: { lops: { id: string; ten_lop: string }[]; macDinh: string }) {
  return (
    <ActionForm action={dangThongBao} resetOnOk className="space-y-3">
      <label className="label" htmlFor="nd">Nội dung thông báo</label>
      <textarea id="nd" name="noi_dung" rows={4} required maxLength={2000} className="input" placeholder="Ví dụ: Thứ 5 tuần này lớp nghỉ, học bù vào Thứ 7." />
      <fieldset>
        <legend className="label">Gửi cho lớp</legend>
        <div className="flex flex-wrap gap-3">
          {lops.map((l) => (
            <label key={l.id} className="inline-flex items-center gap-2 rounded-full border border-vien bg-white px-3 py-1.5">
              <input type="checkbox" name="lop" value={l.id} defaultChecked={l.id === macDinh} className="accent-blue-600" /> Lớp {l.ten_lop}
            </label>
          ))}
        </div>
      </fieldset>
      <SubmitButton>Đăng thông báo</SubmitButton>
    </ActionForm>
  );
}

export function DongThongBao({ a }: { a: { id: string; noi_dung: string; tao_luc: string } }) {
  const [sua, setSua] = useState(false);
  const [nd, setNd] = useState(a.noi_dung);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <li className="rounded-2xl border border-vien bg-white p-4">
      {sua ? (
        <div className="space-y-2">
          <textarea className="input" rows={3} value={nd} onChange={(e) => setNd(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" disabled={pending} onClick={() => start(async () => { const kq = await suaThongBao(a.id, nd); if (kq.ok) { toast(kq.tb!); setSua(false); router.refresh(); } else toast(kq.loi!, "loi"); })}>Lưu</Button>
            <Button size="sm" variant="outlineGray" onClick={() => setSua(false)}>Hủy</Button>
          </div>
        </div>
      ) : <p className="whitespace-pre-line">{a.noi_dung}</p>}
      <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
        <span>{fmtDateTime(a.tao_luc)}</span>
        {!sua && <span className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setSua(true)}>Sửa</Button>
          <ConfirmButton action={xoaThongBao.bind(null, a.id)} variant="ghost" danger title="Xóa thông báo?" message="Thông báo sẽ ẩn với học sinh và vào Thùng rác (khôi phục được trong 30 ngày)." confirmText="Xóa">Xóa</ConfirmButton>
        </span>}
      </div>
    </li>
  );
}
