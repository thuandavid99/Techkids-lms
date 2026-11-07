"use client";
import { ActionForm, SubmitButton } from "@/components/ui/ActionForm";
import { luuCaiDat } from "@/lib/actions/gv/caidat";
import { doiMatKhauGv } from "@/lib/actions/auth";

export function QuyTacForm({ lamTron, choNopTre, hsTaiPhieu }: { lamTron: number; choNopTre: boolean; hsTaiPhieu: boolean }) {
  return (
    <ActionForm action={luuCaiDat} className="space-y-3">
      <label className="flex items-center gap-2"><input type="checkbox" name="cho_nop_tre_mac_dinh" defaultChecked={choNopTre} /> Bài tập mới mặc định <b>cho phép nộp trễ</b> (đánh dấu “Trễ”, không trừ điểm)</label>
      <label className="flex items-center gap-2"><input type="checkbox" name="hs_tai_phieu_tien_do" defaultChecked={hsTaiPhieu} /> Cho học sinh tự tải phiếu tiến độ (ở màn Kết quả)</label>
      <label className="flex items-center gap-2">Làm tròn điểm trung bình:
        <select name="lam_tron_diem" defaultValue={lamTron} className="input !w-auto !py-1"><option value={0}>0 chữ số</option><option value={1}>1 chữ số (8.3)</option><option value={2}>2 chữ số (8.33)</option></select>
      </label>
      <SubmitButton size="sm">Lưu quy tắc</SubmitButton>
    </ActionForm>
  );
}

export function DoiMatKhauGvForm() {
  return (
    <ActionForm action={doiMatKhauGv} resetOnOk refresh={false} className="grid gap-3 sm:grid-cols-3">
      <input name="mat_khau_cu" type="password" required placeholder="Mật khẩu hiện tại" aria-label="Mật khẩu hiện tại" className="input" autoComplete="current-password" />
      <input name="mat_khau" type="password" required minLength={8} placeholder="Mật khẩu mới (≥ 8 ký tự)" aria-label="Mật khẩu mới" className="input" autoComplete="new-password" />
      <input name="nhap_lai" type="password" required placeholder="Nhập lại mật khẩu mới" aria-label="Nhập lại mật khẩu mới" className="input" autoComplete="new-password" />
      <div><SubmitButton size="sm">Đổi mật khẩu</SubmitButton></div>
    </ActionForm>
  );
}
