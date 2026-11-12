"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, LockOpen, Settings2, Check, Undo2, MapPin } from "lucide-react";
import { ConfirmButton } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { gatMoBuoi, khoaBuoiChuaDay, xongBuoi, quayLaiBuoi, datDangHoc } from "@/lib/actions/gv/lop";

export interface BuoiGat { lesson_id: string; ten: string; mo: boolean }
export interface LopMoBuoi {
  id: string; ten_lop: string;
  dangHoc: BuoiGat | null; tiepTheo: BuoiGat | null; coBuoiTruoc: boolean;
  viTri: number; soDaHoc: number; soDaMo: number; tong: number; chuaBatDau: boolean;
  dsBuoi: { lesson_id: string; ten: string }[];
}

/** Nút gạt mở/khóa (bấm là lưu ngay) */
export function CongTac({ bat, onDoi, disabled, nhan }: { bat: boolean; onDoi: (v: boolean) => void; disabled?: boolean; nhan: string }) {
  return (
    <button type="button" role="switch" aria-checked={bat} aria-label={nhan} disabled={disabled} onClick={() => onDoi(!bat)}
      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${bat ? "bg-la-500" : "bg-slate-300"}`}>
      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow transition-transform ${bat ? "translate-x-7" : "translate-x-1"}`}>
        {bat ? <LockOpen className="h-3.5 w-3.5 text-la-600" /> : <Lock className="h-3.5 w-3.5 text-slate-500" />}
      </span>
    </button>
  );
}

function GatMo({ b, classId }: { b: BuoiGat; classId: string }) {
  const [mo, setMo] = useState(b.mo);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  useEffect(() => setMo(b.mo), [b.mo]);
  const doi = (v: boolean) => start(async () => {
    setMo(v);
    const kq = await gatMoBuoi(classId, b.lesson_id, v);
    if (!kq.ok) { setMo(!v); toast(kq.loi!, "loi"); return; }
    toast(kq.tb!); router.refresh();
  });
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className={`hidden text-xs font-semibold sm:inline ${mo ? "text-la-600" : "text-slate-400"}`}>{mo ? "HS xem được" : "Đang khóa"}</span>
      <CongTac bat={mo} onDoi={doi} disabled={pending} nhan={`${mo ? "Khóa" : "Mở"} ${b.ten}`} />
    </div>
  );
}

/** Ô chọn "Lớp đang học tới buổi…" */
export function ChonDangHoc({ classId, ds, macDinh, onXong, gon = false }: { classId: string; ds: { lesson_id: string; ten: string }[]; macDinh?: string; onXong?: () => void; gon?: boolean }) {
  const [v, setV] = useState(macDinh ?? ds[0]?.lesson_id ?? "");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const luu = () => start(async () => {
    const kq = await datDangHoc(classId, v);
    if (!kq.ok) { toast(kq.loi!, "loi"); return; }
    toast(kq.tb!); onXong?.(); router.refresh();
  });
  return (
    <div className={`flex ${gon ? "flex-col" : "flex-wrap"} gap-2`}>
      <select value={v} onChange={(e) => setV(e.target.value)} disabled={pending} aria-label="Lớp đang học tới buổi" className="input min-w-0 flex-1 !py-2 text-sm">
        {ds.map((b, i) => <option key={b.lesson_id} value={b.lesson_id}>{i + 1}. {b.ten}</option>)}
      </select>
      <Button size="sm" onClick={luu} disabled={pending || !v}>Lưu</Button>
    </div>
  );
}

/** Nút ⚙: đổi buổi đang học, khóa các buổi chưa học, tới trang Lịch */
function CaiDat({ l }: { l: LopMoBuoi }) {
  const [mo, setMo] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  useEffect(() => {
    const f = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setMo(false); };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setMo((x) => !x)} aria-expanded={mo} aria-label={`Cài đặt tiến độ lớp ${l.ten_lop}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-xanh-50 hover:text-navy-800">
        <Settings2 className="h-5 w-5" />
      </button>
      {mo && (
        <div className="card absolute right-0 top-10 z-30 w-80 max-w-[calc(100vw-3rem)] space-y-3 p-4 text-sm">
          <div>
            <span className="label">Đổi buổi lớp đang học</span>
            <ChonDangHoc gon classId={l.id} ds={l.dsBuoi} macDinh={l.dangHoc?.lesson_id} onXong={() => setMo(false)} />
            <p className="mt-1 text-xs text-slate-500">Các buổi trước sẽ thành “Đã học” và mở cho học sinh xem lại.</p>
          </div>
          <Link href={`/gv/lop/${l.id}/lich`} className="link block">Mở / khóa từng buổi →</Link>
          <ConfirmButton action={() => khoaBuoiChuaDay(l.id)} onDone={() => { setMo(false); router.refresh(); }} variant="outlineGray" size="sm" className="w-full"
            title={`Khóa các buổi chưa học của lớp ${l.ten_lop}?`} confirmText="Khóa các buổi chưa học"
            message="Các buổi sau buổi đang học sẽ bị khóa (học sinh thấy mờ có 🔒). Buổi đã học và buổi đang học giữ nguyên.">
            Khóa các buổi chưa học
          </ConfirmButton>
        </div>
      )}
    </div>
  );
}

/** Phần "tiến độ + mở buổi" trong thẻ từng lớp ở trang Tổng quan */
export function MoBuoiLop({ l }: { l: LopMoBuoi }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  if (l.tong === 0) {
    return (
      <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
        Lớp chưa có chương trình học — <Link href="/gv/chuong-trinh/ap-dung" className="link">Áp dụng chương trình →</Link>
      </p>
    );
  }
  const xong = () => l.dangHoc && start(async () => {
    const kq = await xongBuoi(l.id, l.dangHoc!.lesson_id);
    if (!kq.ok) { toast(kq.loi!, "loi"); return; }
    toast(kq.tb!); router.refresh();
  });
  const quayLai = () => start(async () => {
    const kq = await quayLaiBuoi(l.id);
    if (!kq.ok) { toast(kq.loi!, "loi"); return; }
    toast(kq.tb!); router.refresh();
  });
  return (
    <div className="rounded-2xl border border-vien bg-xanh-50/40 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-navy-800">
          Đã học {l.soDaHoc}/{l.tong} buổi <span className="font-medium text-slate-500">· HS xem được {l.soDaMo}</span>
        </p>
        <CaiDat l={l} />
      </div>

      {l.chuaBatDau ? (
        <div className="space-y-2 py-1.5">
          <p className="text-sm font-semibold">Lớp đang học tới buổi nào?</p>
          <ChonDangHoc classId={l.id} ds={l.dsBuoi} />
          <p className="text-xs text-slate-500">Chọn buổi lớp đang học — các buổi trước sẽ mở cho học sinh xem lại.</p>
        </div>
      ) : l.dangHoc ? (
        <>
          <div className="flex items-center gap-3 py-2">
            <MapPin className="h-5 w-5 shrink-0 text-cam-500" />
            <div className="hang-chu">
              <p className="text-xs font-bold uppercase tracking-wide text-cam-600">Đang học</p>
              <p className="font-semibold leading-snug">{l.dangHoc.ten}</p>
            </div>
            <GatMo b={l.dangHoc} classId={l.id} />
          </div>
          <div className="flex flex-wrap items-center gap-2 pb-1">
            <Button size="sm" onClick={xong} disabled={pending} className="!whitespace-normal">
              <Check className="h-4 w-4 shrink-0" /> {l.tiepTheo ? `Xong buổi này → sang ${l.tiepTheo.ten.split(":")[0]}` : "Xong buổi cuối"}
            </Button>
            {l.coBuoiTruoc && <Button size="sm" variant="ghost" onClick={quayLai} disabled={pending} aria-label="Quay lại buổi trước"><Undo2 className="h-4 w-4" /> Quay lại</Button>}
          </div>
          {l.tiepTheo && (
            <div className="flex items-center gap-3 border-t border-vien py-2">
              <span className="w-5 shrink-0" />
              <div className="hang-chu">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Buổi tiếp theo · mở sớm nếu cần</p>
                <p className="font-semibold leading-snug">{l.tiepTheo.ten}</p>
              </div>
              <GatMo b={l.tiepTheo} classId={l.id} />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 py-2">
          <p className="text-sm text-slate-600">Lớp đã học hết chương trình 🎉</p>
          {l.coBuoiTruoc && <Button size="sm" variant="ghost" onClick={quayLai} disabled={pending}><Undo2 className="h-4 w-4" /> Quay lại</Button>}
        </div>
      )}
    </div>
  );
}
