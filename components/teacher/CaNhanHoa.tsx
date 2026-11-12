"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, LockOpen, CalendarClock, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { moBuoiRieng } from "@/lib/actions/gv/canhan";
import { thaoTacO } from "@/lib/actions/gv/cham";

export interface BuoiChon { lesson_id: string; ten: string }
export interface BaiChon { assignment_id: string; ten: string; han: string; hanRieng: string | null; mien: boolean }
export interface BaiRieng { assignment_id: string; ten: string }

/**
 * "Cá nhân hóa cho em" ở trang hồ sơ học sinh (giáo viên):
 * mở buổi riêng · gia hạn / miễn nộp riêng · bài riêng. Chỉ tác động tới đúng em này.
 */
export function CaNhanHoa({ studentId, tenHs, buoiKhoa, buoiMoRieng, baiTap, baiRieng }: {
  studentId: string; tenHs: string;
  buoiKhoa: BuoiChon[]; buoiMoRieng: BuoiChon[]; baiTap: BaiChon[]; baiRieng: BaiRieng[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [chonBuoi, setChonBuoi] = useState("");
  const [chonBai, setChonBai] = useState("");
  const [han, setHan] = useState("");
  const chay = (f: () => Promise<{ ok: boolean; tb?: string; loi?: string }>) => start(async () => {
    const kq = await f();
    if (!kq.ok) { toast(kq.loi ?? "Chưa lưu được", "loi"); return; }
    toast(kq.tb ?? "Đã lưu"); router.refresh();
  });
  const ngoaiLe = baiTap.filter((b) => b.hanRieng || b.mien);

  return (
    <section className="card card-pad space-y-5">
      <div>
        <h2 className="h-card flex items-center gap-2"><Sparkles className="h-6 w-6 text-tim-500" /> Cá nhân hóa cho em</h2>
        <p className="mt-1 text-sm text-slate-600">Chỉ áp dụng cho <b>{tenHs}</b>. Cả lớp vẫn theo lịch và bài chung, không bị ảnh hưởng.</p>
      </div>

      {/* 1. Mở buổi riêng */}
      <div className="rounded-2xl border border-vien p-3 sm:p-4">
        <h3 className="flex items-center gap-2 font-bold"><LockOpen className="h-5 w-5 text-la-600" /> Mở buổi riêng <span className="text-sm font-normal text-slate-500">(học bù / học vượt)</span></h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <select className="input min-w-0 flex-1 sm:!w-auto sm:max-w-sm" value={chonBuoi} onChange={(e) => setChonBuoi(e.target.value)} aria-label="Chọn buổi đang khóa">
            <option value="">— Chọn buổi lớp đang khóa —</option>
            {buoiKhoa.map((b) => <option key={b.lesson_id} value={b.lesson_id}>{b.ten}</option>)}
          </select>
          <Button size="sm" disabled={!chonBuoi || pending} onClick={() => chay(() => moBuoiRieng(studentId, chonBuoi, true))}>Mở cho em</Button>
        </div>
        {buoiMoRieng.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {buoiMoRieng.map((b) => (
              <li key={b.lesson_id} className="flex items-center gap-2 rounded-xl bg-la-50 px-3 py-2 text-sm">
                <span className="hang-chu font-semibold">{b.ten}</span>
                <button className="shrink-0 text-do-600 hover:underline" disabled={pending} onClick={() => chay(() => moBuoiRieng(studentId, b.lesson_id, false))}>Thu hồi</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 2. Gia hạn / miễn nộp */}
      <div className="rounded-2xl border border-vien p-3 sm:p-4">
        <h3 className="flex items-center gap-2 font-bold"><CalendarClock className="h-5 w-5 text-cam-500" /> Gia hạn / miễn nộp riêng</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <select className="input" value={chonBai} onChange={(e) => setChonBai(e.target.value)} aria-label="Chọn bài tập">
            <option value="">— Chọn bài tập —</option>
            {baiTap.map((b) => <option key={b.assignment_id} value={b.assignment_id}>{b.ten} (hạn lớp: {b.han})</option>)}
          </select>
          <input type="datetime-local" className="input sm:!w-auto" value={han} onChange={(e) => setHan(e.target.value)} aria-label="Hạn riêng" />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" disabled={!chonBai || !han || pending} onClick={() => chay(() => thaoTacO(chonBai, studentId, "gia_han", han))}>Gia hạn cho em</Button>
          <Button size="sm" variant="outline" disabled={!chonBai || pending} onClick={() => chay(() => thaoTacO(chonBai, studentId, "mien", "Miễn nộp riêng"))}>Miễn nộp bài này</Button>
        </div>
        {ngoaiLe.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {ngoaiLe.map((b) => (
              <li key={b.assignment_id} className="flex flex-wrap items-center gap-2 rounded-xl bg-cam-50 px-3 py-2 text-sm">
                <span className="hang-chu"><b>{b.ten}</b> — {b.mien ? "miễn nộp" : `hạn riêng: ${b.hanRieng}`}</span>
                <button className="shrink-0 text-do-600 hover:underline" disabled={pending}
                  onClick={() => chay(() => thaoTacO(b.assignment_id, studentId, b.mien ? "bo_mien" : "gia_han", ""))}>Bỏ ngoại lệ</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 3. Bài riêng */}
      <div className="rounded-2xl border border-vien p-3 sm:p-4">
        <h3 className="flex items-center gap-2 font-bold"><UserCheck className="h-5 w-5 text-xanh-600" /> Bài tập riêng của em</h3>
        {baiRieng.length ? (
          <ul className="mt-2 space-y-1.5">
            {baiRieng.map((b) => (
              <li key={b.assignment_id} className="flex items-center gap-2 rounded-xl bg-xanh-50 px-3 py-2 text-sm">
                <span className="hang-chu font-semibold">{b.ten}</span>
                <Link href={`/gv/bai-tap/sua/${b.assignment_id}`} className="link shrink-0">Sửa →</Link>
              </li>
            ))}
          </ul>
        ) : <p className="mt-1 text-sm text-slate-600">Chưa có. Muốn giao bài nâng cao / bài bù cho riêng em: mở <b>Soạn bài tập</b> → mục <b>“Giao cho ai”</b> → chọn <i>Chỉ một số em</i>.</p>}
      </div>
    </section>
  );
}
