"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Square, Eraser, Keyboard, Loader2 } from "lucide-react";
import { goiYLoi, dongLoi } from "@/lib/domain/python-loi";

// =====================================================================
// KHUNG CHẠY THỬ PYTHON (kiểu W3Schools "Try it"): bấm Chạy → kết quả hiện bên cạnh.
// Code chạy TRONG TRÌNH DUYỆT của người dùng bằng Pyodide (Python biên dịch sang
// WebAssembly), trong Web Worker riêng. Không gửi code lên server, không chấm điểm.
// Lần đầu tải bộ chạy (~10 MB, trình duyệt tự lưu lại cho các lần sau).
// Đổi phiên bản Pyodide: sửa PYODIDE_URL (một chỗ).
// =====================================================================
export const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.28.0/full/";
const GIOI_HAN_GIAY = 10; // quá thời gian → dừng (thường do vòng lặp vô hạn)

type Dong = { kieu: "out" | "err" | "nhap" | "he"; text: string };
type TrangThai = "nghi" | "tai" | "chay" | "xong" | "loi";

export function PythonRunner({ code, chieuCao = 420, inputMacDinh = "" }: { code: string; chieuCao?: number; inputMacDinh?: string }) {
  const worker = useRef<Worker | null>(null);
  const henGio = useRef<ReturnType<typeof setTimeout> | null>(null);
  const daTai = useRef(false);
  const [dong, setDong] = useState<Dong[]>([]);
  const [tt, setTt] = useState<TrangThai>("nghi");
  const [loi, setLoi] = useState<string | null>(null);
  const [ms, setMs] = useState<number | null>(null);
  const [input, setInput] = useState(inputMacDinh);
  const [moInput, setMoInput] = useState(!!inputMacDinh);
  const cuoi = useRef<HTMLDivElement>(null);
  const codeRef = useRef(code);
  codeRef.current = code;

  const them = (d: Dong) => setDong((x) => {
    // Gộp các mẩu cùng loại liền nhau cho gọn
    const t = x[x.length - 1];
    if (t && t.kieu === d.kieu) return [...x.slice(0, -1), { kieu: d.kieu, text: t.text + d.text }];
    return [...x, d];
  });

  const dungWorker = useCallback(() => {
    if (henGio.current) clearTimeout(henGio.current);
    worker.current?.terminate();
    worker.current = null;
    daTai.current = false;
  }, []);
  useEffect(() => dungWorker, [dungWorker]);
  useEffect(() => { cuoi.current?.scrollIntoView({ block: "nearest" }); }, [dong]);

  const chay = useCallback(() => {
    if (tt === "tai" || tt === "chay") return;
    if (!codeRef.current.trim()) { setDong([{ kieu: "he", text: "Chưa có code để chạy." }]); return; }
    setDong([]); setLoi(null); setMs(null);
    if (!worker.current) {
      try { worker.current = new Worker("/py-worker.js"); }
      catch { setTt("loi"); setDong([{ kieu: "err", text: "Trình duyệt này không chạy được Python. Hãy dùng Chrome, Edge, Safari hoặc Firefox bản mới." }]); return; }
      worker.current.onmessage = (e: MessageEvent) => {
        const m = e.data as { type: string; text?: string; ms?: number };
        if (m.type === "bat_dau") {
          daTai.current = true; setTt("chay");
          if (henGio.current) clearTimeout(henGio.current);
          henGio.current = setTimeout(() => {
            dungWorker();
            setTt("loi");
            them({ kieu: "err", text: `\n⏱ Chương trình chạy quá ${GIOI_HAN_GIAY} giây nên đã bị dừng. Có thể có vòng lặp không bao giờ kết thúc (ví dụ while True mà không có break).` });
          }, GIOI_HAN_GIAY * 1000);
        } else if (m.type === "out" || m.type === "err" || m.type === "nhap") {
          them({ kieu: m.type, text: m.text ?? "" });
        } else if (m.type === "xong") {
          if (henGio.current) clearTimeout(henGio.current);
          setTt("xong"); setMs(m.ms ?? null);
        } else if (m.type === "loi") {
          if (henGio.current) clearTimeout(henGio.current);
          setTt("loi"); setMs(m.ms ?? null); setLoi(m.text ?? "Có lỗi");
        } else if (m.type === "loi_tai") {
          dungWorker(); setTt("loi");
          them({ kieu: "err", text: "Không tải được bộ chạy Python. Kiểm tra mạng rồi bấm Chạy lại." });
        }
      };
    }
    setTt(daTai.current ? "chay" : "tai");
    worker.current.postMessage({ type: "chay", code: codeRef.current, input, indexURL: PYODIDE_URL });
  }, [tt, input, dungWorker]);

  const dung = () => { dungWorker(); setTt("xong"); them({ kieu: "he", text: "\n■ Đã dừng." }); };

  // Phím tắt Ctrl + Enter (⌘ + Enter trên Mac) để chạy
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); chay(); } };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [chay]);

  const goiY = loi ? goiYLoi(loi) : null;
  const so = loi ? dongLoi(loi) : null;
  const dangBan = tt === "tai" || tt === "chay";

  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1220]" style={{ height: chieuCao + 44 }}>
      <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900 px-2 py-1.5">
        {dangBan
          ? <button type="button" onClick={dung} className="inline-flex items-center gap-1.5 rounded-full bg-do-600 px-4 py-1.5 text-sm font-bold text-white"><Square className="h-4 w-4" /> Dừng</button>
          : <button type="button" onClick={chay} className="inline-flex items-center gap-1.5 rounded-full bg-la-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-la-500" title="Ctrl + Enter"><Play className="h-4 w-4" /> Chạy</button>}
        <button type="button" onClick={() => setMoInput((x) => !x)} aria-expanded={moInput}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${moInput ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"}`}>
          <Keyboard className="h-4 w-4" /> Dữ liệu vào
        </button>
        <span className={`ml-auto truncate text-xs text-slate-400 ${tt === "tai" || tt === "chay" || ms !== null ? "" : "hidden sm:inline"}`} aria-live="polite">
          {tt === "tai" ? <span className="inline-flex items-center gap-1"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải Python (lần đầu hơi lâu)…</span>
            : tt === "chay" ? <span className="inline-flex items-center gap-1"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang chạy…</span>
            : ms !== null ? `${tt === "loi" ? "Có lỗi" : "Chạy xong"} trong ${(ms / 1000).toFixed(2)} giây` : "Ctrl + Enter để chạy"}
        </span>
        {!dangBan && dong.length > 0 && <button type="button" onClick={() => { setDong([]); setLoi(null); setMs(null); }} aria-label="Xóa kết quả" className="rounded p-1 text-slate-400 hover:bg-slate-800"><Eraser className="h-4 w-4" /></button>}
      </div>

      {moInput && (
        <div className="border-b border-slate-800 bg-slate-900/60 p-2">
          <label htmlFor="py-input" className="mb-1 block text-xs text-slate-400">Mỗi dòng là một lần <code className="text-amber-300">input()</code>. Ví dụ bài cần nhập 2 số: gõ số thứ nhất, xuống dòng, gõ số thứ hai.</label>
          <textarea id="py-input" value={input} onChange={(e) => setInput(e.target.value)} rows={3} spellCheck={false}
            className="w-full resize-y rounded-lg border border-slate-700 bg-[#111827] px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-xanh-500" placeholder={"5\n7"} />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto px-4 py-3 font-mono text-[14px] leading-6" role="log" aria-label="Kết quả chạy chương trình">
        {dong.length === 0 && !loi && tt === "nghi" && (
          <p className="text-slate-500">Bấm <b className="text-la-500">▶ Chạy</b> để xem kết quả chương trình ở đây.</p>
        )}
        {dong.map((d, i) => (
          <pre key={i} className={`whitespace-pre-wrap break-words ${d.kieu === "err" ? "text-red-300" : d.kieu === "nhap" ? "text-amber-300" : d.kieu === "he" ? "text-slate-400" : "text-slate-100"}`}>{d.text}</pre>
        ))}
        {tt === "xong" && dong.length === 0 && <p className="text-slate-500">(Chương trình chạy xong, không in ra gì. Dùng print() để in kết quả.)</p>}
        {loi && (
          <div className="mt-2 rounded-xl border border-red-900/60 bg-red-950/40 p-3">
            <pre className="whitespace-pre-wrap break-words text-red-300">{loi}</pre>
            {(goiY || so) && <p className="mt-2 font-sans text-sm text-amber-200">💡 {so ? `Xem dòng ${so}. ` : ""}{goiY}</p>}
          </div>
        )}
        <div ref={cuoi} />
      </div>
    </div>
  );
}
