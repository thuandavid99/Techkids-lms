import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { btnClass } from "@/components/ui/Button";
import { fmtDateTime } from "@/lib/domain/time";

export const metadata = { title: "Nhật ký thay đổi" };

const HD: Record<string, string> = {
  sua_diem: "Sửa điểm", sua_han: "Sửa hạn nộp", xoa: "Xóa (thùng rác)", an: "Ẩn", hien: "Hiện", khoi_phuc: "Khôi phục", xoa_vinh_vien: "Xóa vĩnh viễn",
  reset_mk: "Reset mật khẩu", can_nop_lai: "Yêu cầu nộp lại", mo_nop_lai: "Mở cho nộp lại", nhap_diem_excel: "Nhập điểm Excel", nhap_ppct: "Nhập PPCT",
  ap_dung_ct: "Áp dụng chương trình", doi_lich: "Dời lịch", mien_nop: "Miễn nộp", bo_mien_nop: "Bỏ miễn nộp", nop_ho: "Nộp hộ", chuyen_lop: "Chuyển lớp",
  sua: "Sửa", sua_rieng_lop: "Sửa riêng lớp", gop_buoi: "Gộp buổi", nhan_ban: "Nhân bản", lam_sach: "Làm sạch thùng rác", nghi_hoc: "Nghỉ học", di_hoc_lai: "Đi học lại",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ dt?: string; hd?: string; tu?: string }> }) {
  const sp = await searchParams;
  const sb = await createClient();
  let q = sb.from("audit_log").select("*").order("luc", { ascending: false }).limit(300);
  if (sp.dt) q = q.eq("doi_tuong", sp.dt);
  if (sp.hd) q = q.eq("hanh_dong", sp.hd);
  if (sp.tu && /^\d{4}-\d{2}-\d{2}$/.test(sp.tu)) q = q.gte("luc", `${sp.tu}T00:00:00+07:00`);
  const [{ data }, { data: nguoi }] = await Promise.all([q, sb.from("profiles").select("id, ho_ten").neq("vai_tro", "hoc_sinh")]);
  const ten = new Map((nguoi ?? []).map((n) => [n.id, n.ho_ten]));
  return (
    <Card>
      <PageHeader back={{ href: "/gv/cai-dat", label: "Cài đặt" }} title="Nhật ký thay đổi" sub="Ghi lại ai sửa gì, lúc nào (điểm đã chấm, hạn nộp, xóa/ẩn nội dung, reset mật khẩu…)." />
      <form className="mb-4 flex flex-wrap gap-2" action="/gv/cai-dat/nhat-ky">
        <select name="dt" defaultValue={sp.dt ?? ""} className="input !w-auto !rounded-2xl" aria-label="Đối tượng">
          <option value="">Mọi đối tượng</option>
          {["submissions", "assignments", "assignment_deadlines", "student_overrides", "lessons", "materials", "profiles", "classes", "curricula", "class_lessons"].map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <select name="hd" defaultValue={sp.hd ?? ""} className="input !w-auto !rounded-2xl" aria-label="Hành động"><option value="">Mọi hành động</option>{Object.entries(HD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <input type="date" name="tu" defaultValue={sp.tu ?? ""} className="input !w-auto !rounded-2xl" aria-label="Từ ngày" />
        <button className={btnClass("outline", "md")}>Lọc</button>
      </form>
      {!data?.length ? <EmptyState title="Chưa có thay đổi nào" /> : (
        <ul className="divide-y divide-vien rounded-2xl border border-vien bg-white">
          {data.map((x) => (
            <li key={x.id} className="px-4 py-3 text-sm">
              <details>
                <summary className="cursor-pointer"><b>{HD[x.hanh_dong] ?? x.hanh_dong}</b> · {x.doi_tuong} · {ten.get(x.user_id) ?? "Hệ thống"} · <span className="text-slate-500">{fmtDateTime(x.luc)}</span></summary>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <pre className="code-block !whitespace-pre-wrap text-xs">Trước: {JSON.stringify(x.truoc, null, 2)}</pre>
                  <pre className="code-block !whitespace-pre-wrap text-xs">Sau: {JSON.stringify(x.sau, null, 2)}</pre>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
