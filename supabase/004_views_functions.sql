-- =====================================================================
-- 004_views_functions.sql — VIEW "HIỆU LỰC", HÀM NỘP/CHẤM, TRIGGER THÔNG BÁO,
-- DỮ LIỆU DANH MỤC MẶC ĐỊNH.
-- Chạy SAU 003. An toàn khi chạy lại.
--
-- Cách tính trạng thái: view chỉ trả DỮ LIỆU THÔ (hạn, giờ nộp, miễn nộp...).
-- Nhãn Đúng hạn / Trễ / Không nộp bài, % hoàn thành, điểm TB, danh sách nhắc
-- phụ huynh được tính trong lib/domain/*.ts (có kiểm thử vitest) — một nguồn duy nhất.
-- "Quá hạn" được suy ra lúc truy vấn từ giờ hiện tại → KHÔNG cần tác vụ cron.
-- =====================================================================

drop view if exists public.v_bai_hoc_sinh cascade;
drop view if exists public.v_bai_tap_hieu_luc cascade;
drop view if exists public.v_buoi_hieu_luc cascade;

-- ---------- BUỔI HỌC HIỆU LỰC THEO LỚP ----------
-- Mỗi (lớp, buổi gốc): nếu lớp có bản ghi đè (ghi_de_cua) thì lấy nội dung bản ghi đè,
-- ngược lại lấy buổi gốc. Vị trí (module, thứ tự) luôn theo buổi gốc.
create view public.v_buoi_hieu_luc with (security_invoker = true) as
select
  cc.class_id,
  l.id                      as lesson_id,      -- luôn là id buổi GỐC
  o.id                      as override_id,    -- id bản ghi đè (nếu có)
  l.curriculum_id, l.module_id, l.topic_id, l.thu_tu,
  coalesce(o.nhan_buoi, l.nhan_buoi)   as nhan_buoi,
  coalesce(o.tieu_de, l.tieu_de)       as tieu_de,
  case when o.id is not null then o.tom_tat else l.tom_tat end as tom_tat,
  coalesce(o.loai_id, l.loai_id)       as loai_id,
  case when o.id is not null then o.noi_dung_kien_thuc else l.noi_dung_kien_thuc end as noi_dung_kien_thuc,
  (l.class_id is not null)  as rieng_lop,
  l.ban_nhap,
  cl.ngay_hoc, coalesce(cl.hien_thi, false) as hien_thi, cl.ngay_mo, coalesce(cl.da_day, false) as da_day, cl.ghi_chu,
  (coalesce(cl.hien_thi,false) and cl.deleted_at is null and (cl.ngay_mo is null or cl.ngay_mo <= now()) and not l.ban_nhap) as da_mo
from public.class_curriculum cc
join public.lessons l
  on l.curriculum_id = cc.curriculum_id and l.ghi_de_cua is null and l.deleted_at is null
 and (l.class_id is null or l.class_id = cc.class_id)
left join public.lessons o
  on o.ghi_de_cua = l.id and o.class_id = cc.class_id and o.deleted_at is null
left join public.class_lessons cl
  on cl.class_id = cc.class_id and cl.lesson_id = l.id;

-- ---------- BÀI TẬP HIỆU LỰC THEO LỚP ----------
create view public.v_bai_tap_hieu_luc with (security_invoker = true) as
select
  cc.class_id,
  a.id            as assignment_id,   -- luôn là id bài tập GỐC (bài nộp gắn vào id này)
  ao.id           as override_id,
  a.lesson_id,
  coalesce(ao.ma, a.ma)                 as ma,
  coalesce(ao.tieu_de, a.tieu_de)       as tieu_de,
  case when ao.id is not null then ao.de_bai else a.de_bai end as de_bai,
  coalesce(ao.diem_toi_da, a.diem_toi_da) as diem_toi_da,
  coalesce(ao.loai_nop, a.loai_nop)     as loai_nop,
  coalesce(ao.cho_nop_tre, a.cho_nop_tre) as cho_nop_tre,
  coalesce(ao.khoa_nop, a.khoa_nop)     as khoa_nop,
  coalesce(ao.tinh_diem, a.tinh_diem)   as tinh_diem,
  coalesce(ao.bat_buoc, a.bat_buoc)     as bat_buoc,
  coalesce(ao.he_so, a.he_so)           as he_so,
  coalesce(ao.hoc_ky, a.hoc_ky)         as hoc_ky,
  a.thu_tu,
  (a.hien_thi and coalesce(ao.hien_thi, true)) as hien_thi,
  (a.class_id is not null)              as rieng_lop,
  d.han_nop
from public.class_curriculum cc
join public.lessons l
  on l.curriculum_id = cc.curriculum_id and l.ghi_de_cua is null and l.deleted_at is null
 and (l.class_id is null or l.class_id = cc.class_id)
join public.assignments a
  on a.lesson_id = l.id and a.ghi_de_cua is null and a.deleted_at is null
 and (a.class_id is null or a.class_id = cc.class_id)
left join public.assignments ao
  on ao.ghi_de_cua = a.id and ao.class_id = cc.class_id and ao.deleted_at is null
left join public.assignment_deadlines d
  on d.assignment_id = a.id and d.class_id = cc.class_id;

-- ---------- HỌC SINH × BÀI TẬP (dữ liệu thô để tính trạng thái) ----------
-- Học sinh truy vấn view này chỉ thấy dòng của chính mình (RLS của profiles).
create view public.v_bai_hoc_sinh with (security_invoker = true) as
select
  p.id as student_id, p.ma_hs, p.ho_ten,
  b.class_id, b.assignment_id, b.lesson_id, l.module_id, l.thu_tu as lesson_thu_tu, b.ma, b.tieu_de,
  b.bat_buoc, b.he_so, b.hoc_ky, b.diem_toi_da, b.tinh_diem, b.loai_nop, b.thu_tu,
  b.han_nop                           as han_lop,
  ov.han_nop_rieng,
  coalesce(ov.mien_nop, false)        as mien_nop,
  s.id as submission_id, s.trang_thai, s.nop_luc_dau, s.nop_luc_moi_nhat, s.han_nop_lai,
  s.diem, s.nhan_xet, s.so_lan_nop, s.cham_luc,
  coalesce(f.chua_lam_duoc and not f.da_ho_tro, false) as chua_lam_duoc,
  f.ghi_chu as ghi_chu_co, f.danh_dau_luc,
  (b.hien_thi and coalesce(cl.hien_thi,false) and cl.deleted_at is null
     and (cl.ngay_mo is null or cl.ngay_mo <= now()) and not l.ban_nhap) as da_mo,
  cl.ngay_hoc, coalesce(cl.da_day,false) as da_day
from public.v_bai_tap_hieu_luc b
join public.profiles p
  on p.class_id = b.class_id and p.vai_tro = 'hoc_sinh' and p.deleted_at is null and p.dang_hoc
join public.lessons l on l.id = b.lesson_id
left join public.class_lessons cl on cl.class_id = b.class_id and cl.lesson_id = b.lesson_id
left join public.student_overrides ov on ov.assignment_id = b.assignment_id and ov.student_id = p.id
left join public.submissions s on s.assignment_id = b.assignment_id and s.student_id = p.id
left join public.student_flags f on f.assignment_id = b.assignment_id and f.student_id = p.id;

-- =====================================================================
-- NỘP BÀI — chỉ server (service_role) được gọi. Giờ nộp = now() của DATABASE.
-- =====================================================================
create or replace function public.hs_nop_bai(
  p_student uuid, p_assignment uuid,
  p_code text, p_file_path text, p_ten_goc text, p_kich_thuoc bigint, p_mime text,
  p_nguoi_nop text default 'hs'
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_class uuid; a record; v_han timestamptz; s record; v_now timestamptz := now();
  v_old_path text; v_tre boolean; v_co boolean;
begin
  select class_id into v_class from profiles
   where id = p_student and vai_tro = 'hoc_sinh' and deleted_at is null;
  if v_class is null then
    return jsonb_build_object('ok', false, 'loi', 'Không tìm thấy học sinh hoặc học sinh chưa được xếp lớp.');
  end if;

  select * into a from v_bai_tap_hieu_luc where assignment_id = p_assignment and class_id = v_class;
  if not found then
    return jsonb_build_object('ok', false, 'loi', 'Không tìm thấy bài tập này trong lớp của em.');
  end if;

  if p_nguoi_nop = 'hs' then
    if not public.bai_tap_mo_cho_lop(p_assignment, v_class) then
      return jsonb_build_object('ok', false, 'loi', 'Bài tập này chưa mở.');
    end if;
    if a.loai_nop = 'ngoai_he_thong' then
      return jsonb_build_object('ok', false, 'loi', 'Bài này nộp ngoài hệ thống (thầy sẽ nhập điểm).');
    end if;
    if a.khoa_nop then
      return jsonb_build_object('ok', false, 'loi', 'Thầy đang khóa nộp bài này.');
    end if;
  end if;

  select coalesce(o.han_nop_rieng, a.han_nop) into v_han
    from (select 1) x left join student_overrides o
      on o.assignment_id = p_assignment and o.student_id = p_student;

  select * into s from submissions
   where assignment_id = p_assignment and student_id = p_student for update;
  v_co := found;   -- đã có bài nộp trước đó chưa

  if v_co and s.trang_thai = 'da_cham' and p_nguoi_nop = 'hs' then
    return jsonb_build_object('ok', false, 'loi', 'Bài đã được chấm nên đã khóa. Nếu cần sửa, em nhờ thầy bấm "Mở cho nộp lại".');
  end if;

  if p_nguoi_nop = 'hs' and v_han is not null and v_now > v_han and not a.cho_nop_tre
     and not (v_co and s.trang_thai = 'can_nop_lai') then
    return jsonb_build_object('ok', false, 'loi', 'Đã quá hạn nộp và bài này không nhận bài trễ.');
  end if;

  v_tre := (v_han is not null and v_now > v_han);

  if not v_co then
    insert into submissions(assignment_id, student_id, so_lan_nop, file_path, ten_goc, kich_thuoc, mime,
                            code_text, nop_luc_dau, nop_luc_moi_nhat, nguoi_nop, trang_thai, nop_tre)
    values (p_assignment, p_student, 1, p_file_path, p_ten_goc, p_kich_thuoc, p_mime,
            p_code, v_now, v_now, p_nguoi_nop, 'da_nop', v_tre)
    returning * into s;
    v_old_path := null;
  else
    v_old_path := s.file_path;
    update submissions set
      so_lan_nop = s.so_lan_nop + 1,
      file_path = p_file_path, ten_goc = p_ten_goc, kich_thuoc = p_kich_thuoc, mime = p_mime,
      code_text = p_code,
      nop_luc_dau = coalesce(s.nop_luc_dau, v_now),   -- giữ giờ nộp LẦN ĐẦU
      nop_tre = coalesce(s.nop_tre, v_tre),
      nop_luc_moi_nhat = v_now,
      nguoi_nop = p_nguoi_nop,
      trang_thai = 'da_nop',                         -- nộp lại → về "chờ chấm"
      han_nop_lai = null
    where id = s.id
    returning * into s;
  end if;

  return jsonb_build_object(
    'ok', true, 'submission_id', s.id, 'nop_luc', s.nop_luc_moi_nhat,
    'so_lan', s.so_lan_nop,
    'file_cu', case when v_old_path is distinct from p_file_path then v_old_path else null end);
end $$;

revoke all on function public.hs_nop_bai(uuid,uuid,text,text,text,bigint,text,text) from public, anon, authenticated;
grant execute on function public.hs_nop_bai(uuid,uuid,text,text,text,bigint,text,text) to service_role;

-- =====================================================================
-- CHẤM BÀI — có chống "học sinh vừa nộp bản mới hơn" (mục 5.7) + ghi nhật ký sửa điểm
-- p_hanh_dong: 'cham' | 'can_nop_lai' | 'mo_nop_lai'
-- p_moc: giờ nop_luc_moi_nhat lúc thầy MỞ bài để chấm
-- =====================================================================
create or replace function public.gv_luu_diem(
  p_submission uuid, p_diem numeric, p_nhan_xet text, p_hanh_dong text,
  p_moc timestamptz, p_ep boolean default false, p_han_nop_lai timestamptz default null
) returns jsonb
language plpgsql security invoker set search_path = public as $$
declare s record; v_max numeric;
begin
  if not public.is_teacher() then
    return jsonb_build_object('ok', false, 'loi', 'Bạn không có quyền chấm bài.');
  end if;
  select * into s from submissions where id = p_submission for update;
  if not found then return jsonb_build_object('ok', false, 'loi', 'Không tìm thấy bài nộp.'); end if;

  if p_moc is not null and s.nop_luc_moi_nhat is not null and s.nop_luc_moi_nhat > p_moc and not p_ep then
    return jsonb_build_object('ok', false, 'xung_dot', true, 'nop_luc_moi_nhat', s.nop_luc_moi_nhat);
  end if;

  select diem_toi_da into v_max from assignments where id = s.assignment_id;
  if p_diem is not null and (p_diem < 0 or p_diem > v_max) then
    return jsonb_build_object('ok', false, 'loi', format('Điểm phải từ 0 đến %s.', v_max));
  end if;

  if p_hanh_dong = 'cham' then
    if p_diem is null then return jsonb_build_object('ok', false, 'loi', 'Thầy chưa nhập điểm.'); end if;
    update submissions set diem = p_diem, nhan_xet = p_nhan_xet, trang_thai = 'da_cham',
           cham_luc = now(), han_nop_lai = null where id = s.id;
    -- Bài đã chấm → tắt cờ "Em chưa làm được"
    update student_flags set chua_lam_duoc = false
     where assignment_id = s.assignment_id and student_id = s.student_id;
  elsif p_hanh_dong in ('can_nop_lai','mo_nop_lai') then
    update submissions set nhan_xet = coalesce(p_nhan_xet, nhan_xet),
           diem = coalesce(p_diem, diem), trang_thai = 'can_nop_lai',
           han_nop_lai = coalesce(p_han_nop_lai, now() + interval '7 days') where id = s.id;
  else
    return jsonb_build_object('ok', false, 'loi', 'Thao tác không hợp lệ.');
  end if;

  if s.diem is not null and p_diem is not null and s.diem <> p_diem then
    insert into audit_log(user_id, hanh_dong, doi_tuong, doi_tuong_id, truoc, sau)
    values (auth.uid(), 'sua_diem', 'submissions', s.id::text,
            jsonb_build_object('diem', s.diem), jsonb_build_object('diem', p_diem));
  end if;
  if p_hanh_dong <> 'cham' then
    insert into audit_log(user_id, hanh_dong, doi_tuong, doi_tuong_id, truoc, sau)
    values (auth.uid(), p_hanh_dong, 'submissions', s.id::text,
            jsonb_build_object('trang_thai', s.trang_thai),
            jsonb_build_object('trang_thai', 'can_nop_lai', 'han_nop_lai', coalesce(p_han_nop_lai, now() + interval '7 days')));
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- =====================================================================
-- HÀM CHO HỌC SINH
-- =====================================================================
-- Danh sách bạn cùng lớp: CHỈ họ tên
create or replace function public.ds_ban_cung_lop()
returns table(ho_ten text) language sql stable security definer set search_path = public as $$
  select ho_ten from profiles
   where class_id = public.my_class_id() and vai_tro = 'hoc_sinh'
     and deleted_at is null and dang_hoc
   order by ho_ten;
$$;

-- Tên giáo viên phụ trách lớp mình
create or replace function public.gv_cua_lop()
returns table(ho_ten text) language sql stable security definer set search_path = public as $$
  select p.ho_ten from profiles p
   where p.vai_tro = 'giao_vien' and p.deleted_at is null
     and (exists (select 1 from class_teachers ct where ct.teacher_id = p.id and ct.class_id = public.my_class_id())
          or not exists (select 1 from class_teachers ct where ct.class_id = public.my_class_id()))
   order by p.ho_ten;
$$;

-- Đổi ảnh đại diện (chọn trong bộ avatar mẫu)
create or replace function public.hs_doi_avatar(p_avatar text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_avatar !~ '^[a-z0-9-]{1,30}$' then raise exception 'Ảnh đại diện không hợp lệ'; end if;
  update profiles set avatar = p_avatar where id = auth.uid();
end $$;

-- Sinh thông báo tự động cho học sinh đang đăng nhập (gọi khi mở web; không cần cron):
--   * Bài tập mới mở trong 7 ngày gần đây
--   * Bài sắp đến hạn trong 24 giờ mà chưa nộp
create or replace function public.hs_tao_thong_bao_tu_dong()
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_class uuid;
begin
  select class_id into v_class from profiles where id = v_uid and vai_tro = 'hoc_sinh';
  if v_class is null then return; end if;

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

-- =====================================================================
-- TRIGGER
-- =====================================================================
-- Buổi mới thêm vào chương trình → tự tạo dòng tình trạng cho các lớp đang dùng chương trình
create or replace function public.tg_lesson_class_rows()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.ghi_de_cua is null then
    insert into class_lessons(class_id, lesson_id)
    select cc.class_id, new.id from class_curriculum cc
     where cc.curriculum_id = new.curriculum_id and (new.class_id is null or cc.class_id = new.class_id)
    on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists lesson_class_rows on public.lessons;
create trigger lesson_class_rows after insert on public.lessons
  for each row execute function public.tg_lesson_class_rows();

-- Thầy chấm / yêu cầu nộp lại → thông báo cho học sinh
create or replace function public.tg_submission_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare a record;
begin
  select ma, tieu_de, diem_toi_da into a from assignments where id = new.assignment_id;
  if new.trang_thai = 'da_cham' and (old.trang_thai is distinct from 'da_cham' or old.diem is distinct from new.diem) then
    insert into notifications(user_id, loai, noi_dung, lien_ket, khoa_gop)
    values (new.student_id, 'da_cham',
            'Thầy đã chấm Bài tập ' || a.ma || ': ' || trim(to_char(new.diem, 'FM990.0')) || '/' || trim(to_char(a.diem_toi_da, 'FM990')),
            '/bai-tap/' || new.assignment_id || '/da-nop', 'cham:' || new.id)
    on conflict (user_id, khoa_gop) where khoa_gop is not null
    do update set noi_dung = excluded.noi_dung, loai = excluded.loai, da_doc = false, tao_luc = now();
  elsif new.trang_thai = 'can_nop_lai' and old.trang_thai is distinct from 'can_nop_lai' then
    insert into notifications(user_id, loai, noi_dung, lien_ket, khoa_gop)
    values (new.student_id, 'can_nop_lai',
            'Thầy yêu cầu nộp lại Bài tập ' || a.ma || ' (hạn ' ||
              to_char(new.han_nop_lai at time zone 'Asia/Ho_Chi_Minh', 'DD/MM') || ')',
            '/bai-tap/' || new.assignment_id || '/lam-bai', 'cham:' || new.id)
    on conflict (user_id, khoa_gop) where khoa_gop is not null
    do update set noi_dung = excluded.noi_dung, loai = excluded.loai, da_doc = false, tao_luc = now();
  end if;
  return new;
end $$;
drop trigger if exists submission_notify on public.submissions;
create trigger submission_notify after update on public.submissions
  for each row execute function public.tg_submission_notify();

-- Thầy đăng thông báo lớp → thông báo cho từng học sinh lớp đó
create or replace function public.tg_announcement_notify()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into notifications(user_id, loai, noi_dung, lien_ket)
  select p.id, 'lop', left(new.noi_dung, 200), '/thong-bao'
    from profiles p
   where p.class_id = new.class_id and p.vai_tro = 'hoc_sinh' and p.deleted_at is null;
  return new;
end $$;
drop trigger if exists announcement_notify on public.announcements;
create trigger announcement_notify after insert on public.announcements
  for each row execute function public.tg_announcement_notify();

-- Học sinh tích "Em chưa làm được" → thông báo cho giáo viên (gộp theo em + buổi)
create or replace function public.tg_flag_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare p record; a record;
begin
  if new.chua_lam_duoc and not new.da_ho_tro
     and (tg_op = 'INSERT' or not old.chua_lam_duoc or old.da_ho_tro) then
    select ho_ten, ma_hs into p from profiles where id = new.student_id;
    select ma, lesson_id into a from assignments where id = new.assignment_id;
    insert into notifications(user_id, loai, noi_dung, lien_ket, khoa_gop)
    select t.id, 'chua_lam_duoc',
           '🙋 ' || p.ho_ten || ' (' || p.ma_hs || ') báo chưa làm được Bài tập ' || a.ma,
           '/gv/bai-tap/hang-doi?tab=can-ho-tro', 'flag:' || new.student_id || ':' || a.lesson_id
      from profiles t where t.vai_tro = 'giao_vien' and t.deleted_at is null
    on conflict (user_id, khoa_gop) where khoa_gop is not null
    do update set noi_dung = excluded.noi_dung, da_doc = false, tao_luc = now();
  end if;
  return new;
end $$;
drop trigger if exists flag_notify on public.student_flags;
create trigger flag_notify after insert or update on public.student_flags
  for each row execute function public.tg_flag_notify();

-- Học sinh gửi yêu cầu quên mật khẩu → chấm đỏ ở chuông của thầy
create or replace function public.tg_pwreq_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare p record;
begin
  select ho_ten, ma_hs into p from profiles where id = new.student_id;
  insert into notifications(user_id, loai, noi_dung, lien_ket, khoa_gop)
  select t.id, 'reset_mk', p.ho_ten || ' (' || p.ma_hs || ') xin cấp lại mật khẩu',
         '/gv/hoc-sinh/yeu-cau-mat-khau', 'reset:' || new.student_id
    from profiles t where t.vai_tro = 'giao_vien' and t.deleted_at is null
  on conflict (user_id, khoa_gop) where khoa_gop is not null
  do update set noi_dung = excluded.noi_dung, da_doc = false, tao_luc = now();
  return new;
end $$;
drop trigger if exists pwreq_notify on public.password_requests;
create trigger pwreq_notify after insert on public.password_requests
  for each row execute function public.tg_pwreq_notify();

-- =====================================================================
-- THÙNG RÁC: xóa vĩnh viễn mục đã xóa quá 30 ngày (nút "Làm sạch")
-- Không xóa bài tập/buổi đã có bài nộp (chỉ giữ trong thùng rác).
-- =====================================================================
create or replace function public.gv_lam_sach_thung_rac()
returns jsonb language plpgsql security invoker set search_path = public as $$
declare n int := 0; m int;
begin
  if not public.is_teacher() then raise exception 'Không có quyền'; end if;
  delete from announcements where deleted_at < now() - interval '30 days'; get diagnostics m = row_count; n := n + m;
  delete from materials where deleted_at < now() - interval '30 days'; get diagnostics m = row_count; n := n + m;
  delete from assignments a where a.deleted_at < now() - interval '30 days'
    and not exists (select 1 from submissions s where s.assignment_id = a.id); get diagnostics m = row_count; n := n + m;
  delete from lessons l where l.deleted_at < now() - interval '30 days'
    and not exists (select 1 from assignments a join submissions s on s.assignment_id = a.id where a.lesson_id = l.id);
  get diagnostics m = row_count; n := n + m;
  delete from topics where deleted_at < now() - interval '30 days'; get diagnostics m = row_count; n := n + m;
  delete from modules where deleted_at < now() - interval '30 days'; get diagnostics m = row_count; n := n + m;
  insert into audit_log(user_id, hanh_dong, doi_tuong, sau) values (auth.uid(), 'lam_sach', 'thung_rac', jsonb_build_object('so_muc', n));
  return jsonb_build_object('ok', true, 'so_muc', n);
end $$;

-- =====================================================================
-- DANH MỤC MẶC ĐỊNH (chỉ thêm khi bảng còn trống; thầy sửa trong Cài đặt)
-- =====================================================================
insert into public.lesson_types(ten, mau, icon, co_bai_nop_mac_dinh, tinh_diem, noi_bat, tu_khoa, thu_tu)
select * from (values
  ('Lý thuyết',            'blue',   'book-open',     false, false, false, 'lý thuyết',          1),
  ('Bài tập',              'orange', 'code',          true,  true,  false, 'bài tập,luyện tập',  2),
  ('Lý thuyết + thực hành','teal',   'laptop',        true,  true,  false, 'thực hành',          3),
  ('Ôn tập',               'purple', 'refresh-cw',    false, false, false, 'ôn tập',             4),
  ('Kiểm tra',             'red',    'clipboard-check', true, true, true,  'kiểm tra,đánh giá',  5),
  ('Contest',              'red',    'trophy',        false, true,  true,  'contest',            6),
  ('Case study',           'green',  'folder-kanban', true,  true,  false, 'case study,dự án',   7)
) v(ten, mau, icon, co, td, nb, tk, tt)
where not exists (select 1 from public.lesson_types);

insert into public.material_categories(ten, thu_tu)
select * from (values ('Kiến thức',1),('Phiếu học tập',2),('Slide',3),('Sách/Giáo trình',4),('Tham khảo',5),('Code mẫu',6)) v(ten,tt)
where not exists (select 1 from public.material_categories);

insert into public.comment_templates(noi_dung, thu_tu)
select * from (values
  ('Làm tốt! Code rõ ràng, cố gắng phát huy nhé! ⭐', 1),
  ('Đúng kết quả, nhưng em đặt tên biến dễ hiểu hơn nhé.', 2),
  ('Chương trình còn lỗi, em chạy thử lại với nhiều dữ liệu khác nhau.', 3),
  ('Em chú ý thụt lề (indent) cho đúng nhé.', 4),
  ('Bài chưa hoàn thành, em làm tiếp và nộp lại nhé.', 5)
) v(nd, tt)
where not exists (select 1 from public.comment_templates);

insert into public.message_templates(ten, noi_dung, mac_dinh)
select * from (values
  ('Nhắc chưa làm bài',
   'Thầy/cô nhắc nhở: Phụ huynh em {ten_hs} (lớp {lop}) giúp thầy nhắc em hoàn thành bài tập: {danh_sach_bai}. Hạn nộp: {han_nop}. Cảm ơn phụ huynh!', true),
  ('Nhắc chưa làm được (cần nộp lại)',
   'Thầy/cô thông báo: Em {ten_hs} (lớp {lop}) cần làm lại bài: {danh_sach_bai} (hạn {han_nop}). Phụ huynh động viên em hoàn thành giúp thầy nhé!', false)
) v(ten, nd, md)
where not exists (select 1 from public.message_templates);

insert into public.app_settings(key, value) values
  ('lam_tron_diem', '1'::jsonb),
  ('cho_nop_tre_mac_dinh', 'true'::jsonb),
  ('hs_tai_phieu_tien_do', 'false'::jsonb)
on conflict (key) do nothing;
