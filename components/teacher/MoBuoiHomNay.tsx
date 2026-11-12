"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, LockOpen, Settings2 } from "lucide-react";
import { ConfirmButton } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { gatMoBuoi, datCheDoMo, khoaBuoiChuaDay } from "@/lib/actions/gv/lop";

export interface BuoiGat { lesson_id: string; ten: string; ngay: string; mo: boolean }
export interface LopMoBuoi {
  id: string; ten_lop: string; cheDo: "thu_cong" | "theo_lich";
  homNay: BuoiGat | null; coLichHomNay: boolean; tiepTheo: BuoiGat | null;
  soDaMo: number; tong: number;
}

/** Nút gạt kiểu công tắc (bấm là lưu ngay) */
function CongTac({ bat, onDoi, disabled, nhan }: { bat: boolean; onDoi: (v: boolean) => void; disabled?: boolean; nhan: string }) {
  return (
    <button type="button" role="switch" aria-checked={bat} aria-label={nhan} disabled={disabled} onClick={() => onDoi(!bat)}
      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${bat ? "bg-la-500" : "bg-slate-300"}`}>
      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow transition-transform ${bat ? "translate-x-7" : "translate-x-1"}`}>
        {bat ? <LockOpen className="h-3.5 w-3.5 text-la-600" /> : <Lock className="h-3.5 w-3.5 text-slate-500" />}
      </span>
    </button>
  );
}

function DongBuoi({ nhan, b, classId, onXong }: { nhan: string; b: BuoiGat; classId: string; onXong: () => void }) {
  const [mo, setMo] = useState(b.mo);
  const [pending, start] = useTransition();
  const toast = useToast();
  useEffect(() => setMo(b.mo), [b.mo]);
  const doi = (v: boolean) => start(async () => {
    setMo(v);
    const kq = await gatMoBuoi(classId, b.lesson_id, v);
    if (!kq.ok) { setMo(!v); toast(kq.loi!, "loi"); return; }
    toast(kq.tb!); onXong();
  });
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="hang-chu">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{nhan}{b.ngay ? ` · ${b.ngay}` : ""}</p>
        <p className="font-semibold leading-snug">{b.ten}</p>
      </div>
      <span className={`hidden text-xs font-semibold sm:inline ${mo ? "text-la-600" : "text-slate-400"}`}>{mo ? "Đang mở" : "Đang khóa"}</span>
      <CongTac bat={mo} onDoi={doi} disabled={pending} nhan={`${mo ? "Khóa" : "Mở"} ${b.ten}`} />
    </div>
  );
}

/** Nút ⚙ của thẻ lớp: cách mở buổi, mở/khóa buổi khác, khóa các buổi chưa dạy (ít dùng nên cất vào đây) */
function CaiDatMo({ l }: { l: LopMoBuoi }) {
  const [mo, setMo] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  useEffect(() => {
    const f = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setMo(false); };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, []);
  const doiCheDo = (v: "thu_cong" | "theo_lich") => start(async () => {
    const kq = await datCheDoMo(l.id, v);
    if (!kq.ok) { toast(kq.loi!, "loi"); return; }
    toast(kq.tb!); router.refresh();
  });
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setMo((x) => !x)} aria-expanded={mo} aria-label={`Cài đặt mở buổi lớp ${l.ten_lop}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-xanh-50 hover:text-navy-800">
        <Settings2 className="h-5 w-5" />
      </button>
      {mo && (
        <div className="card absolute right-0 top-10 z-30 w-72 max-w-[calc(100vw-3rem)] space-y-3 p-4 text-sm">
          <label className="block">
            <span className="label">Cách mở buổi</span>
            <select className="input !py-2 text-sm" value={l.cheDo} disabled={pending} onChange={(e) => doiCheDo(e.target.value as "thu_cong" | "theo_lich")}>
              <option value="thu_cong">Thầy tự gạt mở</option>
              <option value="theo_lich">Tự mở theo lịch học</option>
            </select>
          </label>
          <Link href={`/gv/lop/${l.id}/lich`} className="link block">Mở / khóa buổi khác →</Link>
          {l.cheDo === "thu_cong" && (
            <ConfirmButton action={() => khoaBuoiChuaDay(l.id)} onDone={() => { setMo(false); router.refresh(); }} variant="outlineGray" size="sm" className="w-full"
              title={`Khóa các buổi chưa dạy của lớp ${l.ten_lop}?`} confirmText="Khóa các buổi chưa dạy"
              message="Các buổi chưa đánh dấu “Đã dạy” và chưa tới ngày học sẽ bị khóa. Buổi đã học vẫn mở bình thường. Sau đó thầy gạt mở từng buổi khi dạy tới.">
              Khóa các buổi chưa dạy
            </ConfirmButton>
          )}
        </div>
      )}
    </div>
  );
}

/** Phần "mở buổi" nằm trong thẻ của từng lớp ở trang Tổng quan */
export function MoBuoiLop({ l }: { l: LopMoBuoi }) {
  const router = useRouter();
  if (l.tong === 0) {
    return (
      <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
        Lớp chưa có chương trình học — <Link href="/gv/chuong-trinh/ap-dung" className="link">Áp dụng chương trình →</Link>
      </p>
    );
  }
  return (
    <div className="rounded-2xl border border-vien bg-xanh-50/40 px-3 py-1">
      <div className="flex items-center justify-between gap-2 pt-1.5">
        <p className="text-sm font-bold text-navy-800">
          Mở buổi cho học sinh <span className="font-medium text-slate-500">· đã mở {l.soDaMo}/{l.tong}{l.cheDo === "theo_lich" ? " · tự mở theo lịch" : ""}</span>
        </p>
        <CaiDatMo l={l} />
      </div>
      {l.homNay ? (
        <div className="divide-y divide-vien">
          <DongBuoi nhan={l.coLichHomNay ? "Buổi hôm nay" : "Buổi dạy tới"} b={l.homNay} classId={l.id} onXong={() => router.refresh()} />
          {l.tiepTheo && <DongBuoi nhan="Buổi tiếp theo" b={l.tiepTheo} classId={l.id} onXong={() => router.refresh()} />}
        </div>
      ) : <p className="py-2.5 text-sm text-slate-600">Đã mở hết các buổi 🎉</p>}
    </div>
  );
}
