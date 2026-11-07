"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal, ConfirmButton } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ActionForm, SubmitButton } from "@/components/ui/ActionForm";
import { LessonIcon, DS_ICON, DS_MAU } from "@/components/ui/Misc";
import { Pill } from "@/components/ui/Pill";
import { luuLoaiBuoi, luuDanhMuc, xoaDanhMuc } from "@/lib/actions/gv/caidat";
import type { LoaiBuoi } from "@/lib/types";

const TEN_MAU: Record<string, string> = { blue: "Xanh dương", orange: "Cam", purple: "Tím", green: "Xanh lá", red: "Cam đậm (nổi bật)", teal: "Xanh ngọc", gray: "Xám" };

/** Danh mục loại buổi (màu, icon, có bài nộp, tính điểm, nổi bật, từ khóa nhận diện Excel) */
export function LoaiBuoiList({ ds }: { ds: LoaiBuoi[] }) {
  const [sua, setSua] = useState<Partial<LoaiBuoi> | null>(null);
  return (
    <div>
      <ul className="divide-y divide-vien">
        {ds.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center gap-3 py-2.5">
            <LessonIcon icon={l.icon} mau={l.mau} size={36} />
            <span className="font-semibold">{l.ten}</span>
            {l.noi_bat && <Pill mau="orangeStrong">nổi bật</Pill>}{l.co_bai_nop_mac_dinh && <Pill>có bài nộp</Pill>}{l.tinh_diem && <Pill mau="green">tính điểm</Pill>}
            <span className="text-xs text-slate-500">từ khóa: {l.tu_khoa || "—"}</span>
            <span className="ml-auto flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setSua(l)}>Sửa</Button>
              <ConfirmButton action={xoaDanhMuc.bind(null, "lesson_types", l.id)} variant="ghost" danger title={`Xóa loại “${l.ten}”?`} message="Các buổi đang dùng loại này sẽ hiển thị không có loại. Có thể khôi phục bằng cách tạo lại.">Xóa</ConfirmButton>
            </span>
          </li>
        ))}
      </ul>
      <Button size="sm" className="mt-3" onClick={() => setSua({ mau: "blue", icon: "book-open" })}><Plus className="h-4 w-4" /> Thêm loại buổi</Button>
      <Modal open={!!sua} onClose={() => setSua(null)} title={sua?.id ? "Sửa loại buổi" : "Thêm loại buổi"}>
        {sua && (
          <ActionForm action={luuLoaiBuoi} onOk={() => setSua(null)} className="space-y-3">
            {sua.id && <input type="hidden" name="id" value={sua.id} />}
            <div><label className="label" htmlFor="lb-ten">Tên</label><input id="lb-ten" name="ten" required defaultValue={sua.ten} className="input" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="lb-mau">Màu</label><select id="lb-mau" name="mau" defaultValue={sua.mau} className="input">{DS_MAU.map((m) => <option key={m} value={m}>{TEN_MAU[m] ?? m}</option>)}</select></div>
              <div><label className="label" htmlFor="lb-icon">Biểu tượng</label><select id="lb-icon" name="icon" defaultValue={sua.icon} className="input">{DS_ICON.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
            </div>
            <div><label className="label" htmlFor="lb-tk">Từ khóa nhận diện khi nhập Excel (cách nhau dấu phẩy)</label><input id="lb-tk" name="tu_khoa" defaultValue={sua.tu_khoa ?? ""} className="input" placeholder="kiểm tra, đánh giá" /></div>
            <div><label className="label" htmlFor="lb-tt">Thứ tự hiển thị</label><input id="lb-tt" name="thu_tu" type="number" defaultValue={sua.thu_tu ?? 0} className="input" /></div>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2"><input type="checkbox" name="co_bai_nop_mac_dinh" defaultChecked={sua.co_bai_nop_mac_dinh} /> Có bài nộp</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" name="tinh_diem" defaultChecked={sua.tinh_diem} /> Tính điểm</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" name="noi_bat" defaultChecked={sua.noi_bat} /> Nổi bật (nền cam)</label>
            </div>
            <div className="flex justify-end"><SubmitButton>Lưu</SubmitButton></div>
          </ActionForm>
        )}
      </Modal>
    </div>
  );
}

/** Danh mục đơn giản: phân loại tài liệu / nhận xét mẫu / mẫu tin nhắn phụ huynh */
export function DanhMucDon({ bang, ds }: { bang: "material_categories" | "comment_templates" | "message_templates"; ds: { id: string; ten?: string; noi_dung?: string; thu_tu?: number; mac_dinh?: boolean }[] }) {
  const [sua, setSua] = useState<(typeof ds)[number] | null>(null);
  const coTen = bang !== "comment_templates";
  const coND = bang !== "material_categories";
  return (
    <div>
      <ul className="divide-y divide-vien">
        {ds.map((x) => (
          <li key={x.id} className="flex items-start gap-3 py-2.5">
            <div className="min-w-0 flex-1">{coTen && <p className="font-semibold">{x.ten} {x.mac_dinh && <Pill mau="green">mặc định</Pill>}</p>}{coND && <p className="line-clamp-2 text-sm text-slate-600">{x.noi_dung}</p>}</div>
            <Button size="sm" variant="ghost" onClick={() => setSua(x)}>Sửa</Button>
            <ConfirmButton action={xoaDanhMuc.bind(null, bang, x.id)} variant="ghost" danger title="Xóa mục này?" message={x.ten ?? x.noi_dung}>Xóa</ConfirmButton>
          </li>
        ))}
      </ul>
      <Button size="sm" className="mt-3" onClick={() => setSua({ id: "" })}><Plus className="h-4 w-4" /> Thêm</Button>
      <Modal open={!!sua} onClose={() => setSua(null)} title={sua?.id ? "Sửa" : "Thêm mới"}>
        {sua && (
          <ActionForm action={luuDanhMuc} onOk={() => setSua(null)} className="space-y-3">
            <input type="hidden" name="bang" value={bang} />
            {sua.id && <input type="hidden" name="id" value={sua.id} />}
            {coTen && <div><label className="label" htmlFor="dm-ten">Tên</label><input id="dm-ten" name="ten" required defaultValue={sua.ten} className="input" /></div>}
            {coND && <div><label className="label" htmlFor="dm-nd">Nội dung</label><textarea id="dm-nd" name="noi_dung" required rows={bang === "message_templates" ? 5 : 2} defaultValue={sua.noi_dung} className="input" /></div>}
            {bang === "message_templates" && <p className="text-xs text-slate-500">Biến dùng được: {"{ten_hs}"} {"{lop}"} {"{danh_sach_bai}"} {"{han_nop}"}</p>}
            {bang !== "message_templates" && <div><label className="label" htmlFor="dm-tt">Thứ tự</label><input id="dm-tt" name="thu_tu" type="number" defaultValue={sua.thu_tu ?? 0} className="input" /></div>}
            {bang === "message_templates" && <label className="inline-flex items-center gap-2"><input type="checkbox" name="mac_dinh" defaultChecked={sua.mac_dinh} /> Dùng làm mẫu mặc định</label>}
            <div className="flex justify-end"><SubmitButton>Lưu</SubmitButton></div>
          </ActionForm>
        )}
      </Modal>
    </div>
  );
}
