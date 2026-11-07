"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2, Eye, EyeOff, Download, Ban } from "lucide-react";
import { FileIcon } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmButton } from "@/components/ui/Modal";
import { ActionForm, SubmitButton } from "@/components/ui/ActionForm";
import { useToast } from "@/components/ui/Toast";
import { UploadButton } from "./UploadButton";
import { suaTaiLieu, datLopXem, xoaTaiLieu, thayFile, xinLinkTaiLieu, xacNhanTaiLieu, themLink } from "@/lib/actions/gv/tl";
import { kichThuocDep } from "@/lib/domain/files";
import type { KQ } from "@/lib/types";

export interface TLRow { id: string; tieu_de: string; nguon: "file" | "link"; url: string | null; ten_goc: string | null; kich_thuoc: number | null; loai: string | null; cho_phep_tai: boolean; hien_thi: boolean; lesson_id: string | null; lops: string[] }
interface Opt { id: string; ten: string }

/** Thêm tài liệu: tải file lên hoặc dán link */
export function ThemTaiLieu({ lessonId, cats }: { lessonId: string | null; cats: Opt[] }) {
  const [link, setLink] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <UploadButton bucket="materials" multiple xinLink={xinLinkTaiLieu} xacNhan={(p, t) => xacNhanTaiLieu(lessonId, p, t)}>Tải file lên</UploadButton>
      <Button variant="outline" size="sm" onClick={() => setLink(true)}><Link2 className="h-4 w-4" /> Thêm link</Button>
      <Modal open={link} onClose={() => setLink(false)} title="Thêm tài liệu dạng link">
        <ActionForm action={themLink} onOk={() => setLink(false)} className="space-y-3">
          {lessonId && <input type="hidden" name="lesson_id" value={lessonId} />}
          <div><label className="label" htmlFor="l-url">Đường link (Google Drive, YouTube, trang web…)</label><input id="l-url" name="url" required className="input" placeholder="https://" /></div>
          <div><label className="label" htmlFor="l-td">Tên hiển thị</label><input id="l-td" name="tieu_de" className="input" /></div>
          <div><label className="label" htmlFor="l-loai">Phân loại</label><select id="l-loai" name="loai" className="input"><option value="">—</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.ten}</option>)}</select></div>
          <div className="flex justify-end"><SubmitButton>Thêm</SubmitButton></div>
        </ActionForm>
      </Modal>
    </div>
  );
}

/** Một dòng tài liệu cho giáo viên: đổi tên, phân loại, ẩn/hiện, cho tải, chọn lớp xem, chuyển buổi, thay file, xóa */
export function TaiLieuDong({ m, cats, lops, buois, chon, onChon }: { m: TLRow; cats: Opt[]; lops: Opt[]; buois: Opt[]; chon?: boolean; onChon?: (v: boolean) => void }) {
  const [sua, setSua] = useState(false);
  const [ten, setTen] = useState(m.tieu_de);
  const [lopXem, setLopXem] = useState<string[]>(m.lops);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const run = (fn: () => Promise<KQ>) => start(async () => { const kq = await fn(); if (kq.ok) { if (kq.tb) toast(kq.tb); router.refresh(); } else toast(kq.loi!, "loi"); });
  return (
    <li className={`flex flex-wrap items-center gap-3 py-3 ${m.hien_thi ? "" : "opacity-60"}`}>
      {onChon && <input type="checkbox" checked={!!chon} onChange={(e) => onChon(e.target.checked)} aria-label={`Chọn ${m.tieu_de}`} className="h-4 w-4" />}
      <FileIcon ten={m.ten_goc ?? m.tieu_de} nguon={m.nguon} />
      <div className="min-w-0 flex-1">
        <a href={`/api/tai-ve?loai=tai-lieu&id=${m.id}${m.nguon === "file" ? "&xem=1" : ""}`} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-xanh-600">{m.tieu_de}</a>
        <p className="text-xs text-slate-500">{[cats.find((c) => c.id === m.loai)?.ten, m.nguon === "link" ? m.url : m.ten_goc, kichThuocDep(m.kich_thuoc), m.lops.length ? `chỉ lớp ${m.lops.map((l) => lops.find((x) => x.id === l)?.ten).join(", ")}` : "mọi lớp"].filter(Boolean).join(" · ")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <button title={m.hien_thi ? "Ẩn" : "Hiện"} disabled={pending} onClick={() => run(() => suaTaiLieu(m.id, { hien_thi: !m.hien_thi }))} className="rounded-lg p-1.5 hover:bg-slate-100">{m.hien_thi ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
        {m.nguon === "file" && <button title={m.cho_phep_tai ? "Đang cho tải về (bấm để chỉ cho xem)" : "Chỉ xem (bấm để cho tải)"} disabled={pending} onClick={() => run(() => suaTaiLieu(m.id, { cho_phep_tai: !m.cho_phep_tai }))} className="rounded-lg p-1.5 hover:bg-slate-100">{m.cho_phep_tai ? <Download className="h-4 w-4" /> : <Ban className="h-4 w-4" />}</button>}
        <Button size="sm" variant="ghost" onClick={() => setSua(true)}>Sửa</Button>
      </div>
      <Modal open={sua} onClose={() => setSua(false)} title="Sửa tài liệu">
        <div className="space-y-3">
          <div><label className="label" htmlFor={`t-${m.id}`}>Tên hiển thị</label><div className="flex gap-2"><input id={`t-${m.id}`} className="input" value={ten} onChange={(e) => setTen(e.target.value)} /><Button size="sm" onClick={() => run(() => suaTaiLieu(m.id, { tieu_de: ten }))}>Lưu</Button></div></div>
          <div><label className="label">Phân loại</label><select className="input" defaultValue={m.loai ?? ""} onChange={(e) => run(() => suaTaiLieu(m.id, { loai: e.target.value || null }))}><option value="">—</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.ten}</option>)}</select></div>
          <div><label className="label">Chuyển sang buổi</label><select className="input" defaultValue={m.lesson_id ?? ""} onChange={(e) => run(() => suaTaiLieu(m.id, { lesson_id: e.target.value || null }))}><option value="">(Kho chung – không thuộc buổi nào)</option>{buois.map((b) => <option key={b.id} value={b.id}>{b.ten}</option>)}</select></div>
          <fieldset><legend className="label">Lớp được xem (không chọn = mọi lớp)</legend>
            <div className="flex flex-wrap gap-2">{lops.map((l) => <label key={l.id} className="inline-flex items-center gap-1.5 rounded-full border border-vien px-3 py-1"><input type="checkbox" checked={lopXem.includes(l.id)} onChange={(e) => setLopXem((x) => e.target.checked ? [...x, l.id] : x.filter((y) => y !== l.id))} /> {l.ten}</label>)}</div>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => run(() => datLopXem(m.id, lopXem))}>Lưu lớp xem</Button>
          </fieldset>
          {m.nguon === "file" && <div><span className="label">Thay file mới (giữ nguyên chỗ gắn)</span><UploadButton bucket="materials" xinLink={xinLinkTaiLieu} xacNhan={(p, t) => thayFile(m.id, p, t)}>Chọn file thay thế</UploadButton></div>}
          <div className="flex justify-between border-t border-vien pt-3">
            <ConfirmButton action={() => xoaTaiLieu(m.id)} onDone={() => setSua(false)} danger variant="outlineGray" title={`Xóa tài liệu “${m.tieu_de}”?`}
              message="Tài liệu sẽ ẩn với học sinh và vào Thùng rác (khôi phục được trong 30 ngày). Có thể bấm biểu tượng con mắt để chỉ ẩn." confirmText="Chuyển vào thùng rác">Xóa…</ConfirmButton>
            <Button variant="outlineGray" size="sm" onClick={() => setSua(false)}>Đóng</Button>
          </div>
        </div>
      </Modal>
    </li>
  );
}
