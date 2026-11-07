import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { kiemTraFile, layDuoi, type MucDich } from "@/lib/domain/files";

export type Bucket = "submissions" | "materials" | "assignment-files";

/** Tên lưu an toàn: thư mục/<mã ngẫu nhiên>.<đuôi> (không dấu, không phụ thuộc tên gốc) */
export function tenLuuAnToan(thuMuc: string, tenGoc: string): string {
  const duoi = layDuoi(tenGoc) || "bin";
  const sach = thuMuc.replace(/[^A-Za-z0-9/_-]/g, "");
  return `${sach}/${crypto.randomUUID()}.${duoi}`;
}

/** Cấp đường dẫn ký để trình duyệt tải file THẲNG lên Storage (không qua giới hạn 4.5MB của Vercel) */
export async function capLinkTaiLen(bucket: Bucket, path: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) throw new Error("Không tạo được đường dẫn tải lên. Thử lại sau ít phút.");
  return { path: data.path, token: data.token };
}

/** Đọc vài KB đầu + kích thước thật của file vừa tải lên, kiểm tra nội dung. File sai sẽ bị xóa. */
export async function xacMinhFile(bucket: Bucket, path: string, tenGoc: string, mucDich: MucDich) {
  const admin = createAdminClient();
  const thuMuc = path.split("/").slice(0, -1).join("/");
  const ten = path.split("/").pop()!;
  const { data: ds } = await admin.storage.from(bucket).list(thuMuc, { search: ten, limit: 5 });
  const obj = ds?.find((x) => x.name === ten);
  const size = Number((obj?.metadata as { size?: number } | null)?.size ?? 0);
  if (!obj) return { ok: false as const, loi: "Không thấy file vừa tải lên. Em thử tải lại nhé." };

  const { data: signed } = await admin.storage.from(bucket).createSignedUrl(path, 60);
  let dau = new Uint8Array();
  if (signed?.signedUrl) {
    const res = await fetch(signed.signedUrl, { headers: { Range: "bytes=0-8191" } });
    dau = new Uint8Array(await res.arrayBuffer()).subarray(0, 8192);
  }
  const kq = kiemTraFile(tenGoc, size, dau, mucDich);
  if (!kq.ok) {
    await admin.storage.from(bucket).remove([path]);
    return { ok: false as const, loi: kq.loi! };
  }
  return { ok: true as const, size, mime: kq.mime!, duoi: kq.duoi! };
}

/** Đường dẫn tải có thời hạn ngắn (mặc định 5 phút) */
export async function linkTaiVe(bucket: Bucket, path: string, tenTai?: string, giay = 300) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, giay, tenTai ? { download: tenTai } : undefined);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function xoaFile(bucket: Bucket, paths: (string | null | undefined)[]) {
  const ds = paths.filter((p): p is string => !!p);
  if (ds.length === 0) return;
  await createAdminClient().storage.from(bucket).remove(ds);
}
