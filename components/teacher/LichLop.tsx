"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { capNhatBuoiLop, doiLich } from "@/lib/actions/gv/lop";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export interface DongLich { lesson_id: string; ten: string; ngay_hoc: string; hien_thi: boolean; ngay_mo: string; da_day: boolean; ghi_chu: string; noiBat: boolean; banNhap: boolean }

/** Lịch học của lớp: sửa trực tiếp ngày học, ẩn/hiện, hẹn giờ mở, đã dạy; dời lịch các buổi sau */
export function LichLop({ classId, ds }: { classId: string; ds: DongLich[] }) {
  const [pending, start] = useTransition();
  const [doi, setDoi] = useState<DongLich | null>(null);
  const [soNgay, setSoNgay] = useState(7);
  const toast = useToast();
  const router = useRouter();
  const luu = (id: string, v: Parameters<typeof capNhatBuoiLop>[2]) => start(async () => {
    const kq = await capNhatBuoiLop(classId, id, v);
    if (kq.ok) { toast("Đã lưu"); router.refresh(); } else toast(kq.loi!, "loi");
  });
  return (
    <>
      <div className="table-wrap rounded-2xl border border-vien bg-white">
        <table className="tbl min-w-[900px]">
          <thead><tr><th>Buổi</th><th>Ngày học</th><th>Hiện cho HS</th><th>Hẹn giờ mở</th><th>Đã dạy</th><th>Ghi chú</th><th></th></tr></thead>
          <tbody>
            {ds.map((b) => (
              <tr key={b.lesson_id} className={b.noiBat ? "bg-cam-50" : ""}>
                <td className="min-w-[220px] font-semibold">{b.ten}{b.banNhap && <span className="ml-1 text-xs text-slate-500">(bản nháp)</span>}</td>
                <td><input type="date" defaultValue={b.ngay_hoc} disabled={pending} aria-label="Ngày học" className="input !w-40 !py-1.5"
                  onBlur={(e) => e.target.value !== b.ngay_hoc && luu(b.lesson_id, { ngay_hoc: e.target.value || null })} /></td>
                <td><input type="checkbox" defaultChecked={b.hien_thi} disabled={pending} aria-label="Hiện cho học sinh" className="h-5 w-5 accent-blue-600"
                  onChange={(e) => luu(b.lesson_id, { hien_thi: e.target.checked })} /></td>
                <td><input type="datetime-local" defaultValue={b.ngay_mo} disabled={pending} aria-label="Hẹn giờ mở" className="input !w-52 !py-1.5"
                  onBlur={(e) => e.target.value !== b.ngay_mo && luu(b.lesson_id, { ngay_mo: e.target.value || null })} /></td>
                <td><input type="checkbox" defaultChecked={b.da_day} disabled={pending} aria-label="Đã dạy" className="h-5 w-5 accent-green-600"
                  onChange={(e) => luu(b.lesson_id, { da_day: e.target.checked })} /></td>
                <td><input defaultValue={b.ghi_chu} disabled={pending} aria-label="Ghi chú" className="input !py-1.5" placeholder="—"
                  onBlur={(e) => e.target.value !== b.ghi_chu && luu(b.lesson_id, { ghi_chu: e.target.value })} /></td>
                <td><button onClick={() => setDoi(b)} className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-xanh-600 hover:underline"><CalendarClock className="h-4 w-4" /> Dời lịch</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!doi} onClose={() => setDoi(null)} title="Dời lịch">
        <p>Dời <b>{doi?.ten}</b> và <b>các buổi sau</b> thêm:</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input type="number" value={soNgay} onChange={(e) => setSoNgay(parseInt(e.target.value || "0", 10))} className="input !w-24" aria-label="Số ngày" />
          <span>ngày</span>
          <Button variant="outline" size="sm" onClick={() => setSoNgay(7)}>1 tuần</Button>
          <Button variant="outline" size="sm" onClick={() => setSoNgay(14)}>2 tuần</Button>
        </div>
        <p className="mt-2 text-sm text-slate-500">Nhập số âm để lùi lịch về trước. Hạn nộp bài tập không tự đổi (sửa trong trang bài tập).</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outlineGray" onClick={() => setDoi(null)}>Hủy</Button>
          <Button disabled={pending} onClick={() => start(async () => {
            const kq = await doiLich(classId, doi!.lesson_id, soNgay);
            if (kq.ok) { toast(kq.tb!); setDoi(null); router.refresh(); } else toast(kq.loi!, "loi");
          })}>Dời lịch</Button>
        </div>
      </Modal>
    </>
  );
}
