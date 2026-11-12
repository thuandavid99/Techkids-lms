"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Link2, CheckCircle2 } from "lucide-react";
import { ExcelPicker, ChonCot, type TrangTinh } from "./ExcelPicker";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { phanTichPPCT, doanGhepCotDayDu, timDongTieuDe, type GhepCot, type LoaiBuoiNhanDien, type ModuleXemTruoc } from "@/lib/domain/ppct";
import { taoTuPPCT } from "@/lib/actions/gv/ct";

const BUOC = ["Tải file", "Ghép cột", "Xem trước", "Xác nhận"];

export function NhapPPCT({ loai, cts, ctMacDinh }: { loai: (LoaiBuoiNhanDien & { mau: string })[]; cts: { id: string; ten: string }[]; ctMacDinh: string }) {
  const [sheets, setSheets] = useState<TrangTinh[] | null>(null);
  const [tenFile, setTenFile] = useState("");
  const [si, setSi] = useState(0);
  const [hd, setHd] = useState(0);
  const [ghep, setGhep] = useState<GhepCot>({ buoi: -1, bai: -1, noiDung: -1, taiLieu: -1, loai: -1 });
  const [buoc, setBuoc] = useState(0);
  const [sua, setSua] = useState<ModuleXemTruoc[] | null>(null);
  const [cheDo, setCheDo] = useState<"moi" | "noi">(ctMacDinh ? "noi" : "moi");
  const [ten, setTen] = useState("");
  const [ctId, setCtId] = useState(ctMacDinh || cts[0]?.id || "");
  const [danhSoLai, setDanhSoLai] = useState<boolean | null>(null); // null = tự chọn theo file
  const [taoBT, setTaoBT] = useState(true);
  const [soTab, setSoTab] = useState(10);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const rows = sheets?.[si]?.rows ?? [];
  const chonTrang = (s: TrangTinh[], i: number) => {
    const r = s[i]?.rows ?? [];
    const h = timDongTieuDe(r);
    setHd(h); setGhep(doanGhepCotDayDu(r, h, loai)); setDanhSoLai(null);
  };
  const tieuDeCot = rows[hd]?.o;
  const lechSo = useMemo(() => (rows.length && ghep.buoi >= 0 ? phanTichPPCT(rows, ghep, loai, { batDauTuDong: hd + 1, tieuDeCot }).lechSo : false), [rows, ghep, loai, hd, tieuDeCot]);
  const soLai = danhSoLai ?? lechSo;
  const kq = useMemo(() => (rows.length && ghep.buoi >= 0 ? phanTichPPCT(rows, ghep, loai, { batDauTuDong: hd + 1, danhSoLai: soLai, tieuDeCot }) : null), [rows, ghep, loai, hd, soLai, tieuDeCot]);
  const modules = sua ?? kq?.modules ?? [];
  const tongBuoi = modules.reduce((s, m) => s + m.buoi.length, 0);
  const soBuoiCoPhieu = modules.reduce((s, m) => s + m.buoi.filter((b) => b.taoBaiTap).length, 0);
  const capNhat = (mi: number, bi: number | null, patch: Record<string, unknown>) => setSua((cu) => {
    const ds: ModuleXemTruoc[] = structuredClone(cu ?? kq!.modules);
    if (bi === null) Object.assign(ds[mi], patch); else Object.assign(ds[mi].buoi[bi], patch);
    return ds;
  });

  return (
    <div className="space-y-5">
      <ol className="flex flex-wrap gap-2">
        {BUOC.map((b, i) => <li key={b} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${i === buoc ? "bg-navy-950 text-white" : i < buoc ? "bg-la-50 text-la-600" : "bg-slate-100 text-slate-500"}`}>{i + 1}. {b}</li>)}
      </ol>

      {buoc === 0 && (
        <div className="space-y-3">
          <p>Chọn file PPCT (.xlsx) có các cột kiểu: <b>Buổi | Bài | Nội dung | Loại buổi | Quiz | Bài tập | Tham khảo</b>. Hệ thống đọc được link trong ô (Google Docs/Drive, Quizizz…) và màu tô nền (dòng tô đậm = Kiểm tra, hết module).</p>
          <ExcelPicker accept=".xlsx" label="Chọn file PPCT (.xlsx)" onRead={(s, f) => { setSheets(s); setTenFile(f); setSi(0); chonTrang(s, 0); setTen(f.replace(/\.xlsx$/i, "")); setSua(null); setBuoc(1); }} />
        </div>
      )}

      {buoc === 1 && sheets && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">File: <b>{tenFile}</b>. Hệ thống đã tự đoán cột — thầy kiểm tra lại.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <label><span className="label">Trang tính (sheet)</span><select className="input" value={si} onChange={(e) => { const i = Number(e.target.value); setSi(i); chonTrang(sheets, i); setSua(null); }}>{sheets.map((s, i) => <option key={i} value={i}>{s.ten}</option>)}</select></label>
            <label><span className="label">Dòng tiêu đề (số dòng trong Excel)</span><input type="number" min={1} className="input" value={(rows[hd]?.dong ?? hd + 1)} onChange={(e) => { const d = Number(e.target.value); const i = rows.findIndex((r) => r.dong === d); if (i >= 0) { setHd(i); setGhep(doanGhepCotDayDu(rows, i, loai)); setSua(null); } }} /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-5">
            {(["buoi", "bai", "noiDung", "taiLieu", "loai"] as const).map((k) => (
              <ChonCot key={k} label={{ buoi: "Cột Buổi", bai: "Cột Bài", noiDung: "Cột Nội dung", taiLieu: "Cột Tài liệu (link)", loai: "Cột Loại (nếu có)" }[k]} batBuoc={k === "buoi"}
                value={ghep[k]} onChange={(v) => { setGhep((g) => ({ ...g, [k]: v })); setSua(null); }} cot={rows[hd]?.o ?? []} />
            ))}
          </div>
          <div className="table-wrap max-h-64 rounded-xl border border-vien bg-white text-xs">
            <table className="tbl"><tbody>{rows.slice(hd, hd + 8).map((r) => <tr key={r.dong} className={r.toMau ? "bg-cam-50" : ""}><td className="text-slate-400">{r.dong}</td>{r.o.slice(0, 6).map((c, i) => <td key={i} className="max-w-[200px] truncate">{c}{r.link[i] && " 🔗"}</td>)}</tr>)}</tbody></table>
          </div>
          <div className="flex gap-2"><Button variant="outlineGray" onClick={() => setBuoc(0)}>Quay lại</Button><Button disabled={ghep.buoi < 0} onClick={() => setBuoc(2)}>Xem trước</Button></div>
        </div>
      )}

      {buoc === 2 && kq && (
        <div className="space-y-4">
          <p className="font-semibold">Tìm thấy {modules.length} module, {tongBuoi} buổi. Thầy sửa tên module / loại buổi ngay trong cây nếu cần.</p>
          <label className={`flex items-start gap-2 rounded-2xl border p-3 text-sm ${lechSo ? "border-cam-400 bg-cam-50" : "border-vien bg-white"}`}>
            <input type="checkbox" className="mt-0.5 h-4 w-4" checked={soLai} onChange={(e) => { setDanhSoLai(e.target.checked); setSua(null); }} />
            <span><b>Đánh số lại buổi 1, 2, 3… theo thứ tự dòng</b> (buổi gộp như “10–11” vẫn chiếm 2 số).
              {lechSo && <span className="block text-cam-700">Số buổi trong file bị trùng/lệch thứ tự — nên bật mục này.</span>}</span>
          </label>
          {kq.canhBao.length > 0 && (
            <div className="rounded-2xl border border-amber-400/50 bg-amber-50 p-3 text-sm">
              <p className="mb-1 flex items-center gap-1.5 font-bold text-amber-700"><AlertTriangle className="h-4 w-4" /> {kq.canhBao.length} cảnh báo (vẫn nhập được)</p>
              <ul className="max-h-40 list-disc overflow-y-auto pl-5">{kq.canhBao.map((c, i) => <li key={i}>{c.dong ? `Dòng ${c.dong}: ` : ""}{c.noiDung}</li>)}</ul>
            </div>
          )}
          <div className="space-y-4">
            {modules.map((m, mi) => (
              <div key={mi} className="rounded-2xl border border-vien bg-white">
                <div className="rounded-t-2xl bg-navy-800 px-3 py-2"><input value={m.ten} onChange={(e) => capNhat(mi, null, { ten: e.target.value })} className="w-full bg-transparent font-extrabold text-white outline-none" aria-label="Tên module" /></div>
                <ul className="divide-y divide-vien">
                  {m.buoi.map((b, bi) => (
                    <li key={bi} className={`grid grid-cols-[60px_1fr_auto] items-center gap-2 px-3 py-2 text-sm ${b.noiBat ? "bg-cam-50" : ""}`}>
                      <b>{b.nhanBuoi || "?"}</b>
                      <span className="min-w-0">
                        <span className="font-semibold">{b.tieuDe}</span>{b.chuDe && <span className="ml-2 text-xs text-slate-500">· chủ đề “{b.chuDe}”</span>}
                        {b.taiLieu.map((t) => <span key={t.url} className={`ml-2 inline-flex items-center gap-0.5 text-xs ${t.vaiTro === "quiz" ? "font-semibold text-tim-500" : t.vaiTro === "phieu" ? "text-cam-600" : "text-xanh-600"}`}><Link2 className="h-3 w-3" />{t.tieuDe}</span>)}
                        {b.taoBaiTap && <span className="ml-2 rounded-full bg-la-50 px-2 py-0.5 text-xs font-semibold text-la-600">+ bài tập</span>}
                      </span>
                      <select value={b.loaiId ?? ""} onChange={(e) => { const l = loai.find((x) => x.id === e.target.value); capNhat(mi, bi, { loaiId: l?.id ?? null, loaiTen: l?.ten ?? "", noiBat: !!l?.noi_bat }); }} className="input !w-auto !py-1 text-xs" aria-label="Loại buổi">
                        <option value="">—</option>{loai.map((l) => <option key={l.id} value={l.id}>{l.ten}</option>)}
                      </select>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex gap-2"><Button variant="outlineGray" onClick={() => setBuoc(1)}>Quay lại</Button><Button disabled={!tongBuoi} onClick={() => setBuoc(3)}>Tiếp tục</Button></div>
        </div>
      )}

      {buoc === 3 && (
        <div className="space-y-4">
          <div className="space-y-2 rounded-2xl border border-vien bg-white p-4">
            <label className="flex items-center gap-2"><input type="radio" checked={cheDo === "moi"} onChange={() => setCheDo("moi")} /> Tạo <b>chương trình mới</b>:</label>
            {cheDo === "moi" && <input className="input" value={ten} onChange={(e) => setTen(e.target.value)} placeholder="Tên chương trình" />}
            {cts.length > 0 && <label className="flex items-center gap-2"><input type="radio" checked={cheDo === "noi"} onChange={() => setCheDo("noi")} /> <b>Nối thêm</b> vào cuối chương trình đã có:</label>}
            {cheDo === "noi" && <select className="input" value={ctId} onChange={(e) => setCtId(e.target.value)}>{cts.map((c) => <option key={c.id} value={c.id}>{c.ten}</option>)}</select>}
          </div>
          <div className="space-y-2 rounded-2xl border border-vien bg-white p-4">
            <label className="flex items-start gap-2"><input type="checkbox" className="mt-1 h-4 w-4" checked={taoBT} onChange={(e) => setTaoBT(e.target.checked)} />
              <span>Tạo sẵn <b>bài tập nộp code</b> cho {soBuoiCoPhieu} buổi có phiếu bài tập (đề bài = link phiếu).</span></label>
            {taoBT && <label className="flex flex-wrap items-center gap-2 pl-6 text-sm">Mỗi bài tập có
              <input type="number" min={1} max={50} value={soTab} onChange={(e) => setSoTab(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} className="input !w-20 !py-1" />
              tab (Bài 1…Bài {soTab}) — sửa riêng từng bài sau trong “Soạn bài tập”.</label>}
          </div>
          <p>Sẽ tạo <b>{modules.length} module</b>, <b>{tongBuoi} buổi</b>, {modules.reduce((s, m) => s + m.buoi.reduce((x, b) => x + b.taiLieu.length, 0), 0)} tài liệu dạng link{taoBT ? <>, <b>{soBuoiCoPhieu} bài tập</b></> : null}. Sau đó thầy vào “Áp dụng cho lớp” để điền ngày học.</p>
          <div className="flex gap-2">
            <Button variant="outlineGray" onClick={() => setBuoc(2)}>Quay lại</Button>
            <Button size="lg" disabled={pending} onClick={() => start(async () => {
              const r = await taoTuPPCT({ cheDo, ten, ctId, soBaiMacDinh: taoBT ? soTab : 0, modules: modules.map((m) => ({ ten: m.ten, buoi: m.buoi.map((b) => ({ nhanBuoi: b.nhanBuoi, tieuDe: b.tieuDe, tomTat: b.tomTat, loaiId: b.loaiId, chuDe: b.chuDe, taiLieu: b.taiLieu, taoBaiTap: taoBT && !!b.taoBaiTap })) })) });
              if (r.ok) { toast(r.tb!); router.push(`/gv/chuong-trinh?ct=${r.data}`); } else toast(r.loi!, "loi");
            })}><CheckCircle2 className="h-5 w-5" /> {pending ? "Đang nhập…" : "Xác nhận nhập PPCT"}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
