"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CloudUpload, FileCheck, Lock } from "lucide-react";
import { CodeEditor } from "./CodeEditor";
import { FlagToggle } from "./FlagToggle";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Pill } from "@/components/ui/Pill";
import { useToast } from "@/components/ui/Toast";
import { luuNhap, nopBaiCode, xinLinkNopFile, xacNhanNopFile } from "@/lib/actions/hs";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { DUOI_CHO_PHEP, GIOI_HAN_MB, layDuoi, kichThuocDep } from "@/lib/domain/files";
import { fmtTime } from "@/lib/domain/time";
import type { MauPill } from "@/lib/domain/status";

export interface LamBaiProps {
  assignmentId: string;
  loaiNop: "code" | "file" | "ca_hai";
  han: string; quaHan: boolean; pill: { text: string; mau: MauPill };
  soLanNop: number; nopMoiNhat: string | null; daNop: boolean;
  nhanXet: string | null; diem: string | null;
  khoa: string | null;                // lý do không được nộp (null = được nộp)
  code0: string; nhapLuc: string | null;
  co: { checked: boolean; note: string | null; disabled: boolean };
}

/** Màn Làm bài: tab Soạn thảo code / Upload file, tự lưu nháp, nộp có xác nhận + chống bấm đúp */
export function LamBai(props: LamBaiProps & { children?: React.ReactNode }) {
  const { assignmentId, loaiNop, khoa } = props;
  const coCode = loaiNop !== "file";
  const coFile = true; // bài code vẫn được tải file .py/.txt lên
  const [tab, setTab] = useState<"code" | "file">(coCode ? "code" : "file");
  const [code, setCode] = useState(props.code0);
  const [luuLuc, setLuuLuc] = useState<string | null>(props.nhapLuc);
  const [dangLuu, setDangLuu] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [xacNhan, setXacNhan] = useState(false);
  const [dangNop, setDangNop] = useState(false);
  const [keo, setKeo] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const daLuu = useRef(props.code0);

  // Tự lưu nháp 3 giây sau lần gõ cuối
  const henLuu = useCallback((v: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (v === daLuu.current) return;
      setDangLuu(true);
      const kq = await luuNhap(assignmentId, v).catch(() => ({ ok: false } as { ok: boolean; data?: unknown }));
      setDangLuu(false);
      if (kq.ok) { daLuu.current = v; setLuuLuc(String(kq.data)); }
    }, 3000);
  }, [assignmentId]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const duoiChoPhep = loaiNop === "code" ? DUOI_CHO_PHEP.code : DUOI_CHO_PHEP.bai_nop_file;
  const chonFile = (f: File | undefined | null) => {
    if (!f) return;
    const d = layDuoi(f.name);
    if (!duoiChoPhep.includes(d)) { toast(`Chỉ nhận file: ${duoiChoPhep.map((x) => "." + x).join(", ")}`, "loi"); return; }
    const max = (DUOI_CHO_PHEP.code.includes(d) && loaiNop !== "file" ? GIOI_HAN_MB.code : GIOI_HAN_MB.bai_nop_file) * 1024 * 1024;
    if (f.size > max) { toast(`File quá lớn (tối đa ${max / 1024 / 1024} MB).`, "loi"); return; }
    setFile(f);
  };

  async function nop() {
    if (dangNop) return;
    setDangNop(true);
    try {
      let kq;
      if (tab === "code") {
        kq = await nopBaiCode(assignmentId, code);
      } else if (file) {
        const d = layDuoi(file.name);
        if (DUOI_CHO_PHEP.code.includes(d) && loaiNop !== "file") {
          // File .py/.txt của bài code: đọc thành chữ rồi nộp như code
          kq = await nopBaiCode(assignmentId, await file.text(), file.name);
        } else {
          const link = await xinLinkNopFile(assignmentId, file.name, file.size);
          if (!link.ok) throw new Error(link.loi);
          const { path, token } = link.data as { path: string; token: string };
          const { error } = await createBrowserSupabase().storage.from("submissions").uploadToSignedUrl(path, token, file);
          if (error) throw new Error("Tải file lên chưa được. Kiểm tra mạng rồi thử lại.");
          kq = await xacNhanNopFile(assignmentId, path, file.name);
        }
      } else throw new Error("Em chưa chọn file.");
      if (!kq.ok) throw new Error(kq.loi);
      router.push(`/bai-tap/${assignmentId}/da-nop?vua=1`);
    } catch (e) {
      toast((e as Error).message || "Mất kết nối. Bài của em vẫn còn trên màn hình, thử nộp lại nhé.", "loi");
      setDangNop(false);
      setXacNhan(false);
    }
  }

  const coTheNop = !khoa && (tab === "code" ? code.trim().length > 0 : !!file);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="card card-pad min-w-0 space-y-4">
        {props.children}
        <div role="tablist" className="flex gap-1 border-b border-vien">
          {coCode && <button role="tab" aria-selected={tab === "code"} onClick={() => setTab("code")} className={`-mb-px rounded-t-xl border px-5 py-2.5 font-semibold ${tab === "code" ? "border-vien bg-white text-xanh-700 shadow-[inset_0_-3px_0_#2563eb]" : "border-transparent text-slate-500"}`}>Soạn thảo code</button>}
          {coFile && <button role="tab" aria-selected={tab === "file"} onClick={() => setTab("file")} className={`-mb-px rounded-t-xl border px-5 py-2.5 font-semibold ${tab === "file" ? "border-vien bg-white text-xanh-700 shadow-[inset_0_-3px_0_#2563eb]" : "border-transparent text-slate-500"}`}>Upload file</button>}
        </div>

        {tab === "code" ? (
          <div>
            <CodeEditor value={props.code0} readOnly={!!khoa} onChange={(v) => { setCode(v); henLuu(v); }} />
            <p className="mt-2 text-sm text-slate-500" aria-live="polite">{dangLuu ? "Đang lưu nháp…" : luuLuc ? `Đã lưu nháp lúc ${fmtTime(luuLuc)}` : "Nháp sẽ tự lưu khi em gõ."}</p>
          </div>
        ) : (
          <div>
            <label onDragOver={(e) => { e.preventDefault(); setKeo(true); }} onDragLeave={() => setKeo(false)}
              onDrop={(e) => { e.preventDefault(); setKeo(false); chonFile(e.dataTransfer.files?.[0]); }}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-12 text-center ${keo ? "border-xanh-500 bg-xanh-50" : "border-slate-400/60 bg-white"}`}>
              <CloudUpload className="h-14 w-14 text-xanh-600" />
              <p className="mt-3">Kéo và thả file bài làm ({duoiChoPhep.slice(0, 6).map((d) => "." + d).join(", ")}{duoiChoPhep.length > 6 ? "…" : ""}) vào đây hoặc bấm <b className="text-xanh-600">Chọn file</b></p>
              <input type="file" className="sr-only" disabled={!!khoa} accept={duoiChoPhep.map((d) => "." + d).join(",")} onChange={(e) => chonFile(e.target.files?.[0])} />
            </label>
            {file && (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-vien bg-white px-4 py-3">
                <FileCheck className="h-5 w-5 text-la-600" /><span className="flex-1 truncate">{file.name} ({kichThuocDep(file.size)})</span>
                <button onClick={() => setFile(null)} className="text-sm text-do-600">Bỏ chọn</button>
              </div>
            )}
          </div>
        )}
      </div>

      <aside className="space-y-5">
        <div className="card card-pad">
          <h2 className="h-card mb-3">Thông tin bài nộp</h2>
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-xanh-50 p-3"><CalendarDays className="h-6 w-6 text-navy-800" /></span>
            <div className="flex-1"><p>Hạn nộp:</p><p className={`text-lg font-bold ${props.quaHan ? "text-do-600" : "text-do-600/90"}`}>{props.han}</p></div>
            <Pill mau={props.pill.mau}>{props.pill.text}</Pill>
          </div>
          {khoa ? (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700"><Lock className="mt-0.5 h-4 w-4 shrink-0" /> {khoa}</p>
          ) : (
            <Button size="lg" className="mt-4 w-full text-lg" disabled={!coTheNop || dangNop} onClick={() => setXacNhan(true)}>
              {dangNop ? "Đang nộp…" : props.daNop ? "Nộp lại" : "Nộp bài"}
            </Button>
          )}
          <p className="mt-2 text-center text-sm text-slate-600">
            {loaiNop === "code" ? `Hỗ trợ file .py, .txt (tối đa ${GIOI_HAN_MB.code}MB)` : `Hỗ trợ file bài làm (tối đa ${GIOI_HAN_MB.bai_nop_file}MB)`}
          </p>
          <div className="mt-4"><FlagToggle assignmentId={assignmentId} checked={props.co.checked} note={props.co.note} disabled={props.co.disabled} /></div>
        </div>

        <div className="card card-pad">
          <h2 className="h-card mb-2">Bài đã nộp</h2>
          {props.soLanNop > 0 ? (
            <>
              <p>Đã nộp {props.soLanNop} lần – bản mới nhất lúc <b>{props.nopMoiNhat}</b> <span className="text-la-600">●</span></p>
              <p className="mt-1 text-xs text-slate-500">Hệ thống chỉ giữ bài mới nhất. Thầy xem bài mới nhất.</p>
              {props.diem && <p className="mt-3">Điểm: <b className="text-la-600">{props.diem}</b></p>}
              {props.nhanXet && <p className="mt-2 rounded-xl bg-xanh-50 px-3 py-2 text-sm">⭐ Thầy nhận xét: {props.nhanXet}</p>}
              <a href={`/bai-tap/${assignmentId}/da-nop`} className="link mt-3 inline-block text-sm">Xem / tải bài đã nộp →</a>
            </>
          ) : <p className="text-slate-600">Em chưa nộp bài này.</p>}
        </div>
      </aside>

      <Modal open={xacNhan} onClose={() => !dangNop && setXacNhan(false)} title="Nộp bài">
        <p>Bạn chắc chắn muốn nộp bài này?</p>
        {props.daNop && <p className="mt-2 rounded-xl bg-cam-50 px-3 py-2 text-sm text-cam-600">Bài mới sẽ thay bài cũ. Thầy chỉ xem bài mới nhất.</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outlineGray" onClick={() => setXacNhan(false)} disabled={dangNop}>Hủy</Button>
          <Button onClick={nop} disabled={dangNop}>{dangNop ? "Đang nộp…" : "Nộp bài"}</Button>
        </div>
      </Modal>
    </div>
  );
}
