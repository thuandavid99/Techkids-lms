"use client";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmButton } from "@/components/ui/Modal";
import { ActionForm, SubmitButton } from "@/components/ui/ActionForm";
import { Pill } from "@/components/ui/Pill";
import { useToast } from "@/components/ui/Toast";
import { ExcelPicker, ChonCot, type TrangTinh } from "./ExcelPicker";
import { BangMatKhauTam } from "./MatKhauTam";
import { taoTaiKhoan, resetMatKhau, suaHocSinh, chuyenLop, datDangHoc, xoaHocSinh, type TaiKhoanTam } from "@/lib/actions/gv/hs";

export interface HsRow { id: string; ma_hs: string; ho_ten: string; dang_hoc: boolean; chuaDoiMk: boolean; xinReset: boolean; tienDo: { daNop: number; tong: number } }

export function QuanLyHocSinh({ classId, tenLop, ds, lops }: { classId: string; tenLop: string; ds: HsRow[]; lops: { id: string; ten_lop: string }[] }) {
  const [them, setThem] = useState(false);
  const [nhap, setNhap] = useState(false);
  const [mk, setMk] = useState<TaiKhoanTam[] | null>(null);
  const [sua, setSua] = useState<HsRow | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [chuyen, setChuyen] = useState<HsRow | null>(null);
  const [lopMoi, setLopMoi] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const run = (fn: () => Promise<{ ok: boolean; tb?: string; loi?: string; data?: unknown }>, hienMk = false) => start(async () => {
    const kq = await fn();
    if (kq.ok) { toast(kq.tb ?? "Đã lưu"); if (hienMk) setMk(kq.data as TaiKhoanTam[]); router.refresh(); }
    if (kq.loi) toast(kq.loi, "loi");
  });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="h-page">Quản lý học sinh - Lớp {tenLop}</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="green" onClick={() => setNhap(true)}><Upload className="h-4 w-4" /> Nhập từ Excel/CSV</Button>
          <Button onClick={() => setThem(true)}><Plus className="h-4 w-4" /> Thêm học sinh</Button>
        </div>
      </div>
      <div className="card card-pad">
        {ds.length === 0 ? <p className="py-8 text-center text-slate-500">Lớp chưa có học sinh. Bấm <b>Thêm học sinh</b> hoặc <b>Nhập từ Excel/CSV</b>.</p> : (
          <div className="table-wrap">
            <table className="tbl min-w-[760px] text-[1.02rem]">
              <thead><tr><th>Mã HS</th><th>Họ và tên</th><th>Trạng thái</th><th>Tiến độ</th><th className="text-center">Thao tác</th></tr></thead>
              <tbody>
                {ds.map((h) => {
                  const tl = h.tienDo.tong ? h.tienDo.daNop / h.tienDo.tong : 1;
                  return (
                    <tr key={h.id} className={h.dang_hoc ? "" : "opacity-60"}>
                      <td className="font-mono">{h.ma_hs}</td>
                      <td><Link href={`/gv/hoc-sinh/${h.id}`} className="font-medium hover:text-xanh-600">{h.ho_ten}</Link></td>
                      <td className="space-x-1">{h.dang_hoc ? <Pill mau="green">Đang học</Pill> : <Pill>Nghỉ học</Pill>}{h.chuaDoiMk && <Pill mau="yellow">Chưa đổi MK</Pill>}</td>
                      <td><Pill mau={tl >= 0.75 ? "green" : tl >= 0.5 ? "gray" : "orange"}>{h.tienDo.daNop}/{h.tienDo.tong} bài</Pill></td>
                      <td>
                        <div className="flex items-center justify-center gap-2">
                          <span className="relative">
                            <ConfirmButton action={() => resetMatKhau([h.id])} onDone={(kq) => kq.ok && setMk(kq.data as TaiKhoanTam[])} title="Reset mật khẩu?"
                              message={<>Cấp mật khẩu tạm mới cho <b>{h.ho_ten} ({h.ma_hs})</b>. Mật khẩu cũ hết hiệu lực; em sẽ đặt lại mật khẩu riêng khi đăng nhập.</>} confirmText="Reset">Reset mật khẩu</ConfirmButton>
                            {h.xinReset && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-do-600 ring-2 ring-white" title="Học sinh đã gửi yêu cầu cấp lại mật khẩu" />}
                          </span>
                          <span className="relative">
                            <button onClick={() => setMenu(menu === h.id ? null : h.id)} aria-label={`Thao tác khác cho ${h.ho_ten}`} className="rounded-lg p-1.5 hover:bg-slate-100"><MoreHorizontal className="h-5 w-5" /></button>
                            {menu === h.id && (
                              <div className="card absolute right-0 top-9 z-20 w-48 py-1 text-sm" onMouseLeave={() => setMenu(null)}>
                                <Link href={`/gv/hoc-sinh/${h.id}`} className="block px-3 py-2 hover:bg-xanh-50">Mở hồ sơ</Link>
                                <button className="block w-full px-3 py-2 text-left hover:bg-xanh-50" onClick={() => { setSua(h); setMenu(null); }}>Sửa thông tin</button>
                                <button className="block w-full px-3 py-2 text-left hover:bg-xanh-50" onClick={() => { setChuyen(h); setLopMoi(""); setMenu(null); }}>Chuyển lớp</button>
                                <button className="block w-full px-3 py-2 text-left hover:bg-xanh-50" onClick={() => { setMenu(null); run(() => datDangHoc(h.id, !h.dang_hoc)); }}>{h.dang_hoc ? "Đánh dấu nghỉ học" : "Đi học lại"}</button>
                                <div className="px-3 py-1"><ConfirmButton action={() => xoaHocSinh(h.id)} variant="ghost" size="sm" danger className="!px-0 text-do-600" title={`Xóa ${h.ho_ten}?`}
                                  message={<>Học sinh sẽ không đăng nhập được và bị ẩn khỏi lớp; bài nộp vẫn giữ trong Thùng rác 30 ngày. <b>Nên dùng “Nghỉ học”</b> nếu em chỉ tạm nghỉ.</>} confirmText="Xóa">Xóa…</ConfirmButton></div>
                              </div>
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ThemMotBan open={them} onClose={() => setThem(false)} onDone={(x) => { setThem(false); setMk(x); }} classId={classId} />
      <NhapExcel open={nhap} onClose={() => setNhap(false)} onDone={(x) => { setNhap(false); setMk(x); }} classId={classId} maDaCo={ds.map((d) => d.ma_hs)} />
      <BangMatKhauTam ds={mk} onClose={() => setMk(null)} />

      <Modal open={!!sua} onClose={() => setSua(null)} title="Sửa thông tin học sinh">
        {sua && (
          <ActionForm action={suaHocSinh} onOk={() => setSua(null)} className="space-y-3">
            <input type="hidden" name="id" value={sua.id} />
            <div><label className="label" htmlFor="ht">Họ và tên</label><input id="ht" name="ho_ten" defaultValue={sua.ho_ten} required className="input" /></div>
            <div><label className="label" htmlFor="ma">Mã học sinh (dùng để đăng nhập)</label><input id="ma" name="ma_hs" defaultValue={sua.ma_hs} required className="input font-mono" /></div>
            <div className="flex justify-end"><SubmitButton>Lưu</SubmitButton></div>
          </ActionForm>
        )}
      </Modal>
      <Modal open={!!chuyen} onClose={() => setChuyen(null)} title={`Chuyển lớp: ${chuyen?.ho_ten ?? ""}`}>
        <select className="input" value={lopMoi} onChange={(e) => setLopMoi(e.target.value)}>
          <option value="">— Chọn lớp mới —</option>
          {lops.filter((l) => l.id !== classId).map((l) => <option key={l.id} value={l.id}>Lớp {l.ten_lop}</option>)}
        </select>
        <p className="mt-2 text-sm text-slate-500">Bài nộp cũ vẫn được giữ. Học sinh sẽ thấy chương trình của lớp mới.</p>
        <div className="mt-4 flex justify-end gap-2"><Button variant="outlineGray" onClick={() => setChuyen(null)}>Hủy</Button>
          <Button disabled={!lopMoi || pending} onClick={() => { const h = chuyen!; setChuyen(null); run(() => chuyenLop(h.id, lopMoi)); }}>Chuyển lớp</Button></div>
      </Modal>
    </>
  );
}

function ThemMotBan({ open, onClose, onDone, classId }: { open: boolean; onClose: () => void; onDone: (x: TaiKhoanTam[]) => void; classId: string }) {
  const [hoTen, setHoTen] = useState("");
  const [ma, setMa] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <Modal open={open} onClose={onClose} title="Thêm một bạn">
      <div className="space-y-3">
        <div><label className="label" htmlFor="t-ht">Họ và tên</label><input id="t-ht" value={hoTen} onChange={(e) => setHoTen(e.target.value)} className="input" placeholder="Nguyễn Văn An" /></div>
        <div><label className="label" htmlFor="t-ma">Mã học sinh (để trống = tự tạo HSxxx)</label><input id="t-ma" value={ma} onChange={(e) => setMa(e.target.value)} className="input font-mono" placeholder="HS001" /></div>
        <div className="flex justify-end"><Button disabled={pending || !hoTen.trim()} onClick={() => start(async () => {
          const kq = await taoTaiKhoan(classId, [{ ho_ten: hoTen, ma_hs: ma }]);
          if (kq.ok) { toast(kq.tb!); setHoTen(""); setMa(""); onDone(kq.data as TaiKhoanTam[]); router.refresh(); } else toast(kq.loi ?? "Lỗi", "loi");
        })}>{pending ? "Đang tạo…" : "Tạo tài khoản"}</Button></div>
      </div>
    </Modal>
  );
}

function NhapExcel({ open, onClose, onDone, classId, maDaCo }: { open: boolean; onClose: () => void; onDone: (x: TaiKhoanTam[]) => void; classId: string; maDaCo: string[] }) {
  const [sheets, setSheets] = useState<TrangTinh[] | null>(null);
  const [si, setSi] = useState(0), [hd, setHd] = useState(0), [cMa, setCMa] = useState(-1), [cTen, setCTen] = useState(-1);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const rows = sheets?.[si]?.rows ?? [];
  const cot = rows[hd]?.o ?? [];
  const doc = (s: TrangTinh[]) => {
    setSheets(s); setSi(0);
    const r = s[0]?.rows ?? [];
    const h = Math.max(0, r.findIndex((x) => x.o.some((c) => /họ.*tên|ho ten|tên/i.test(c))));
    setHd(h);
    const o = r[h]?.o ?? [];
    setCMa(o.findIndex((c) => /mã/i.test(c)));
    setCTen(o.findIndex((c) => /họ.*tên|ho ten|tên/i.test(c)));
  };
  const xt = useMemo(() => {
    if (cTen < 0) return [];
    const da = new Set(maDaCo.map((m) => m.toLowerCase()));
    const trongFile = new Set<string>();
    return rows.slice(hd + 1).filter((r) => r.o.some((c) => c)).map((r) => {
      const ma = cMa >= 0 ? (r.o[cMa] ?? "").trim() : "";
      const ten = (r.o[cTen] ?? "").trim();
      let canh = "";
      if (!ten) canh = "Thiếu họ tên";
      else if (ma && da.has(ma.toLowerCase())) canh = "Mã đã có trong lớp";
      else if (ma && trongFile.has(ma.toLowerCase())) canh = "Trùng mã trong file";
      if (ma) trongFile.add(ma.toLowerCase());
      return { dong: r.dong, ma, ten, canh };
    });
  }, [rows, hd, cMa, cTen, maDaCo]);
  const hopLe = xt.filter((x) => !x.canh);
  return (
    <Modal open={open} onClose={onClose} title="Nhập danh sách học sinh từ Excel/CSV" wide>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <ExcelPicker onRead={doc} />
          <a href="/api/gv/xuat?loai=mau-hs" className="link text-sm">Tải file mẫu Excel (.xlsx)</a>
        </div>
        {sheets && (
          <div className="grid gap-3 sm:grid-cols-4">
            <label><span className="label">Trang tính</span><select className="input" value={si} onChange={(e) => setSi(Number(e.target.value))}>{sheets.map((s, i) => <option key={i} value={i}>{s.ten}</option>)}</select></label>
            <label><span className="label">Dòng tiêu đề</span><input type="number" min={1} className="input" value={hd + 1} onChange={(e) => setHd(Math.max(0, Number(e.target.value) - 1))} /></label>
            <ChonCot label="Cột mã HS (trống = tự tạo)" value={cMa} onChange={setCMa} cot={cot} />
            <ChonCot label="Cột họ tên" value={cTen} onChange={setCTen} cot={cot} batBuoc />
          </div>
        )}
        {xt.length > 0 && (
          <>
            <p className="font-semibold">{hopLe.length} học sinh hợp lệ · {xt.length - hopLe.length} dòng có cảnh báo (bỏ qua)</p>
            <div className="table-wrap max-h-[40dvh] rounded-xl border border-vien">
              <table className="tbl"><thead><tr><th>Dòng</th><th>Mã HS</th><th>Họ tên</th><th>Kiểm tra</th></tr></thead>
                <tbody>{xt.map((x) => <tr key={x.dong} className={x.canh ? "bg-do-50/60" : ""}><td>{x.dong}</td><td className="font-mono">{x.ma || <span className="text-slate-400">(tự tạo)</span>}</td><td>{x.ten}</td><td>{x.canh ? <Pill mau="red">{x.canh}</Pill> : <Pill mau="green">OK</Pill>}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="flex justify-end"><Button size="lg" disabled={pending || !hopLe.length} onClick={() => start(async () => {
              const kq = await taoTaiKhoan(classId, hopLe.map((x) => ({ ma_hs: x.ma, ho_ten: x.ten })));
              if (kq.loi) toast(kq.loi, "loi");
              if (kq.ok) { toast(kq.tb!); setSheets(null); onDone(kq.data as TaiKhoanTam[]); router.refresh(); }
            })}>{pending ? "Đang tạo tài khoản…" : `Xác nhận tạo ${hopLe.length} tài khoản`}</Button></div>
          </>
        )}
      </div>
    </Modal>
  );
}
