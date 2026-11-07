// Quy ước đặt tên hiển thị thống nhất (spec 6.3)

export function tenBuoi(nhan: string | null | undefined, tieuDe: string): string {
  const n = (nhan ?? "").trim();
  return n ? `Buổi ${n}: ${tieuDe}` : tieuDe;
}

export function tenBaiTap(ma: string | null | undefined, tieuDe: string): string {
  const m = (ma ?? "").trim();
  return m ? `Bài tập ${m}: ${tieuDe}` : tieuDe;
}

/** Bỏ dấu tiếng Việt: "Nguyễn Ân" → "Nguyen An" */
export function boDau(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}

/** Tên file chuẩn khi thầy tải về: 6A1_HS001_NguyenAn_Bai7.1.py */
export function tenFileTaiVe(lop: string, maHs: string, hoTen: string, maBai: string, duoi: string): string {
  const ten = boDau(hoTen).replace(/[^A-Za-z0-9]+/g, " ").trim().split(/\s+/).map((w) => w[0]?.toUpperCase() + w.slice(1)).join("");
  const sach = (x: string) => boDau(x).replace(/[^A-Za-z0-9.]+/g, "");
  return `${sach(lop)}_${sach(maHs)}_${ten}_Bai${sach(maBai)}.${duoi.replace(/^\./, "")}`;
}

/** Chuẩn hóa nhãn buổi: "10,11" / "10-11" / "10 - 11" → "10–11"; "7" → "7" */
export function chuanHoaNhanBuoi(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const nums = s.split(/\s*[,;\-–—]\s*|\s+đến\s+/i).map((x) => x.trim()).filter(Boolean);
  if (nums.length >= 2 && nums.every((x) => /^\d+$/.test(x))) {
    const n = nums.map(Number);
    const lienTiep = n.every((v, i) => i === 0 || v === n[i - 1] + 1);
    return lienTiep ? `${n[0]}–${n[n.length - 1]}` : n.join(", ");
  }
  return s.replace(/\.0+$/, ""); // Excel đôi khi trả "7.0"
}

/** Các số buổi trong nhãn: "10–11" → [10, 11]; "7" → [7]; "Ôn tập" → [] */
export function soTrongNhan(nhan: string): number[] {
  const s = nhan.trim();
  const m = /^(\d+)\s*[–-]\s*(\d+)$/.exec(s);
  if (m) {
    const a = +m[1], b = +m[2];
    if (b >= a && b - a < 50) return Array.from({ length: b - a + 1 }, (_, i) => a + i);
  }
  return s.split(/\s*,\s*/).filter((x) => /^\d+$/.test(x)).map(Number);
}
