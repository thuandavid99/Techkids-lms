"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileUp, FileDown, CalendarRange, Copy, Pencil } from "lucide-react";
import { Button, ButtonLink, btnClass } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ActionForm, SubmitButton } from "@/components/ui/ActionForm";
import { useToast } from "@/components/ui/Toast";
import { themModule, themBuoi, nhanBanChuongTrinh, taoChuongTrinh, suaChuongTrinh, xoaChuongTrinh } from "@/lib/actions/gv/ct";
import type { KQ } from "@/lib/types";

/** Thanh nút trên cùng màn Chương trình học + chọn chương trình */
export function CTToolbar({ cts, ct, moduleCuoi, lops }: { cts: { id: string; ten: string; mo_ta: string | null }[]; ct: { id: string; ten: string; mo_ta: string | null } | null; moduleCuoi: string | null; lops: { id: string; ten_lop: string }[] }) {
  const [tao, setTao] = useState(false);
  const [sua, setSua] = useState(false);
  const [ten, setTen] = useState(ct?.ten ?? "");
  const [moTa, setMoTa] = useState(ct?.mo_ta ?? "");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const run = (fn: () => Promise<KQ>, sau?: (kq: KQ) => void) => start(async () => { const kq = await fn(); if (kq.ok) { if (kq.tb) toast(kq.tb); sau?.(kq); router.refresh(); } else toast(kq.loi ?? "Lỗi", "loi"); });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2">
          <span className="text-sm font-semibold">Chương trình:</span>
          <select className="input !w-auto max-w-[320px] !rounded-2xl font-semibold" value={ct?.id ?? ""} onChange={(e) => router.push(`/gv/chuong-trinh?ct=${e.target.value}`)}>
            {cts.map((c) => <option key={c.id} value={c.id}>{c.ten}</option>)}
          </select>
        </label>
        {ct && <Button variant="ghost" size="sm" onClick={() => setSua(true)}><Pencil className="h-4 w-4" /> Sửa tên</Button>}
        {ct && <Button variant="ghost" size="sm" disabled={pending} onClick={() => run(() => nhanBanChuongTrinh(ct.id), (kq) => router.push(`/gv/chuong-trinh?ct=${kq.data}`))}><Copy className="h-4 w-4" /> Nhân bản chương trình</Button>}
        <Button variant="ghost" size="sm" onClick={() => setTao(true)}><Plus className="h-4 w-4" /> Chương trình mới</Button>
      </div>
      {ct && (
        <div className="flex flex-wrap gap-2">
          <Button disabled={pending} onClick={() => run(() => themModule(ct.id, ""))}><Plus className="h-4 w-4" /> Thêm module</Button>
          <Button disabled={pending} variant="secondary" onClick={() => run(() => themBuoi(ct.id, moduleCuoi), (kq) => router.push(`/gv/chuong-trinh/buoi/${kq.data}`))}><Plus className="h-4 w-4" /> Thêm buổi</Button>
          <ButtonLink href={`/gv/chuong-trinh/nhap-excel?ct=${ct.id}`} variant="green"><FileUp className="h-4 w-4" /> Nhập từ Excel</ButtonLink>
          <a href={`/api/gv/xuat?loai=ppct&ct=${ct.id}`} className={btnClass("outline", "md")}><FileDown className="h-4 w-4" /> Xuất Excel</a>
          <ButtonLink href={`/gv/chuong-trinh/ap-dung?ct=${ct.id}`} variant="navy"><CalendarRange className="h-4 w-4" /> Áp dụng cho lớp ▾</ButtonLink>
        </div>
      )}
      <Modal open={tao} onClose={() => setTao(false)} title="Tạo chương trình mới">
        <ActionForm action={taoChuongTrinh} onOk={(kq) => { setTao(false); router.push(`/gv/chuong-trinh?ct=${kq.data}`); }} className="space-y-3">
          <div><label className="label" htmlFor="ct-ten">Tên chương trình</label><input id="ct-ten" name="ten" required className="input" placeholder="Python cơ bản – 46 buổi" /></div>
          <div><label className="label" htmlFor="ct-nh">Năm học</label><input id="ct-nh" name="nam_hoc" className="input" placeholder="2026-2027" /></div>
          <div><label className="label" htmlFor="ct-mt">Mô tả</label><textarea id="ct-mt" name="mo_ta" className="input" rows={2} /></div>
          <p className="text-sm text-slate-500">Mẹo: nếu đã có PPCT dạng Excel, dùng <b>Nhập từ Excel</b> sẽ nhanh hơn.</p>
          <div className="flex justify-end"><SubmitButton>Tạo</SubmitButton></div>
        </ActionForm>
      </Modal>
      <Modal open={sua} onClose={() => setSua(false)} title="Sửa chương trình">
        <div className="space-y-3">
          <input className="input" value={ten} onChange={(e) => setTen(e.target.value)} aria-label="Tên chương trình" />
          <textarea className="input" rows={2} value={moTa} onChange={(e) => setMoTa(e.target.value)} aria-label="Mô tả" />
          <p className="text-sm text-slate-500">Đang dùng cho: {lops.length ? lops.map((l) => l.ten_lop).join(", ") : "chưa lớp nào"}.</p>
          <div className="flex justify-between">
            <Button variant="outlineGray" onClick={() => { setSua(false); run(() => xoaChuongTrinh(ct!.id), () => router.push("/gv/chuong-trinh")); }}>Xóa chương trình</Button>
            <Button onClick={() => { setSua(false); run(() => suaChuongTrinh(ct!.id, ten, moTa)); }}>Lưu</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
