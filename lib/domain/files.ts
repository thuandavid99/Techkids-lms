// =====================================================================
// KIỂM TRA FILE TẢI LÊN: theo ĐUÔI + NỘI DUNG THẬT (vài byte đầu), không tin
// loại file do trình duyệt báo. Có kiểm thử: tests/files.test.ts
// =====================================================================

export type MucDich = "code" | "bai_nop_file" | "tai_lieu" | "de_bai";

export const GIOI_HAN_MB: Record<MucDich, number> = {
  code: 1,          // file .py/.txt (rất nhẹ)
  bai_nop_file: 2,   // Word/PDF nhỏ (không nhận ảnh chụp — tiết kiệm dung lượng gói miễn phí)
  tai_lieu: 50,
  de_bai: 20,
};

type Kieu = "pdf" | "zip" | "ole" | "png" | "jpg" | "gif" | "webp" | "text" | "mp3" | "mp4";

const DUOI: Record<string, { kieu: Kieu; mime: string }> = {
  py: { kieu: "text", mime: "text/x-python" },
  txt: { kieu: "text", mime: "text/plain" },
  md: { kieu: "text", mime: "text/markdown" },
  csv: { kieu: "text", mime: "text/csv" },
  pdf: { kieu: "pdf", mime: "application/pdf" },
  docx: { kieu: "zip", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  xlsx: { kieu: "zip", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  pptx: { kieu: "zip", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
  zip: { kieu: "zip", mime: "application/zip" },
  sb3: { kieu: "zip", mime: "application/x.scratch.sb3" },
  doc: { kieu: "ole", mime: "application/msword" },
  xls: { kieu: "ole", mime: "application/vnd.ms-excel" },
  ppt: { kieu: "ole", mime: "application/vnd.ms-powerpoint" },
  png: { kieu: "png", mime: "image/png" },
  jpg: { kieu: "jpg", mime: "image/jpeg" },
  jpeg: { kieu: "jpg", mime: "image/jpeg" },
  gif: { kieu: "gif", mime: "image/gif" },
  webp: { kieu: "webp", mime: "image/webp" },
  mp3: { kieu: "mp3", mime: "audio/mpeg" },
  mp4: { kieu: "mp4", mime: "video/mp4" },
};

export const DUOI_CHO_PHEP: Record<MucDich, string[]> = {
  code: ["py", "txt"],
  bai_nop_file: ["py", "txt", "pdf", "docx", "doc", "xlsx", "pptx", "zip", "sb3"],
  tai_lieu: ["pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt", "png", "jpg", "jpeg", "gif", "webp", "zip", "py", "txt", "md", "csv", "sb3", "mp3", "mp4"],
  de_bai: ["pdf", "docx", "doc", "xlsx", "pptx", "png", "jpg", "jpeg", "py", "txt", "zip"],
};

export function layDuoi(ten: string): string {
  const m = /\.([A-Za-z0-9]{1,5})$/.exec(ten.trim());
  return m ? m[1].toLowerCase() : "";
}

function batDau(b: Uint8Array, sig: number[], from = 0) {
  return sig.every((v, i) => b[from + i] === v);
}

/** Văn bản UTF-8 hợp lệ, không có byte NUL */
export function laVanBanUtf8(b: Uint8Array): boolean {
  if (b.includes(0)) return false;
  try { new TextDecoder("utf-8", { fatal: true }).decode(b); return true; }
  catch {
    // Có thể bị cắt ngang giữa một ký tự nhiều byte ở cuối đoạn đọc thử → bỏ tối đa 3 byte cuối rồi thử lại
    for (let k = 1; k <= 3; k++) {
      try { new TextDecoder("utf-8", { fatal: true }).decode(b.subarray(0, b.length - k)); return true; } catch { /* tiếp */ }
    }
    return false;
  }
}

function khopNoiDung(kieu: Kieu, b: Uint8Array): boolean {
  switch (kieu) {
    case "pdf": return batDau(b, [0x25, 0x50, 0x44, 0x46]); // %PDF
    case "zip": return batDau(b, [0x50, 0x4b, 0x03, 0x04]) || batDau(b, [0x50, 0x4b, 0x05, 0x06]);
    case "ole": return batDau(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    case "png": return batDau(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "jpg": return batDau(b, [0xff, 0xd8, 0xff]);
    case "gif": return batDau(b, [0x47, 0x49, 0x46, 0x38]);
    case "webp": return batDau(b, [0x52, 0x49, 0x46, 0x46]) && batDau(b, [0x57, 0x45, 0x42, 0x50], 8);
    case "mp3": return batDau(b, [0x49, 0x44, 0x33]) || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0);
    case "mp4": return batDau(b, [0x66, 0x74, 0x79, 0x70], 4); // ....ftyp
    case "text": return laVanBanUtf8(b);
  }
}

export interface KetQuaKiemTra { ok: boolean; loi?: string; duoi?: string; mime?: string }

/**
 * @param dauFile vài KB đầu của file (với .py/.txt nên là toàn bộ file)
 */
export function kiemTraFile(tenGoc: string, kichThuoc: number, dauFile: Uint8Array, mucDich: MucDich): KetQuaKiemTra {
  const duoi = layDuoi(tenGoc);
  const choPhep = DUOI_CHO_PHEP[mucDich];
  if (!duoi || !choPhep.includes(duoi)) {
    return { ok: false, loi: `Loại file không được hỗ trợ. Chỉ nhận: ${choPhep.map((d) => "." + d).join(", ")}.` };
  }
  const max = GIOI_HAN_MB[mucDich] * 1024 * 1024;
  if (kichThuoc <= 0) return { ok: false, loi: "File rỗng." };
  if (kichThuoc > max) return { ok: false, loi: `File quá lớn (tối đa ${GIOI_HAN_MB[mucDich]} MB).` };
  const info = DUOI[duoi];
  if (!khopNoiDung(info.kieu, dauFile)) {
    return { ok: false, loi: `Nội dung file không đúng là file .${duoi} (có thể file bị đổi đuôi hoặc bị hỏng).` };
  }
  return { ok: true, duoi, mime: info.mime };
}

export function mimeTheoDuoi(duoi: string): string {
  return DUOI[duoi]?.mime ?? "application/octet-stream";
}

/** Có xem trực tuyến được không (PDF và ảnh) */
export function xemTrucTuyenDuoc(tenHoacMime: string | null | undefined): boolean {
  if (!tenHoacMime) return false;
  const s = tenHoacMime.toLowerCase();
  return s.includes("pdf") || s.startsWith("image/") || /\.(pdf|png|jpe?g|gif|webp)$/.test(s);
}

export function kichThuocDep(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Link bài quiz (Quizizz/Wayground, Kahoot, Blooket, Google Forms…) → hiện nút "Làm Quiz" riêng trong buổi học */
export function laLinkQuiz(url: string | null | undefined, tenLoai?: string | null): boolean {
  if (tenLoai && /quiz/i.test(tenLoai)) return true;
  return !!url && /quizizz\.com|wayground\.com|kahoot\.(it|com)|blooket\.com|forms\.gle|docs\.google\.com\/forms/i.test(url);
}
