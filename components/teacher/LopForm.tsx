"use client";
import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ActionForm, SubmitButton } from "@/components/ui/ActionForm";
import { luuLop } from "@/lib/actions/gv/lop";

/** Hộp thoại Thêm / Sửa lớp */
export function LopForm({ lop, gvs = [] }: { lop?: { id: string; ten_lop: string; nam_hoc: string }; gvs?: { id: string; ho_ten: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {lop ? <Button variant="outline" size="sm" onClick={() => setOpen(true)}><Pencil className="h-4 w-4" /> Sửa</Button>
        : <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Thêm lớp</Button>}
      <Modal open={open} onClose={() => setOpen(false)} title={lop ? `Sửa lớp ${lop.ten_lop}` : "Thêm lớp"}>
        <ActionForm action={luuLop} onOk={() => setOpen(false)} className="space-y-3">
          {lop && <input type="hidden" name="id" value={lop.id} />}
          <div><label className="label" htmlFor="ten_lop">Tên lớp</label><input id="ten_lop" name="ten_lop" required defaultValue={lop?.ten_lop} placeholder="6A1" className="input" /></div>
          <div><label className="label" htmlFor="nam_hoc">Năm học</label><input id="nam_hoc" name="nam_hoc" defaultValue={lop?.nam_hoc ?? "2026-2027"} className="input" /></div>
          {!lop && gvs.length > 0 && (
            <div>
              <p className="label">Giáo viên phụ trách</p>
              <div className="flex flex-wrap gap-2">
                {gvs.map((g) => (
                  <label key={g.id} className="inline-flex items-center gap-2 rounded-full border border-vien px-3 py-1.5 text-sm">
                    <input type="checkbox" name="gv" value={g.id} className="accent-xanh-600" /> {g.ho_ten}
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500">Đổi sau ở mục Giáo viên → Gán lớp.</p>
            </div>
          )}
          <div className="flex justify-end pt-2"><SubmitButton>Lưu</SubmitButton></div>
        </ActionForm>
      </Modal>
    </>
  );
}
