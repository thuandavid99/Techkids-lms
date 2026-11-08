-- =====================================================================
-- 005_giao_vien_rieng.sql — PHÂN LOẠI TÀI KHOẢN: QUẢN TRỊ / GIÁO VIÊN
-- Chạy SAU 004. An toàn khi chạy lại nhiều lần.
--
--  * quan_tri  : toàn quyền (như trước đây), quản lý giáo viên, cài đặt hệ thống,
--                sửa chương trình học CHUNG.
--  * giao_vien : chỉ thấy và làm việc với LỚP MÌNH PHỤ TRÁCH (bảng class_teachers):
--                học sinh, bài nộp, chấm, ma trận, báo cáo, thông báo lớp, lịch lớp,
--                bản riêng buổi/bài cho lớp mình. Chỉ XEM chương trình chung.
--  * tro_giang : như giao_vien (dự phòng cho sau này).
--  * hoc_sinh  : không đổi.
--
-- Phân quyền được chặn ở CƠ SỞ DỮ LIỆU (RLS), không chỉ ẩn nút trên giao diện.
-- =====================================================================

-- ---------- 1. Thêm vai trò quan_tri ----------
alter table public.profiles drop constraint if exists profiles_vai_tro_check;
alter table public.profiles add constraint profiles_vai_tro_check
  check (vai_tro in ('hoc_sinh','giao_vien','tro_giang','quan_tri'));

-- Email liên hệ của giáo viên (để hiển thị trong màn Quản lý giáo viên)
alter table public.profiles add column if not exists email text;

-- Tài khoản đầu tiên: thầy Trương Công Thuận → quản trị.
-- Nếu chưa có quản trị nào, giáo viên tạo sớm nhất cũng được nâng lên quản trị (để không bị khóa ngoài).
update public.profiles p set vai_tro = 'quan_tri', email = u.email
  from auth.users u
 where u.id = p.id and lower(u.email) = 'truongdavid19999@gmail.com' and p.vai_tro <> 'hoc_sinh';

update public.profiles set vai_tro = 'quan_tri'
 where id = (select id from public.profiles where vai_tro = 'giao_vien' and deleted_at is null order by tao_luc limit 1)
   and not exists (select 1 from public.profiles where vai_tro = 'quan_tri' and deleted_at is null);

-- Điền email cho các giáo viên đã có
update public.profiles p set email = u.email from auth.users u
 where u.id = p.id and p.vai_tro <> 'hoc_sinh' and p.email is null;

-- ---------- 2. Hàm phân quyền ----------
-- Là giáo viên/quản trị còn hoạt động (giữ nguyên tên cũ để các file trước vẫn chạy)
create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
    where id = auth.uid() and vai_tro in ('giao_vien','tro_giang','quan_tri') and deleted_at is null);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
    where id = auth.uid() and vai_tro = 'quan_tri' and deleted_at is null);
$$;

-- Người đang đăng nhập có phụ trách lớp này không? (quản trị: mọi lớp)
create or replace function public.teaches_class(p_class uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or (p_class is not null and public.is_teacher() and exists (
    select 1 from public.class_teachers ct where ct.class_id = p_class and ct.teacher_id = auth.uid()));
$$;

-- Có phụ trách học sinh này không? (theo lớp hiện tại của em)
create or replace function public.teaches_student(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.profiles p where p.id = p_student and p.vai_tro = 'hoc_sinh' and public.teaches_class(p.class_id));
$$;

-- Có được sửa buổi học này không? (bản chung: chỉ quản trị; bản riêng lớp: GV lớp đó)
create or replace function public.can_edit_lesson(p_lesson uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.lessons l where l.id = p_lesson and l.class_id is not null and public.teaches_class(l.class_id));
$$;

create or replace function public.can_edit_assignment(p_assignment uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.assignments a where a.id = p_assignment and a.class_id is not null and public.teaches_class(a.class_id));
$$;

-- Danh sách id lớp mình phụ trách (dùng cho giao diện)
create or replace function public.lop_cua_toi()
returns setof uuid language sql stable security definer set search_path = public as $$
  select c.id from public.classes c where c.deleted_at is null and public.teaches_class(c.id);
$$;

-- ---------- 3. Bỏ chính sách "giáo viên toàn quyền" cũ, thay bằng chính sách mới ----------
do $$
declare t text;
begin
  foreach t in array array[
    'classes','profiles','enrollments','class_teachers','curricula','modules','topics',
    'lesson_types','lessons','class_curriculum','class_lessons','material_categories',
    'materials','material_classes','assignments','assignment_files','assignment_deadlines',
    'student_overrides','submissions','drafts','student_flags','announcements',
    'notifications','password_requests','parent_reminders','message_templates',
    'comment_templates','teacher_notes','audit_log','app_settings'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists gv_all on public.%I', t);
    execute format('drop policy if exists gv_doc on public.%I', t);
    execute format('drop policy if exists gv_them on public.%I', t);
    execute format('drop policy if exists gv_sua on public.%I', t);
    execute format('drop policy if exists gv_xoa on public.%I', t);
    execute format('drop policy if exists gv_ghi on public.%I', t);
    -- Quản trị: toàn quyền mọi bảng (trừ nhật ký, xử lý riêng bên dưới)
    execute format('drop policy if exists qt_all on public.%I', t);
    if t <> 'audit_log' then
      execute format('create policy qt_all on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    end if;
  end loop;
end $$;

-- Tiện ích tạo 4 chính sách đọc/thêm/sửa/xóa cho giáo viên với cùng một điều kiện
create or replace function public._tao_cs_gv(p_bang text, p_doc text, p_ghi text)
returns void language plpgsql as $$
begin
  execute format('create policy gv_doc on public.%I for select to authenticated using (public.is_teacher() and (%s))', p_bang, p_doc);
  if p_ghi is not null then
    execute format('create policy gv_them on public.%I for insert to authenticated with check (public.is_teacher() and (%s))', p_bang, p_ghi);
    execute format('create policy gv_sua on public.%I for update to authenticated using (public.is_teacher() and (%s)) with check (public.is_teacher() and (%s))', p_bang, p_ghi, p_ghi);
    execute format('create policy gv_xoa on public.%I for delete to authenticated using (public.is_teacher() and (%s))', p_bang, p_ghi);
  end if;
end $$;

-- 3a. Theo LỚP
select public._tao_cs_gv('classes',              'public.teaches_class(id)',       null);  -- tạo/xóa/sửa lớp: quản trị
select public._tao_cs_gv('class_curriculum',     'public.teaches_class(class_id)', 'public.teaches_class(class_id)');
select public._tao_cs_gv('class_lessons',        'public.teaches_class(class_id)', 'public.teaches_class(class_id)');
select public._tao_cs_gv('assignment_deadlines', 'public.teaches_class(class_id)', 'public.teaches_class(class_id)');
select public._tao_cs_gv('announcements',        'public.teaches_class(class_id)', 'public.teaches_class(class_id)');
select public._tao_cs_gv('enrollments',          'public.teaches_class(class_id)', 'public.teaches_class(class_id)');
select public._tao_cs_gv('material_classes',     'true',                           'public.teaches_class(class_id)');
-- Gán giáo viên: chỉ quản trị ghi; GV thấy dòng của lớp mình
select public._tao_cs_gv('class_teachers',       'public.teaches_class(class_id)', null);

-- 3b. Theo HỌC SINH
-- Hồ sơ: HS của lớp mình + tài khoản giáo viên (để hiện tên người chấm, nhật ký) + chính mình
select public._tao_cs_gv('profiles',
  'id = auth.uid() or (vai_tro = ''hoc_sinh'' and public.teaches_class(class_id)) or vai_tro <> ''hoc_sinh''',
  'vai_tro = ''hoc_sinh'' and public.teaches_class(class_id)');
select public._tao_cs_gv('submissions',       'public.teaches_student(student_id)', 'public.teaches_student(student_id)');
select public._tao_cs_gv('drafts',            'public.teaches_student(student_id)', null);
select public._tao_cs_gv('student_flags',     'public.teaches_student(student_id)', 'public.teaches_student(student_id)');
select public._tao_cs_gv('student_overrides', 'public.teaches_student(student_id)', 'public.teaches_student(student_id)');
select public._tao_cs_gv('password_requests', 'public.teaches_student(student_id)', 'public.teaches_student(student_id)');
select public._tao_cs_gv('parent_reminders',  'public.teaches_student(student_id)', 'public.teaches_student(student_id)');
select public._tao_cs_gv('teacher_notes',     'public.teaches_student(student_id)', 'public.teaches_student(student_id)');

-- 3c. NỘI DUNG chương trình: GV đọc hết; sửa bản chung = quản trị; bản riêng lớp = GV lớp đó
select public._tao_cs_gv('curricula',  'true', null);
select public._tao_cs_gv('modules',    'true', null);
select public._tao_cs_gv('topics',     'true', null);
select public._tao_cs_gv('lessons',    'class_id is null or public.teaches_class(class_id)',
                                        'class_id is not null and public.teaches_class(class_id)');
select public._tao_cs_gv('assignments','class_id is null or public.teaches_class(class_id)',
                                        'class_id is not null and public.teaches_class(class_id)');
select public._tao_cs_gv('assignment_files', 'true', 'public.can_edit_assignment(assignment_id)');
select public._tao_cs_gv('materials',  'true', 'lesson_id is not null and public.can_edit_lesson(lesson_id)');

-- 3d. DANH MỤC / CÀI ĐẶT: GV chỉ đọc
select public._tao_cs_gv('lesson_types',        'true', null);
select public._tao_cs_gv('material_categories', 'true', null);
select public._tao_cs_gv('message_templates',   'true', null);
select public._tao_cs_gv('comment_templates',   'true', null);
select public._tao_cs_gv('app_settings',        'true', null);

-- 3e. Thông báo: ai cũng chỉ thấy của mình (chính sách toi_doc/toi_sua ở 002). Không thêm gì.

-- 3f. Nhật ký: quản trị đọc tất cả; GV đọc dòng của mình; ai cũng chỉ THÊM dòng mang tên mình
drop policy if exists qt_doc on public.audit_log;
create policy qt_doc on public.audit_log for select to authenticated using (public.is_admin());
create policy gv_doc on public.audit_log for select to authenticated using (public.is_teacher() and user_id = auth.uid());
create policy gv_them on public.audit_log for insert to authenticated with check (public.is_teacher() and user_id = auth.uid());

drop function if exists public._tao_cs_gv(text, text, text);

-- ---------- 4. Storage: chỉ quản trị thao tác trực tiếp; mọi người khác đi qua server ----------
drop policy if exists lms_gv_all on storage.objects;
create policy lms_gv_all on storage.objects for all to authenticated
  using (bucket_id in ('submissions','materials','assignment-files') and public.is_admin())
  with check (bucket_id in ('submissions','materials','assignment-files') and public.is_admin());

-- ---------- 5. Thông báo cho đúng giáo viên phụ trách (không gửi cho GV lớp khác) ----------
create or replace function public.gv_nhan_tb(p_class uuid)
returns setof uuid language sql stable security definer set search_path = public as $$
  select p.id from public.profiles p
   where p.deleted_at is null
     and (p.vai_tro = 'quan_tri'
          or (p.vai_tro in ('giao_vien','tro_giang')
              and exists (select 1 from public.class_teachers ct where ct.teacher_id = p.id and ct.class_id = p_class)));
$$;

create or replace function public.tg_flag_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare p record; a record;
begin
  if new.chua_lam_duoc and not new.da_ho_tro
     and (tg_op = 'INSERT' or not old.chua_lam_duoc or old.da_ho_tro) then
    select ho_ten, ma_hs, class_id into p from profiles where id = new.student_id;
    select ma, lesson_id into a from assignments where id = new.assignment_id;
    insert into notifications(user_id, loai, noi_dung, lien_ket, khoa_gop)
    select t, 'chua_lam_duoc',
           '🙋 ' || p.ho_ten || ' (' || p.ma_hs || ') báo chưa làm được Bài tập ' || a.ma,
           '/gv/bai-tap/hang-doi?tab=can-ho-tro', 'flag:' || new.student_id || ':' || a.lesson_id
      from public.gv_nhan_tb(p.class_id) t
    on conflict (user_id, khoa_gop) where khoa_gop is not null
    do update set noi_dung = excluded.noi_dung, da_doc = false, tao_luc = now();
  end if;
  return new;
end $$;

create or replace function public.tg_pwreq_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare p record;
begin
  select ho_ten, ma_hs, class_id into p from profiles where id = new.student_id;
  insert into notifications(user_id, loai, noi_dung, lien_ket, khoa_gop)
  select t, 'reset_mk', p.ho_ten || ' (' || p.ma_hs || ') xin cấp lại mật khẩu',
         '/gv/hoc-sinh/yeu-cau-mat-khau', 'reset:' || new.student_id
    from public.gv_nhan_tb(p.class_id) t
  on conflict (user_id, khoa_gop) where khoa_gop is not null
  do update set noi_dung = excluded.noi_dung, da_doc = false, tao_luc = now();
  return new;
end $$;

-- Tên giáo viên phụ trách lớp (học sinh xem ở "Lớp của tôi")
create or replace function public.gv_cua_lop()
returns table(ho_ten text) language sql stable security definer set search_path = public as $$
  select p.ho_ten from profiles p
   where p.vai_tro in ('giao_vien','quan_tri') and p.deleted_at is null
     and exists (select 1 from class_teachers ct where ct.teacher_id = p.id and ct.class_id = public.my_class_id())
   order by p.ho_ten;
$$;

-- ---------- 6. Làm sạch thùng rác: chỉ quản trị ----------
create or replace function public.gv_lam_sach_thung_rac()
returns jsonb language plpgsql security invoker set search_path = public as $$
declare n int := 0; m int;
begin
  if not public.is_admin() then raise exception 'Chỉ quản trị được làm sạch thùng rác.'; end if;
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

-- ---------- 7. Chỉ mục giúp kiểm tra quyền nhanh ----------
create index if not exists class_teachers_teacher_idx on public.class_teachers(teacher_id, class_id);
create index if not exists profiles_class_role_idx on public.profiles(class_id, vai_tro) where deleted_at is null;

-- Xong. Kiểm tra nhanh: select ho_ten, vai_tro, email from profiles where vai_tro <> 'hoc_sinh';
