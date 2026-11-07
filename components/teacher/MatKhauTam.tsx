"use client";
import { KeyRound } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { CopyButton, DownloadTextButton } from "@/components/ui/CopyButton";
import type { TaiKhoanTam } from "@/lib/actions/gv/hs";

/** Bảng mã HS + mật khẩu tạm — CHỈ HIỆN MỘT LẦN ngay sau khi tạo/reset */
export function BangMatKhauTam({ ds, onClose }: { ds: TaiKhoanTam[] | null; onClose: () => void }) {
  const text = (ds ?? []).map((x) => `${x.ma_hs}\t${x.ho_ten}\t${x.mat_khau}`).join("\n");
  const csv = "Mã HS,Họ tên,Mật khẩu tạm\n" + (ds ?? []).map((x) => `${x.ma_hs},"${x.ho_ten.replace(/"/g, '""')}",${x.mat_khau}`).join("\n");
  return (
    <Modal open={!!ds?.length} onClose={onClose} title={<span className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-cam-500" /> Mật khẩu tạm (chỉ hiện một lần)</span>} wide>
      <p className="mb-3 rounded-xl bg-cam-50 px-3 py-2 text-sm text-cam-600">
        Hãy <b>Sao chép</b> hoặc <b>Tải CSV</b> ngay. Đóng hộp này là không xem lại được. Học sinh đăng nhập bằng <b>Mã HS + mật khẩu tạm</b>, sau đó tự đặt mật khẩu mới.
      </p>
      <div className="table-wrap max-h-[50dvh] rounded-xl border border-vien">
        <table className="tbl"><thead><tr><th>Mã HS</th><th>Họ tên</th><th>Mật khẩu tạm</th></tr></thead>
          <tbody>{ds?.map((x) => <tr key={x.ma_hs}><td className="font-mono">{x.ma_hs}</td><td>{x.ho_ten}</td><td className="font-mono text-lg font-bold tracking-wider">{x.mat_khau}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <CopyButton text={text}>Sao chép bảng</CopyButton>
        <DownloadTextButton filename={`mat-khau-tam-${new Date().toISOString().slice(0, 10)}.csv`} text={csv}>Tải CSV</DownloadTextButton>
      </div>
    </Modal>
  );
}
