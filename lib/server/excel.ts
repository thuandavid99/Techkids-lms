import "server-only";
import ExcelJS from "exceljs";
import type { DongExcel } from "@/lib/domain/ppct";

// =====================================================================
// ĐỌC / GHI EXCEL bằng exceljs (đọc được hyperlink, công thức HYPERLINK(),
// ô gộp và màu tô nền). Chỉ chạy ở server.
// =====================================================================

export interface TrangTinh { ten: string; rows: DongExcel[] }
const MAX_DONG = 3000;
const MAX_COT = 30;

function chuCuaO(cell: ExcelJS.Cell): string {
  try {
    const t = cell.text ?? "";
    return String(t).replace(/\s+\n/g, "\n").trim();
  } catch {
    return String(cell.value ?? "").trim();
  }
}

function linkCuaO(cell: ExcelJS.Cell): string | null {
  const v = cell.value as unknown;
  if (cell.hyperlink) return cell.hyperlink;
  if (v && typeof v === "object") {
    const o = v as { hyperlink?: string; formula?: string; richText?: { text: string }[] };
    if (o.hyperlink) return o.hyperlink;
    if (o.formula) {
      const m = /HYPERLINK\(\s*"([^"]+)"/i.exec(o.formula);
      if (m) return m[1];
    }
  }
  return null;
}

/** Mã màu nền của ô (ARGB hoặc "theme:N"), null nếu không tô / tô trắng */
function mauNen(cell: ExcelJS.Cell): string | null {
  const f = cell.fill as ExcelJS.FillPattern | undefined;
  if (!f || f.type !== "pattern" || f.pattern !== "solid") return null;
  const c = f.fgColor as { argb?: string; theme?: number; tint?: number } | undefined;
  if (!c) return null;
  if (c.argb) return /^(FF|00)?FFFFFF$/i.test(c.argb) ? null : c.argb.toUpperCase();
  if (c.theme !== undefined && c.theme !== 0 && c.theme !== 1) return `theme:${c.theme}:${c.tint ?? 0}`;
  return null;
}

function toMau(cell: ExcelJS.Cell): boolean {
  const f = cell.fill as ExcelJS.FillPattern | undefined;
  if (!f || f.type !== "pattern" || f.pattern !== "solid") return false;
  const c = f.fgColor as { argb?: string; theme?: number } | undefined;
  if (!c) return false;
  if (c.argb) return !/^(FF|00)?FFFFFF$/i.test(c.argb);
  return c.theme !== undefined && c.theme !== 0 && c.theme !== 1; // 0/1 thường là nền trắng/chữ đen
}

/** Đọc file .xlsx → các trang tính với dòng thô (chữ, link, tô màu) */
export async function docXlsx(buf: ArrayBuffer): Promise<TrangTinh[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  return wb.worksheets.map((ws) => {
    const rows: DongExcel[] = [];
    const soCot = Math.min(MAX_COT, Math.max(ws.columnCount, 1));
    ws.eachRow({ includeEmpty: true }, (row, r) => {
      if (rows.length >= MAX_DONG) return;
      const o: string[] = [], link: (string | null)[] = [];
      let mau = false;
      const maus = new Set<string>();
      for (let c = 1; c <= soCot; c++) {
        const cell = row.getCell(c);
        const chu = chuCuaO(cell);
        o.push(chu);
        link.push(linkCuaO(cell));
        if (chu && toMau(cell)) { mau = true; const m = mauNen(cell); if (m) maus.add(m); }
      }
      rows.push({ dong: r, o, link, toMau: mau, mau: [...maus] });
    });
    return { ten: ws.name, rows };
  });
}

/** Đọc CSV đơn giản (có dấu ngoặc kép, dấu phẩy hoặc chấm phẩy) */
export function docCsv(text: string): TrangTinh[] {
  const s = text.replace(/^﻿/, "");
  const sep = (s.split("\n")[0].match(/;/g)?.length ?? 0) > (s.split("\n")[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: DongExcel[] = [];
  let cur: string[] = [], o = "", q = false, dong = 1;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) {
      if (ch === '"' && s[i + 1] === '"') { o += '"'; i++; }
      else if (ch === '"') q = false;
      else o += ch;
    } else if (ch === '"') q = true;
    else if (ch === sep) { cur.push(o.trim()); o = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && s[i + 1] === "\n") i++;
      cur.push(o.trim()); rows.push({ dong: dong++, o: cur, link: cur.map(() => null), toMau: false }); cur = []; o = "";
      if (rows.length >= MAX_DONG) break;
    } else o += ch;
  }
  if (o || cur.length) { cur.push(o.trim()); rows.push({ dong, o: cur, link: cur.map(() => null), toMau: false }); }
  return [{ ten: "CSV", rows }];
}

/** Tạo file Excel từ bảng đơn giản; tô đậm dòng tiêu đề, tô màu các dòng được đánh dấu */
export async function taoXlsx(sheets: { ten: string; tieuDe: string[]; dong: (string | number | null)[][]; toMauDong?: number[]; link?: Record<string, string> }[]): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Python LMS";
  for (const s of sheets) {
    const ws = wb.addWorksheet(s.ten.slice(0, 31).replace(/[\\/?*[\]:]/g, "-"));
    ws.addRow(s.tieuDe);
    ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B2A5E" } };
    for (const d of s.dong) ws.addRow(d);
    for (const i of s.toMauDong ?? []) ws.getRow(i + 2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE4CC" } };
    // Ô có link: key "dòng:cột" (0-based theo s.dong)
    for (const [k, url] of Object.entries(s.link ?? {})) {
      const [r, c] = k.split(":").map(Number);
      const cell = ws.getRow(r + 2).getCell(c + 1);
      cell.value = { text: String(cell.value ?? url), hyperlink: url };
      cell.font = { color: { argb: "FF2563EB" }, underline: true };
    }
    ws.columns.forEach((col, i) => {
      const max = Math.max(String(s.tieuDe[i] ?? "").length, ...s.dong.slice(0, 200).map((d) => String(d[i] ?? "").length));
      col.width = Math.min(60, Math.max(8, max + 2));
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
  }
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

export function phanHoiXlsx(buf: ArrayBuffer, tenFile: string) {
  return new Response(buf, {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(tenFile)}`,
      "cache-control": "no-store",
    },
  });
}
