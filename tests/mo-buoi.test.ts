import { describe, it, expect } from "vitest";
import { tienDoLop, nhomTienDo, type BuoiMo } from "@/lib/domain/mo-buoi";

const b = (n: string, daDay: boolean, mo = false, ngay: string | null = null): BuoiMo =>
  ({ lesson_id: n, nhan_buoi: `Buổi ${n}`, tieu_de: `B${n}`, ngay_hoc: ngay, hien_thi: mo, da_mo: mo, ban_nhap: false, da_day: daDay });

describe("tienDoLop (theo nút Xong buổi, không theo ngày)", () => {
  it("đang học = buổi đầu tiên chưa xong; ngày học đã qua KHÔNG làm buổi thành đã học", () => {
    const r = tienDoLop([b("1", true, true, "2026-10-01"), b("2", false, true, "2026-10-05"), b("3", false, false, "2026-10-08")]);
    expect(r.dangHoc?.lesson_id).toBe("2");
    expect(r.tiepTheo?.lesson_id).toBe("3");
    expect(r.buoiTruoc?.lesson_id).toBe("1");
    expect(r.viTri).toBe(2);
    expect(r.soDaHoc).toBe(1);
    expect(r.tong).toBe(3);
  });
  it("lớp mới (chưa học, chưa mở buổi nào) → chuaBatDau", () => {
    const r = tienDoLop([b("1", false), b("2", false)]);
    expect(r.chuaBatDau).toBe(true);
    expect(r.dangHoc?.lesson_id).toBe("1");
  });
  it("học hết → dangHoc null, viTri = tổng", () => {
    const r = tienDoLop([b("1", true, true), b("2", true, false)]);
    expect(r.dangHoc).toBeNull();
    expect(r.viTri).toBe(2);
    expect(r.soDaMo).toBe(1);
  });
  it("bỏ buổi bản nháp", () => {
    const r = tienDoLop([{ ...b("1", false), ban_nhap: true }, b("2", false), b("3", false)]);
    expect(r.dangHoc?.lesson_id).toBe("2");
    expect(r.tong).toBe(2);
  });
});

describe("nhomTienDo", () => {
  it("chia 3 nhóm", () => {
    const g = nhomTienDo([b("1", true), b("2", true), b("3", false), b("4", false)]);
    expect(g.daHoc.length).toBe(2);
    expect(g.dangHoc?.lesson_id).toBe("3");
    expect(g.chuaHoc.map((x) => x.lesson_id)).toEqual(["4"]);
  });
});
