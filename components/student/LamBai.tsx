"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CloudUpload, FileCheck, FileCode, Link2, Lock } from "lucide-react";
import { CodeEditor } from "./CodeEditor";
import { PythonRunner } from "./PythonRunner";
import { FlagToggle } from "./FlagToggle";
import { TabBai } from "./TabBai";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Pill } from "@/components/ui/Pill";
import { useToast } from "@/components/ui/Toast";
import { luuNhap, nopBaiCode, xinLinkNopFile, xacNhanNopFile } from "@/lib/actions/hs";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { DUOI_CHO_PHEP, GIOI_HAN_MB, layDuoi, kichThuocDep } from "@/lib/domain/files";
import { docNop, ghiNop, demDaLam, docChamTabs, linkHopLe, tabDaLam } from "@/lib/domain/bai-nop";
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
  soBai?: number;                     // số tab Bài 1..N (1 = bài thường)
  chamTabs?: unknown;                 // kết quả thầy chấm ✓/✗ lần trước
  co: { checked: boolean; note: string | null; disabled: boolean };
}

type CheDo = "code" | "file" | "link";

/** Màn Làm bài: soạn code (nhiều tab Bài 1..N nếu là phiếu nhiều bài) / tải file / dán link; tự lưu nháp; nộp có xác nhận */
export function LamBai(props: LamBaiProps & { children?: React.ReactNode }) {
  const { assignmentId, loaiNop, khoa } = props;
  const soBai = Math.max(1, props.soBai ?? 1);
  const nd0 = useMemo(() => docNop(props.code0, soBai), [props.code0, soBai]);
  const coCode = loaiNop !== "file";
  const coFileWord = loaiNop !== "code"; // Word/PDF chỉ cho bài "nộp file" / "cả hai"
  const [cheDo, setCheDo] = useState<CheDo>(coCode ? "code" : nd0.link ? "link" : "file");
  const [tabs, setTabs] = useState<string[]>(nd0.tabs);
  const [dang, setDang] = useState(0);            // tab đang mở
  const [phienBan, setPhienBan] = useState(0);    // tăng khi nạp file .py vào tab → vẽ lại ô code
  const [link, setLink] = useState(nd0.link ?? "");
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
  const chamCu = docChamTabs(props.chamTabs, soBai);

  // Tự lưu nháp 3 giây sau lần gõ cuối (cả các tab + link)
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

  const suaTab = (i: number, v: string) => setTabs((cu) => {
    const moi = cu.slice(); moi[i] = v;
    henLuu(ghiNop({ tabs: moi, link: link.trim() || null }));
    return moi;
  });

  const daLam = demDaLam({ tabs, link: null }, soBai);

  // File .py/.txt → nạp vào tab đang mở (không lưu file, chỉ lưu chữ). Word/PDF → tải lên kho (bài "nộp file").
  const chonFile = async (f: File | undefined | null) => {
    if (!f) return;
    const d = layDuoi(f.name);
    if (DUOI_CHO_PHEP.code.includes(d) && coCode) {
      if (f.size > GIOI_HAN_MB.code * 1024 * 1024) { toast(`File quá lớn (tối đa ${GIOI_HAN_MB.code} MB).`, "loi"); return; }
      const text = await f.text();
      suaTab(dang, text); setPhienBan((x) => x + 1); setCheDo("code");
      toast(`Đã nạp ${f.name} vào ${soBai > 1 ? `Bài ${dang + 1}` : "ô code"}. Em kiểm tra rồi bấm Nộp nhé.`);
      return;
    }
    if (!coFileWord) { toast("Bài này nộp code: chọn file .py hoặc .txt.", "loi"); return; }
    if (!DUOI_CHO_PHEP.bai_nop_file.includes(d)) { toast(`Chỉ nhận file: ${DUOI_CHO_PHEP.bai_nop_file.map((x) => "." + x).join(", ")}`, "loi"); return; }
    if (f.size > GIOI_HAN_MB.bai_nop_file * 1024 * 1024) { toast(`File quá lớn (tối đa ${GIOI_HAN_MB.bai_nop_file} MB). Em có thể dán link Google Drive thay vì tải file.`, "loi"); return; }
    setFile(f);
  };

  async function nop() {
    if (dangNop) return;
    setDangNop(true);
    try {
      let kq;
      if (cheDo === "file" && file) {
        const link_ = await xinLinkNopFile(assignmentId, file.name, file.size);
        if (!link_.ok) throw new Error(link_.loi);
        const { path, token } = link_.data as { path: string; token: string };
        const { error } = await createBrowserSupabase().storage.from("submissions").uploadToSignedUrl(path, token, file);
        if (error) throw new Error("Tải file lên chưa được. Kiểm tra mạng rồi thử lại.");
        kq = await xacNhanNopFile(assignmentId, path, file.name);
      } else if (cheDo === "file") {
        throw new Error("Em chưa chọn file.");
      } else {
        const l = link.trim();
        if (cheDo === "link" && !linkHopLe(l)) throw new Error("Link chưa đúng — em dán link bắt đầu bằng https://");
        kq = await nopBaiCode(assignmentId, soBai > 1 || l ? { tabs, link: l || null } : tabs[0]);
      }
      if (!kq.ok) throw new Error(kq.loi);
      router.push(`/bai-tap/${assignmentId}/da-nop?vua=1`);
    } catch (e) {
      toast((e as Error).message || "Mất kết nối. Bài của em vẫn còn trên màn hình, thử nộp lại nhé.", "loi");
      setDangNop(false);
      setXacNhan(false);
    }
  }

  const coTheNop = !khoa && (cheDo === "file" ? !!file : cheDo === "link" ? linkHopLe(link.trim()) : tabs.some((t) => t.trim().length > 0));
  const nutCheDo = (k: CheDo, nhan: string, I: typeof FileCode) => (
    <button role="tab" aria-selected={cheDo === k} onClick={() => setCheDo(k)}
      className={`-mb-px inline-flex items-center gap-1.5 whitespace-nowrap rounded-t-xl border px-4 py-2.5 font-semibold ${cheDo === k ? "border-vien bg-white text-xanh-700 shadow-[inset_0_-3px_0_#2563eb]" : "border-transparent text-slate-500"}`}>
      <I className="h-4 w-4" /> {nhan}
    </button>
  );

  return (
    // Màn rộng (≥1536px): [code | kết quả] + cột thông tin; laptop: [code | kết quả], thông tin xuống dưới
    <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="card card-pad min-w-0 space-y-4">
        {props.children}
        <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-vien">
          {coCode && nutCheDo("code", "Soạn thảo code", FileCode)}
          {nutCheDo("file", coCode ? "Tải file .py" : "Tải file", CloudUpload)}
          {nutCheDo("link", "Dán link", Link2)}
        </div>

        {cheDo === "code" && (
          <div>
            {soBai > 1 && (
              <TabBai soBai={soBai} dang={dang} onChon={setDang} daLam={(i) => tabDaLam(tabs[i] ?? "")} cham={chamCu}
                tieuDe={<>Phiếu có <b>{soBai}</b> bài · em đã làm <b className="text-la-600">{daLam}/{soBai}</b> bài</>} />
            )}
            {/* Kiểu W3Schools: viết code bên trái, bấm Chạy → kết quả bên phải (điện thoại: xếp trên/dưới) */}
            <div className="grid gap-3 lg:grid-cols-2">
              <CodeEditor key={`${dang}-${phienBan}`} value={tabs[dang] ?? ""} readOnly={!!khoa} onChange={(v) => suaTab(dang, v)} />
              <PythonRunner key={`r-${dang}`} code={tabs[dang] ?? ""} />
            </div>
            <p className="mt-2 text-sm text-slate-500" aria-live="polite">{dangLuu ? "Đang lưu nháp…" : luuLuc ? `Đã lưu nháp lúc ${fmtTime(luuLuc)}` : "Nháp sẽ tự lưu khi em gõ."} · Chạy thử chỉ để em kiểm tra, <b>không phải nộp bài</b>.</p>
          </div>
        )}

        {cheDo === "file" && (
          <div>
            <label onDragOver={(e) => { e.preventDefault(); setKeo(true); }} onDragLeave={() => setKeo(false)}
              onDrop={(e) => { e.preventDefault(); setKeo(false); chonFile(e.dataTransfer.files?.[0]); }}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-10 text-center ${keo ? "border-xanh-500 bg-xanh-50" : "border-slate-400/60 bg-white"}`}>
              <CloudUpload className="h-12 w-12 text-xanh-600" />
              <p className="mt-3">
                {coCode
                  ? <>Chọn file <b>.py</b> / <b>.txt</b> — code sẽ được nạp vào {soBai > 1 ? <b>Bài {dang + 1}</b> : "ô soạn thảo"} để em kiểm tra trước khi nộp.</>
                  : <>Chọn file bài làm (.docx, .pdf… tối đa {GIOI_HAN_MB.bai_nop_file} MB) hoặc kéo thả vào đây.</>}
              </p>
              {coCode && coFileWord && <p className="mt-1 text-sm text-slate-500">Bài này cũng nhận file Word/PDF (tối đa {GIOI_HAN_MB.bai_nop_file} MB).</p>}
              <span className="mt-3 rounded-full bg-xanh-600 px-4 py-2 text-sm font-semibold text-white">Chọn file</span>
              <input type="file" className="sr-only" disabled={!!khoa}
                accept={[...(coCode ? DUOI_CHO_PHEP.code : []), ...(coFileWord ? DUOI_CHO_PHEP.bai_nop_file : [])].map((d) => "." + d).join(",")}
                onChange={(e) => { chonFile(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
            {file && (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-vien bg-white px-4 py-3">
                <FileCheck className="h-5 w-5 shrink-0 text-la-600" /><span className="min-w-0 flex-1 chu-dai">{file.name} ({kichThuocDep(file.size)})</span>
                <button onClick={() => setFile(null)} className="shrink-0 text-sm text-do-600">Bỏ chọn</button>
              </div>
            )}
          </div>
        )}

        {cheDo === "link" && (
          <div className="space-y-2">
            <label className="label" htmlFor="link-nop">Link bài làm (Google Docs, Google Drive, Replit…)</label>
            <input id="link-nop" type="url" inputMode="url" placeholder="https://docs.google.com/…" value={link} disabled={!!khoa}
              onChange={(e) => { setLink(e.target.value); henLuu(ghiNop({ tabs, link: e.target.value.trim() || null })); }} className="input" />
            <p className="text-sm text-slate-500">Nhớ bật chia sẻ <b>“Bất kỳ ai có đường liên kết đều xem được”</b> để thầy mở được bài nhé.</p>
            {link.trim() && !linkHopLe(link.trim()) && <p className="text-sm text-do-600">Link cần bắt đầu bằng https://</p>}
          </div>
        )}
      </div>

      <aside className="min-w-0 space-y-5">
        <div className="card card-pad">
          <h2 className="h-card mb-3">Thông tin bài nộp</h2>
          <div className="flex items-center gap-3">
            <span className="shrink-0 rounded-xl bg-xanh-50 p-3"><CalendarDays className="h-6 w-6 text-navy-800" /></span>
            <div className="min-w-0 flex-1"><p>Hạn nộp:</p><p className={`text-lg font-bold ${props.quaHan ? "text-do-600" : "text-do-600/90"}`}>{props.han}</p></div>
            <Pill mau={props.pill.mau}>{props.pill.text}</Pill>
          </div>
          {soBai > 1 && <p className="mt-3 rounded-xl bg-xanh-50 px-3 py-2 text-sm">Đã làm <b className="text-la-600">{daLam}/{soBai}</b> bài trong phiếu.</p>}
          {khoa ? (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700"><Lock className="mt-0.5 h-4 w-4 shrink-0" /> {khoa}</p>
          ) : (
            <Button size="lg" className="mt-4 w-full text-lg" disabled={!coTheNop || dangNop} onClick={() => setXacNhan(true)}>
              {dangNop ? "Đang nộp…" : props.daNop ? "Nộp lại" : "Nộp bài"}
            </Button>
          )}
          <p className="mt-2 text-center text-sm text-slate-600">
            {coCode ? "Nộp code (soạn trực tiếp hoặc file .py), hoặc dán link" : `Nộp file Word/PDF (tối đa ${GIOI_HAN_MB.bai_nop_file} MB) hoặc dán link`}
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
              {props.nhanXet && <p className="mt-2 rounded-xl bg-xanh-50 px-3 py-2 text-sm chu-dai">⭐ Thầy nhận xét: {props.nhanXet}</p>}
              <a href={`/bai-tap/${assignmentId}/da-nop`} className="link mt-3 inline-block text-sm">Xem bài đã nộp →</a>
            </>
          ) : <p className="text-slate-600">Em chưa nộp bài này.</p>}
        </div>
      </aside>

      <Modal open={xacNhan} onClose={() => !dangNop && setXacNhan(false)} title="Nộp bài">
        <p>Bạn chắc chắn muốn nộp bài này?</p>
        {soBai > 1 && cheDo === "code" && daLam < soBai && <p className="mt-2 rounded-xl bg-xanh-50 px-3 py-2 text-sm">Em mới làm <b>{daLam}/{soBai}</b> bài. Vẫn nộp được — làm thêm rồi nộp lại sau cũng được.</p>}
        {props.daNop && <p className="mt-2 rounded-xl bg-cam-50 px-3 py-2 text-sm text-cam-600">Bài mới sẽ thay bài cũ. Thầy chỉ xem bài mới nhất.</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outlineGray" onClick={() => setXacNhan(false)} disabled={dangNop}>Hủy</Button>
          <Button onClick={nop} disabled={dangNop}>{dangNop ? "Đang nộp…" : "Nộp bài"}</Button>
        </div>
      </Modal>
    </div>
  );
}
