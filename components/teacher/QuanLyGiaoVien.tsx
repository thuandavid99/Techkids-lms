"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Lock, LockOpen, Pencil, Plus, School, UserCog } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmButton } from "@/components/ui/Modal";
import { Pill } from "@/components/ui/Pill";
import { CopyButton } from "@/components/ui/CopyButton";
import { useToast } from "@/components/ui/Toast";
import { taoGiaoVien, suaGiaoVien, ganLopChoGv, datLaiMatKhauGv, khoaGiaoVien, type TaiKhoanGvTam } from "@/lib/actions/gv/giaovien";
import type { KQ } from "@/lib/types";

export interface DongGv {
  id: string; ho_ten: string; email: string; vai_tro: "quan_tri" | "giao_vien" | "tro_giang";
  khoa: boolean; lop: string[]; dang_nhap_cuoi: string | null; la_toi: boolean; doi_mk: boolean;
}
export interface LopNho { id: string; ten_lop: string }

const TEN_VT: Record<string, string> = { quan_tri: "Quản trị", giao_vien: "Giáo viên", tro_giang: "Trợ giảng" };

/** Hộp hiện mật khẩu tạm của giáo viên — CHỈ MỘT LẦN */
function BangMkGv({ ds, onClose }: { ds: TaiKhoanGvTam[] | null; onClose: () => void }) {
  const text = (ds ?? []).map((x) => `Họ tên: ${x.ho_ten}\nĐăng nhập tại: ${typeof window !== "undefined" ? window.location.origin : ""}/giao-vien\nEmail: ${x.email}\nMật khẩu tạm: ${x.mat_khau}`).join("\n\n");
  return (
    <Modal open={!!ds?.length} onClose={onClose} title={<span className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-cam-500" /> Mật khẩu tạm (chỉ hiện một lần)</span>}>
      <p className="mb-3 rounded-xl bg-cam-50 px-3 py-2 text-sm text-cam-600">
        Gửi thông tin này cho giáo viên ngay (Zalo/tin nhắn). Đóng hộp là <b>không xem lại được</b>. Giáo viên đăng nhập ở trang <b>/giao-vien</b> và sẽ phải đặt mật khẩu mới.
      </p>
      {ds?.map((x) => (
        <div key={x.email} className="rounded-xl border border-vien p-3">
          <p className="font-semibold">{x.ho_ten}</p>
          <p className="text-sm">Email: <span className="font-mono">{x.email}</span></p>
          <p className="text-sm">Mật khẩu tạm: <span className="font-mono text-lg font-bold tracking-wider">{x.mat_khau}</span></p>
        </div>
      ))}
      <div className="mt-4 flex justify-end gap-2"><CopyButton text={text}>Sao chép để gửi</CopyButton><Button variant="navy" onClick={onClose}>Đã gửi – Đóng</Button></div>
    </Modal>
  );
}

function ChonLop({ lops, chon, setChon }: { lops: LopNho[]; chon: string[]; setChon?: (x: string[]) => void }) {
  if (!lops.length) return <p className="text-sm text-slate-500">Chưa có lớp nào. Tạo lớp ở mục Quản lý lớp trước.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {lops.map((l) => {
        const on = chon.includes(l.id);
        return (
          <label key={l.id} className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${on ? "border-xanh-600 bg-xanh-50 text-xanh-700" : "border-vien bg-white text-slate-600"}`}>
            <input type="checkbox" name="lop" value={l.id} checked={on} className="accent-xanh-600"
              onChange={(e) => setChon?.(e.target.checked ? [...chon, l.id] : chon.filter((x) => x !== l.id))} />
            {l.ten_lop}
          </label>
        );
      })}
    </div>
  );
}

function FormThem({ lops, onXong }: { lops: LopNho[]; onXong: (ds: TaiKhoanGvTam[]) => void }) {
  const [s, act, pending] = useActionState(taoGiaoVien, { ok: false } as KQ);
  const [chon, setChon] = useState<string[]>([]);
  useEffect(() => { if (s.ok && s.data) onXong(s.data as TaiKhoanGvTam[]); }, [s, onXong]);
  return (
    <form action={act} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor="gv-email">Email</label><input id="gv-email" name="email" type="email" required placeholder="co.lan@gmail.com" className="input" autoCapitalize="none" /></div>
        <div><label className="label" htmlFor="gv-ten">Họ tên</label><input id="gv-ten" name="ho_ten" required placeholder="Nguyễn Thị Lan" className="input" /></div>
      </div>
      <div>
        <label className="label" htmlFor="gv-vt">Vai trò</label>
        <select id="gv-vt" name="vai_tro" className="input" defaultValue="giao_vien">
          <option value="giao_vien">Giáo viên — chỉ lớp được gán</option>
          <option value="quan_tri">Quản trị — toàn quyền</option>
        </select>
      </div>
      <div><p className="label">Lớp phụ trách</p><ChonLop lops={lops} chon={chon} setChon={setChon} /></div>
      {!s.ok && s.loi && <p role="alert" className="rounded-xl bg-do-50 px-3 py-2 text-sm text-do-600">{s.loi}</p>}
      <div className="flex justify-end"><Button type="submit" disabled={pending}>{pending ? "Đang tạo…" : "Tạo tài khoản"}</Button></div>
    </form>
  );
}

export function QuanLyGiaoVien({ ds, lops }: { ds: DongGv[]; lops: LopNho[] }) {
  const [them, setThem] = useState(false);
  const [mk, setMk] = useState<TaiKhoanGvTam[] | null>(null);
  const [sua, setSua] = useState<DongGv | null>(null);
  const [gan, setGan] = useState<DongGv | null>(null);
  const [chonLop, setChonLop] = useState<string[]>([]);
  const [hoTen, setHoTen] = useState(""); const [vaiTro, setVaiTro] = useState("giao_vien");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const tenLop = new Map(lops.map((l) => [l.id, l.ten_lop]));

  const chay = (fn: () => Promise<KQ>, sau?: () => void) => start(async () => {
    const kq = await fn().catch((e) => ({ ok: false, loi: (e as Error).message } as KQ));
    if (kq.ok) { toast(kq.tb ?? "Đã lưu"); sau?.(); router.refresh(); } else toast(kq.loi ?? "Có lỗi xảy ra", "loi");
  });

  return (
    <>
      <div className="mb-4 flex justify-end"><Button onClick={() => setThem(true)}><Plus className="h-4 w-4" /> Thêm giáo viên</Button></div>

      <div className="table-wrap">
        <table className="tbl min-w-[820px]">
          <thead><tr><th>Họ tên</th><th>Email đăng nhập</th><th>Vai trò</th><th>Lớp phụ trách</th><th>Trạng thái</th><th className="text-right">Thao tác</th></tr></thead>
          <tbody>
            {ds.map((g) => (
              <tr key={g.id} className={g.khoa ? "opacity-60" : ""}>
                <td className="font-semibold">{g.ho_ten}{g.la_toi && <span className="ml-1 text-xs font-normal text-slate-500">(bạn)</span>}</td>
                <td className="font-mono text-sm">{g.email || "—"}</td>
                <td><Pill mau={g.vai_tro === "quan_tri" ? "orange" : "blue"}>{TEN_VT[g.vai_tro]}</Pill></td>
                <td>
                  {g.vai_tro === "quan_tri" ? <span className="text-sm text-slate-500">Tất cả lớp</span>
                    : g.lop.length ? <div className="flex flex-wrap gap-1">{g.lop.map((l) => <Pill key={l} mau="gray">{tenLop.get(l) ?? "?"}</Pill>)}</div>
                    : <span className="text-sm text-do-600">Chưa gán lớp</span>}
                </td>
                <td className="text-sm">
                  {g.khoa ? <Pill mau="red">Đã khóa</Pill> : g.doi_mk ? <Pill mau="yellow">Chờ đổi mật khẩu</Pill> : <Pill mau="green">Đang dạy</Pill>}
                  {g.dang_nhap_cuoi && <p className="mt-1 text-xs text-slate-500">Vào lần cuối: {g.dang_nhap_cuoi}</p>}
                </td>
                <td>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => { setSua(g); setHoTen(g.ho_ten); setVaiTro(g.vai_tro === "quan_tri" ? "quan_tri" : "giao_vien"); }} title="Sửa"><Pencil className="h-4 w-4" /></Button>
                    {g.vai_tro !== "quan_tri" && <Button size="sm" variant="outline" onClick={() => { setGan(g); setChonLop(g.lop); }}><School className="h-4 w-4" /> Gán lớp</Button>}
                    {!g.la_toi && (
                      <ConfirmButton action={datLaiMatKhauGv.bind(null, g.id)} title="Cấp lại mật khẩu?" confirmText="Cấp mật khẩu mới"
                        message={<>Tạo mật khẩu tạm mới cho <b>{g.ho_ten}</b>. Mật khẩu cũ sẽ không dùng được nữa.</>}
                        onDone={(kq) => { if (kq.ok && kq.data) setMk(kq.data as TaiKhoanGvTam[]); }}><KeyRound className="h-4 w-4" /></ConfirmButton>
                    )}
                    {!g.la_toi && (g.khoa
                      ? <ConfirmButton action={khoaGiaoVien.bind(null, g.id, false)} title="Mở khóa tài khoản?" message={<>{g.ho_ten} sẽ đăng nhập lại được.</>} confirmText="Mở khóa"><LockOpen className="h-4 w-4" /></ConfirmButton>
                      : <ConfirmButton action={khoaGiaoVien.bind(null, g.id, true)} danger title="Khóa tài khoản?" confirmText="Khóa"
                          message={<><b>{g.ho_ten}</b> sẽ không đăng nhập được nữa. Điểm, nhận xét đã chấm vẫn được giữ. Có thể mở khóa lại sau.</>}><Lock className="h-4 w-4" /></ConfirmButton>)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={them} onClose={() => setThem(false)} title={<span className="flex items-center gap-2"><UserCog className="h-5 w-5 text-cam-500" /> Thêm giáo viên</span>} wide>
        <FormThem lops={lops} onXong={(x) => { setThem(false); setMk(x); router.refresh(); }} />
      </Modal>

      <Modal open={!!sua} onClose={() => !pending && setSua(null)} title="Sửa thông tin giáo viên">
        <div className="space-y-3">
          <div><label className="label" htmlFor="s-ten">Họ tên</label><input id="s-ten" className="input" value={hoTen} onChange={(e) => setHoTen(e.target.value)} /></div>
          <div><label className="label" htmlFor="s-vt">Vai trò</label>
            <select id="s-vt" className="input" value={vaiTro} onChange={(e) => setVaiTro(e.target.value)}>
              <option value="giao_vien">Giáo viên — chỉ lớp được gán</option><option value="quan_tri">Quản trị — toàn quyền</option>
            </select></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outlineGray" onClick={() => setSua(null)} disabled={pending}>Hủy</Button>
            <Button disabled={pending} onClick={() => sua && chay(() => suaGiaoVien(sua.id, hoTen, vaiTro), () => setSua(null))}>{pending ? "Đang lưu…" : "Lưu"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!gan} onClose={() => !pending && setGan(null)} title={`Lớp phụ trách – ${gan?.ho_ten ?? ""}`}>
        <p className="mb-3 text-sm text-slate-600">Giáo viên chỉ thấy học sinh, bài nộp, điểm của các lớp được chọn.</p>
        <ChonLop lops={lops} chon={chonLop} setChon={setChonLop} />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outlineGray" onClick={() => setGan(null)} disabled={pending}>Hủy</Button>
          <Button disabled={pending} onClick={() => gan && chay(() => ganLopChoGv(gan.id, chonLop), () => setGan(null))}>{pending ? "Đang lưu…" : "Lưu"}</Button>
        </div>
      </Modal>

      <BangMkGv ds={mk} onClose={() => setMk(null)} />
    </>
  );
}
