import "server-only";
import { createClient } from "@/lib/supabase/server";
import { dongBaiLop, dongBaiTatCa, buoiLop, cacLoaiBuoi, toDongBai, type DongDayDu } from "./data";
import { tinhTrangThai } from "@/lib/domain/status";
import { boHaiBaiLienTiep } from "@/lib/domain/stats";
import type { DongBaiHs, Lop } from "@/lib/types";

type SB = Awaited<ReturnType<typeof createClient>>;

/** Học sinh đang học của một lớp */
export async function hocSinhLop(sb: SB, classId: string) {
  const { data } = await sb.from("profiles").select("id, ma_hs, ho_ten, avatar, dang_hoc, must_change_password")
    .eq("class_id", classId).eq("vai_tro", "hoc_sinh").is("deleted_at", null).order("ma_hs");
  return (data as { id: string; ma_hs: string; ho_ten: string; avatar: string; dang_hoc: boolean; must_change_password: boolean }[]) ?? [];
}

/** Dữ liệu một lớp cho ma trận / tình hình nộp / báo cáo */
export async function duLieuLop(sb: SB, classId: string) {
  const [rows, buoi, loai, hs] = await Promise.all([dongBaiLop(sb, classId), buoiLop(sb, classId), cacLoaiBuoi(sb), hocSinhLop(sb, classId)]);
  return { rows: rows.map(toDongBai), buoi, loai: new Map(loai.map((l) => [l.id, l])), hs };
}

/** "Đang ở buổi N / tổng" của lớp */
/** "Đang ở buổi x/y": buổi đã dạy = thầy đánh dấu HOẶC ngày học đã qua (không cần tích tay) */
/** Tiến độ lớp "Đã học x/y buổi" (đếm theo dòng), theo nút "Xong buổi" — không theo ngày */
export function dangOBuoi(buoi: { da_day: boolean; ban_nhap?: boolean }[]) {
  const ds = buoi.filter((b) => !b.ban_nhap);
  return { daHoc: ds.filter((b) => b.da_day).length, tong: ds.length };
}

/** Tóm tắt hôm nay + số liệu từng lớp (trang Tổng quan) */
export async function tongQuan(sb: SB, lops: Lop[]) {
  const now = new Date();
  const all: DongDayDu[] = (await dongBaiTatCa(sb)).map(toDongBai);
  const theoLop = new Map<string, DongDayDu[]>();
  for (const r of all) theoLop.set(r.class_id, [...(theoLop.get(r.class_id) ?? []), r]);

  const tomTat = { choCham: 0, chuaNop: new Set<string>(), canNhac: new Set<string>(), chuaLamDuoc: 0, canhBaoSom: [] as { ho_ten: string; ma_hs: string; lop: string }[] };
  const theThe: Record<string, { siSo: number; chuaNop: number; choCham: number }> = {};
  for (const l of lops) {
    const rows = theoLop.get(l.id) ?? [];
    const hsChuaNop = new Set<string>();
    let choCham = 0;
    const theoHs = new Map<string, DongDayDu[]>();
    for (const r of rows) {
      theoHs.set(r.student_id, [...(theoHs.get(r.student_id) ?? []), r]);
      if (!r.da_mo) continue;
      const k = tinhTrangThai(r, now);
      if (k.trangThai === "da_nop") { choCham++; tomTat.choCham++; }
      if (k.nhanThoiGian === "khong_nop_bai") { hsChuaNop.add(r.student_id); tomTat.chuaNop.add(r.student_id); }
      if (k.canNhac) tomTat.canNhac.add(r.student_id);
      if (k.coChuaLamDuoc) tomTat.chuaLamDuoc++;
    }
    for (const [, ds] of theoHs) if (boHaiBaiLienTiep(ds.filter((r) => r.da_mo), now)) tomTat.canhBaoSom.push({ ho_ten: ds[0].ho_ten, ma_hs: ds[0].ma_hs, lop: l.ten_lop });
    theThe[l.id] = { siSo: theoHs.size, chuaNop: hsChuaNop.size, choCham };
  }
  return { tomTat, theThe };
}

export type { DongBaiHs };
