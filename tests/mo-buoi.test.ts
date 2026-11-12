import { describe, expect, it } from "vitest";
import { chonBuoiMo, type BuoiMo } from "@/lib/domain/mo-buoi";

const b = (id: string, ngay: string | null, mo: boolean): BuoiMo => ({ lesson_id: id, nhan_buoi: id, tieu_de: "T" + id, ngay_hoc: ngay, hien_thi: mo, da_mo: mo, ban_nhap: false });
const now = new Date("2026-11-12T03:00:00Z"); // 10:00 giờ VN

describe("chonBuoiMo", () => {
  it("ưu tiên buổi có ngày học hôm nay", () => {
    const r = chonBuoiMo([b("1", "2026-11-05", true), b("2", "2026-11-12", false), b("3", "2026-11-19", false)], now);
    expect(r.homNay?.lesson_id).toBe("2");
    expect(r.coLichHomNay).toBe(true);
    expect(r.tiepTheo?.lesson_id).toBe("3");
  });
  it("không có lịch hôm nay → buổi đang học (đã mở) + buổi chưa mở đầu tiên", () => {
    const r = chonBuoiMo([b("1", null, true), b("2", null, false), b("3", null, false)], now);
    expect(r.homNay?.lesson_id).toBe("1");
    expect(r.coLichHomNay).toBe(false);
    expect(r.tiepTheo?.lesson_id).toBe("2");
  });
  it("buổi mở lẻ ở cuối không làm lệch: lấy theo buổi chưa mở đầu tiên", () => {
    const r = chonBuoiMo([b("1", null, true), b("9", null, true), b("10", null, false), b("26", null, true)], now);
    expect(r.homNay?.lesson_id).toBe("9");
    expect(r.tiepTheo?.lesson_id).toBe("10");
  });
  it("chưa mở buổi nào → buổi 1 và buổi 2", () => {
    const r = chonBuoiMo([b("1", null, false), b("2", null, false)], now);
    expect(r.homNay?.lesson_id).toBe("1");
    expect(r.tiepTheo?.lesson_id).toBe("2");
  });
  it("đã mở hết → không còn buổi để mở", () => {
    const r = chonBuoiMo([b("1", null, true)], now);
    expect(r.homNay).toBeNull();
    expect(r.soDaMo).toBe(1);
  });
  it("bỏ qua buổi nháp", () => {
    const r = chonBuoiMo([{ ...b("1", null, false), ban_nhap: true }, b("2", null, false), b("3", null, false)], now);
    expect(r.homNay?.lesson_id).toBe("2");
    expect(r.tiepTheo?.lesson_id).toBe("3");
  });
});
