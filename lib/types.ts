// Kiểu dữ liệu dùng chung (khớp tên cột trong supabase/001_schema.sql)

export type VaiTro = "hoc_sinh" | "giao_vien" | "tro_giang" | "quan_tri";

export interface Profile {
  id: string;
  ma_hs: string;
  ho_ten: string;
  vai_tro: VaiTro;
  class_id: string | null;
  must_change_password: boolean;
  dang_hoc: boolean;
  avatar: string;
  deleted_at: string | null;
  email?: string | null;
}

export interface Lop { id: string; ten_lop: string; nam_hoc: string; archived: boolean; deleted_at: string | null }

export interface LoaiBuoi {
  id: string; ten: string; mau: string; icon: string; co_bai_nop_mac_dinh: boolean;
  tinh_diem: boolean; noi_bat: boolean; tu_khoa: string | null; thu_tu: number;
}

export interface ModuleRow { id: string; curriculum_id: string; ten: string; mo_ta: string | null; thu_tu: string }
export interface TopicRow { id: string; module_id: string; ten: string; thu_tu: string }

export interface BuoiHieuLuc {
  class_id: string; lesson_id: string; override_id: string | null; curriculum_id: string;
  module_id: string | null; topic_id: string | null; thu_tu: string; nhan_buoi: string; tieu_de: string;
  tom_tat: string | null; loai_id: string | null; noi_dung_kien_thuc: string | null; rieng_lop: boolean;
  ban_nhap: boolean; ngay_hoc: string | null; hien_thi: boolean; ngay_mo: string | null; da_day: boolean;
  ghi_chu: string | null; da_mo: boolean;
}

export interface BaiTapHieuLuc {
  class_id: string; assignment_id: string; override_id: string | null; lesson_id: string; ma: string;
  tieu_de: string; de_bai: string | null; diem_toi_da: number; loai_nop: "code" | "file" | "ca_hai" | "ngoai_he_thong";
  cho_nop_tre: boolean; khoa_nop: boolean; tinh_diem: boolean; bat_buoc: boolean; he_so: number; hoc_ky: number;
  thu_tu: string; hien_thi: boolean; rieng_lop: boolean; han_nop: string | null;
}

/** Dòng của view v_bai_hoc_sinh */
export interface DongBaiHs {
  student_id: string; ma_hs: string; ho_ten: string; class_id: string; assignment_id: string; lesson_id: string;
  module_id: string | null; lesson_thu_tu: string; ma: string; tieu_de: string; bat_buoc: boolean; he_so: number;
  hoc_ky: number; diem_toi_da: number; tinh_diem: boolean; loai_nop: string; thu_tu: string;
  han_lop: string | null; han_nop_rieng: string | null; mien_nop: boolean;
  submission_id: string | null; trang_thai: "da_nop" | "da_cham" | "can_nop_lai" | "nop_ngoai_he_thong" | null;
  nop_luc_dau: string | null; nop_luc_moi_nhat: string | null; han_nop_lai: string | null;
  diem: number | null; nhan_xet: string | null; so_lan_nop: number | null; cham_luc: string | null;
  chua_lam_duoc: boolean; ghi_chu_co: string | null; danh_dau_luc: string | null;
  da_mo: boolean; ngay_hoc: string | null; da_day: boolean;
}

export interface TaiLieu {
  id: string; lesson_id: string | null; loai: string | null; tieu_de: string; nguon: "file" | "link";
  url: string | null; file_path: string | null; ten_goc: string | null; kich_thuoc: number | null;
  mime: string | null; cho_phep_tai: boolean; hien_thi: boolean; thu_tu: string; tao_luc: string; deleted_at: string | null;
}

/** Kết quả trả về của Server Action */
export interface KQ { ok: boolean; loi?: string; tb?: string; ts?: number; data?: unknown }
export const KQ0: KQ = { ok: false };
