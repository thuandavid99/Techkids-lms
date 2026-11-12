-- =====================================================================
-- 006_mo_buoi_nhieu_bai.sql — CHẠY SAU 005 (Supabase → SQL Editor → dán → Run)
-- An toàn khi chạy lại nhiều lần.
--  1) Mở buổi bằng nút gạt: chế độ "Thầy tự mở" / "Tự mở theo lịch" cho từng lớp
--     + học sinh thấy trước 1–2 buổi sắp tới (mờ, có ổ khóa, không xem được nội dung)
--  2) Bài tập nhiều bài nhỏ (tab Bài 1, Bài 2…) + thầy chấm ✓/✗ từng bài
-- =====================================================================

-- ---------- 1. MỞ BUỔI ----------
alter table public.classes add column if not exists che_do_mo text not null default 'thu_cong';
do $$ begin
  alter table public.classes add constraint classes_che_do_mo_chk check (che_do_mo in ('thu_cong', 'theo_lich'));
exception when duplicate_object then null; end $$;

-- Buổi mới gắn vào lớp mặc định KHÓA (thầy gạt mở). Buổi đã có giữ nguyên như cũ.
alter table public.class_lessons alter column hien_thi set default false;

-- Lớp "Tự mở theo lịch": buổi đến ngày học thì tự mở (gọi khi học sinh / thầy mở web — không cần tác vụ định kỳ)
create or replace function public.mo_buoi_theo_lich(p_class uuid)
returns int language plpgsql security definer set search_path = public as $$
declare n int := 0;
begin
  if p_class is null then return 0; end if;
  if not (public.is_admin() or public.teaches_class(p_class) or public.my_class_id() = p_class) then return 0; end if;
  update class_lessons cl set hien_thi = true
    from classes c
   where c.id = p_class and c.che_do_mo = 'theo_lich'
     and cl.class_id = p_class and not cl.hien_thi and cl.deleted_at is null
     and cl.ngay_hoc is not null and cl.ngay_hoc <= (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.mo_buoi_theo_lich(uuid) from public, anon;
grant execute on function public.mo_buoi_theo_lich(uuid) to authenticated;

-- Thầy (của lớp) / quản trị đổi chế độ mở buổi
create or replace function public.gv_dat_che_do_mo(p_class uuid, p_che_do text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_admin() or public.teaches_class(p_class)) then
    return jsonb_build_object('ok', false, 'loi', 'Bạn không phụ trách lớp này.');
  end if;
  if p_che_do not in ('thu_cong', 'theo_lich') then
    return jsonb_build_object('ok', false, 'loi', 'Chế độ không hợp lệ.');
  end if;
  update classes set che_do_mo = p_che_do where id = p_class;
  perform public.mo_buoi_theo_lich(p_class);
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.gv_dat_che_do_mo(uuid, text) from public, anon;
grant execute on function public.gv_dat_che_do_mo(uuid, text) to authenticated;

-- Học sinh: 1–3 buổi SẮP TỚI chưa mở — chỉ tên + ngày học (không lộ nội dung)
create or replace function public.hs_buoi_sap_mo(p_so int default 2)
returns table(lesson_id uuid, nhan_buoi text, tieu_de text, ngay_hoc date)
language sql stable security definer set search_path = public as $$
  select b.lesson_id, b.nhan_buoi, b.tieu_de, b.ngay_hoc
    from v_buoi_hieu_luc b
    left join modules m on m.id = b.module_id
   where b.class_id = public.my_class_id() and not b.da_mo and not b.ban_nhap
   order by m.thu_tu nulls last, b.thu_tu
   limit least(greatest(coalesce(p_so, 2), 1), 3);
$$;
revoke all on function public.hs_buoi_sap_mo(int) from public, anon;
grant execute on function public.hs_buoi_sap_mo(int) to authenticated;

-- Thông báo tự động của học sinh: chạy thêm bước tự mở buổi theo lịch (giữ nguyên phần còn lại của 004)
create or replace function public.hs_tao_thong_bao_tu_dong()
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_class uuid;
begin
  select class_id into v_class from profiles where id = v_uid and vai_tro = 'hoc_sinh';
  if v_class is null then return; end if;

  perform public.mo_buoi_theo_lich(v_class);

  insert into notifications(user_id, loai, noi_dung, lien_ket, khoa_gop)
  select v_uid, 'bai_moi',
         'Có bài tập mới: Bài tập ' || b.ma || ': ' || b.tieu_de,
         '/bai-tap/' || b.assignment_id || '/lam-bai', 'moi:' || b.assignment_id
    from v_bai_tap_hieu_luc b
    join class_lessons cl on cl.class_id = b.class_id and cl.lesson_id = b.lesson_id
   where b.class_id = v_class and public.bai_tap_mo_cho_lop(b.assignment_id, v_class)
     and b.loai_nop <> 'ngoai_he_thong'
     and greatest(coalesce(cl.ngay_mo, '-infinity'), coalesce(cl.ngay_hoc::timestamptz, '-infinity')) >= now() - interval '7 days'
  on conflict (user_id, khoa_gop) where khoa_gop is not null do nothing;

  insert into notifications(user_id, loai, noi_dung, lien_ket, khoa_gop)
  select v_uid, 'sap_han',
         'Nhắc nhở: Hạn nộp Bài tập ' || b.ma || ' là ' || to_char(coalesce(o.han_nop_rieng, b.han_nop) at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI DD/MM'),
         '/bai-tap/' || b.assignment_id || '/lam-bai', 'han:' || b.assignment_id
    from v_bai_tap_hieu_luc b
    left join student_overrides o on o.assignment_id = b.assignment_id and o.student_id = v_uid
   where b.class_id = v_class and public.bai_tap_mo_cho_lop(b.assignment_id, v_class)
     and b.loai_nop <> 'ngoai_he_thong'
     and coalesce(o.mien_nop, false) = false
     and coalesce(o.han_nop_rieng, b.han_nop) between now() and now() + interval '24 hours'
     and not exists (select 1 from submissions s where s.assignment_id = b.assignment_id and s.student_id = v_uid)
  on conflict (user_id, khoa_gop) where khoa_gop is not null do nothing;
end $$;

-- ---------- 2. BÀI TẬP NHIỀU BÀI NHỎ ----------
-- so_bai = số tab (Bài 1..N) trong một bài tập. 1 = bài thường như trước.
alter table public.assignments add column if not exists so_bai int not null default 1;
do $$ begin
  alter table public.assignments add constraint assignments_so_bai_chk check (so_bai between 1 and 50);
exception when duplicate_object then null; end $$;

-- Kết quả chấm từng tab: mảng JSON, ví dụ ["d","s",null,…] (d = đúng, s = sai, null = chưa chấm)
alter table public.submissions add column if not exists cham_tabs jsonb;

-- Ghi chú: nội dung nhiều tab / link được lưu trong cột code_text dạng JSON {"lms":1,"tabs":[…],"link":…}
-- (bài một tab vẫn lưu code thuần như cũ) — đọc/ghi ở lib/domain/bai-nop.ts.

-- ---------- 3. GIỮ DỰ ÁN "THỨC" (gói Supabase miễn phí tạm dừng nếu ~1 tuần ít hoạt động) ----------
-- GitHub Actions gọi /api/song mỗi ngày → web gọi hàm này → có truy vấn thật vào database.
create or replace function public.song()
returns timestamptz language sql stable as $$ select now() $$;
grant execute on function public.song() to anon, authenticated;
