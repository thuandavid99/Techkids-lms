"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, ChevronDown, Lock, LockOpen, AlarmClock, StickyNote, MoreHorizontal, MapPin, Check, Undo2 } from "lucide-react";
import { capNhatBuoiLop, doiLich, datDangHoc, xongBuoi, quayLaiBuoi } from "@/lib/actions/gv/lop";
import { ChonDangHoc } from "./MoBuoiHomNay";
import { nhomTienDo } from "@/lib/domain/mo-buoi";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export interface DongLich {
  lesson_id: string; ten: string; ngay_hoc: string; hien_thi: boolean;
  ngay_mo: string;        // giá trị cho ô datetime-local (giờ VN), "" nếu không hẹn
  ngayMoDep: string;      // "07:00 15/11" để hiển thị
  henTuongLai: boolean;   // có hẹn giờ mở và chưa tới giờ
  da_day: boolean; ghi_chu: string; noiBat: boolean; banNhap: boolean;
}

type TrangThai = "mo" | "hen" | "khoa";
const trangThai = (b: DongLich): TrangThai => (!b.hien_thi ? "khoa" : b.henTuongLai ? "hen" : "mo");

/** Chip trạng thái: bấm → Mở ngay / Hẹn giờ / Khóa */
function ChipTrangThai({ b, luu, pending }: { b: DongLich; luu: (v: Parameters<typeof capNhatBuoiLop>[2]) => void; pending: boolean }) {
  const [mo, setMo] = useState(false);
  const [hen, setHen] = useState(b.ngay_mo);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const f = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setMo(false); };
    document.addEventListener("mousedown", f); return () => document.removeEventListener("mousedown", f);
  }, []);
  const tt = trangThai(b);
  const chip = tt === "mo" ? { cls: "bg-la-50 text-la-600 border-la-500/40", I: LockOpen, chu: "Đang mở" }
    : tt === "hen" ? { cls: "bg-cam-50 text-cam-600 border-cam-400/50", I: AlarmClock, chu: `Mở lúc ${b.ngayMoDep}` }
    : { cls: "bg-slate-100 text-slate-600 border-slate-300", I: Lock, chu: "Đang khóa" };
  const chon = (v: Parameters<typeof capNhatBuoiLop>[2]) => { setMo(false); luu(v); };
  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={pending} onClick={() => setMo((x) => !x)} aria-expanded={mo}
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold ${chip.cls}`}>
        <chip.I className="h-4 w-4" /> {chip.chu} <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>
      {mo && (
        <div className="card absolute right-0 top-10 z-30 w-64 max-w-[calc(100vw-3rem)] space-y-1 p-2 text-sm">
          <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-la-50" onClick={() => chon({ hien_thi: true, ngay_mo: null })}><LockOpen className="h-4 w-4 text-la-600" /> Mở ngay cho học sinh</button>
          <div className="rounded-xl px-3 py-2 hover:bg-cam-50">
            <p className="flex items-center gap-2"><AlarmClock className="h-4 w-4 text-cam-600" /> Hẹn giờ tự mở</p>
            <div className="mt-1.5 flex gap-1.5">
              <input type="datetime-local" value={hen} onChange={(e) => setHen(e.target.value)} className="input !py-1 text-xs" aria-label="Giờ mở" />
              <Button size="sm" disabled={!hen} onClick={() => chon({ hien_thi: true, ngay_mo: hen })}>Lưu</Button>
            </div>
          </div>
          <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-slate-100" onClick={() => chon({ hien_thi: false })}><Lock className="h-4 w-4 text-slate-500" /> Khóa (học sinh chưa thấy)</button>
        </div>
      )}
    </div>
  );
}

/** Một buổi: tên · ngày (tham khảo) · trạng thái mở/khóa · ghi chú · ⋯ */
function DongBuoi({ b, dang, luu, pending, onDoi, onDatDang }: { b: DongLich; dang?: boolean; luu: (id: string, v: Parameters<typeof capNhatBuoiLop>[2]) => void; pending: boolean; onDoi: (b: DongLich) => void; onDatDang: (b: DongLich) => void }) {
  const [ghiChu, setGhiChu] = useState(!!b.ghi_chu);
  const [menu, setMenu] = useState(false);
  return (
    <li className={`rounded-2xl border px-3 py-2.5 ${dang ? "border-cam-500 bg-cam-50/70 shadow-sm" : b.noiBat ? "border-cam-400/40 bg-cam-50/40" : "border-vien bg-white"}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="hang-chu">
          <p className="font-semibold leading-snug">
            {b.ten}{b.banNhap && <span className="ml-1 text-xs text-slate-500">(bản nháp)</span>}
          </p>
        </div>
        <input type="date" defaultValue={b.ngay_hoc} disabled={pending} aria-label={`Ngày học dự kiến ${b.ten}`} title="Ngày học dự kiến (chỉ để tham khảo)" className="input !w-[9.5rem] !py-1.5 text-sm text-slate-600"
          onBlur={(e) => e.target.value !== b.ngay_hoc && luu(b.lesson_id, { ngay_hoc: e.target.value || null })} />
        <ChipTrangThai b={b} pending={pending} luu={(v) => luu(b.lesson_id, v)} />
        <button type="button" onClick={() => setGhiChu((x) => !x)} title="Ghi chú" aria-label={`Ghi chú ${b.ten}`}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-xanh-50 ${b.ghi_chu ? "text-cam-500" : "text-slate-400"}`}><StickyNote className="h-4 w-4" /></button>
        <div className="relative">
          <button type="button" onClick={() => setMenu((x) => !x)} aria-label={`Thêm thao tác ${b.ten}`} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-xanh-50"><MoreHorizontal className="h-5 w-5" /></button>
          {menu && (
            <div className="card absolute right-0 top-10 z-30 w-64 space-y-1 p-2 text-sm" onMouseLeave={() => setMenu(false)}>
              {!dang && <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-cam-50" onClick={() => { setMenu(false); onDatDang(b); }}><MapPin className="h-4 w-4 text-cam-500" /> Lớp đang học tới buổi này</button>}
              <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-xanh-50" onClick={() => { setMenu(false); onDoi(b); }}><CalendarClock className="h-4 w-4 text-xanh-600" /> Lớp nghỉ — lùi ngày dự kiến</button>
            </div>
          )}
        </div>
      </div>
      {ghiChu && (
        <input defaultValue={b.ghi_chu} disabled={pending} aria-label="Ghi chú" className="input mt-2 !py-1.5 text-sm" placeholder="Ghi chú cho buổi này (chỉ thầy thấy)…" autoFocus={!b.ghi_chu}
          onBlur={(e) => e.target.value !== b.ghi_chu && luu(b.lesson_id, { ghi_chu: e.target.value })} />
      )}
    </li>
  );
}

/**
 * Lịch & tiến độ của lớp — theo nút "Xong buổi này", KHÔNG theo ngày:
 * ✅ Đã học (gập) · 📍 Đang học (+ nút Xong / Quay lại) · 🔒 Chưa học (3 buổi kế + phần còn lại gập)
 * Mở/khóa từng buổi bằng chip trạng thái. Ngày học chỉ để tham khảo.
 */
export function LichLop({ classId, ds }: { classId: string; ds: DongLich[] }) {
  const [pending, start] = useTransition();
  const [doi, setDoi] = useState<DongLich | null>(null);
  const [soNgay, setSoNgay] = useState(7);
  const toast = useToast();
  const router = useRouter();
  const chay = (p: Promise<{ ok: boolean; tb?: string; loi?: string }>) => start(async () => {
    const kq = await p;
    if (kq.ok) { toast(kq.tb ?? "Đã lưu"); router.refresh(); } else toast(kq.loi!, "loi");
  });
  const luu = (id: string, v: Parameters<typeof capNhatBuoiLop>[2]) => chay(capNhatBuoiLop(classId, id, v));
  const g = nhomTienDo(ds.map((b) => ({ ...b, ban_nhap: b.banNhap })));
  const chuaBatDau = g.daHoc.length === 0 && ds.every((b) => !b.hien_thi);
  const sapToi = g.chuaHoc.slice(0, 3), phiaSau = g.chuaHoc.slice(3);
  const ke = g.chuaHoc[0];
  const props = { luu, pending, onDoi: (x: DongLich) => { setDoi(x); setSoNgay(7); }, onDatDang: (x: DongLich) => chay(datDangHoc(classId, x.lesson_id)) };
  const ds_ = (list: DongLich[]) => <ul className="space-y-2">{list.map((b) => <DongBuoi key={b.lesson_id} b={b} {...props} />)}</ul>;
  const nhom = "rounded-2xl border border-vien bg-white/60 p-3 [&[open]>summary]:mb-3";
  return (
    <div className="space-y-4">
      {chuaBatDau && (
        <div className="rounded-2xl border-2 border-cam-400/60 bg-cam-50 p-4">
          <p className="font-bold text-navy-950">Lớp đang học tới buổi nào?</p>
          <p className="mb-2 text-sm text-slate-600">Chọn buổi lớp đang học. Các buổi trước sẽ chuyển thành “Đã học” và mở cho học sinh xem lại.</p>
          <ChonDangHoc classId={classId} ds={ds.filter((b) => !b.banNhap).map((b) => ({ lesson_id: b.lesson_id, ten: b.ten }))} />
        </div>
      )}
      <details className={nhom}>
        <summary className="cursor-pointer font-bold text-slate-700">✅ Đã học <span className="font-medium text-slate-500">({g.daHoc.length} buổi — bấm để xem, khóa/mở từng buổi được)</span></summary>
        {g.daHoc.length ? ds_(g.daHoc) : <p className="text-sm text-slate-500">Chưa có buổi nào.</p>}
      </details>
      <section>
        <h3 className="mb-2 font-extrabold text-navy-950">📍 Đang học</h3>
        {g.dangHoc ? (
          <>
            <ul><DongBuoi b={g.dangHoc} dang {...props} /></ul>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" disabled={pending} onClick={() => chay(xongBuoi(classId, g.dangHoc!.lesson_id))} className="!whitespace-normal">
                <Check className="h-4 w-4 shrink-0" /> {ke ? `Xong buổi này → sang ${ke.ten.split(":")[0]} (mở cho HS)` : "Xong buổi cuối"}
              </Button>
              {g.daHoc.length > 0 && <Button size="sm" variant="ghost" disabled={pending} onClick={() => chay(quayLaiBuoi(classId))}><Undo2 className="h-4 w-4" /> Quay lại 1 buổi</Button>}
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-la-50 p-4 text-sm">Đã học hết chương trình 🎉
            {g.daHoc.length > 0 && <Button size="sm" variant="ghost" disabled={pending} onClick={() => chay(quayLaiBuoi(classId))}><Undo2 className="h-4 w-4" /> Quay lại 1 buổi</Button>}
          </div>
        )}
      </section>
      {sapToi.length > 0 && (
        <section>
          <h3 className="mb-2 font-extrabold text-navy-950">🔒 Chưa học <span className="text-sm font-medium text-slate-500">— muốn mở sớm thì bấm chip trạng thái</span></h3>
          {ds_(sapToi)}
        </section>
      )}
      {phiaSau.length > 0 && (
        <details className={nhom}>
          <summary className="cursor-pointer font-bold text-slate-700">🗓️ Các buổi sau <span className="font-medium text-slate-500">({phiaSau.length} buổi)</span></summary>
          {ds_(phiaSau)}
        </details>
      )}

      <Modal open={!!doi} onClose={() => setDoi(null)} title="Lớp nghỉ — lùi ngày dự kiến">
        <p>Lùi ngày dự kiến của <b>{doi?.ten}</b> và <b>tất cả các buổi sau</b> thêm:</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input type="number" value={soNgay} onChange={(e) => setSoNgay(parseInt(e.target.value || "0", 10))} className="input !w-24" aria-label="Số ngày" />
          <span>ngày</span>
          <Button variant="outline" size="sm" onClick={() => setSoNgay(7)}>1 tuần</Button>
          <Button variant="outline" size="sm" onClick={() => setSoNgay(14)}>2 tuần</Button>
        </div>
        <p className="mt-2 text-sm text-slate-500">Ngày học chỉ để thầy tham khảo — không ảnh hưởng mở/khóa buổi. Nhập số âm để kéo về trước. Hạn nộp bài tập không tự đổi.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outlineGray" onClick={() => setDoi(null)}>Hủy</Button>
          <Button disabled={pending} onClick={() => { const d = doi!; setDoi(null); chay(doiLich(classId, d.lesson_id, soNgay)); }}>Lùi ngày</Button>
        </div>
      </Modal>
    </div>
  );
}
