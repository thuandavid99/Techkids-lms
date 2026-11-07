-- =====================================================================
-- 002_rls.sql — BẬT ROW LEVEL SECURITY + CHÍNH SÁCH PHÂN QUYỀN
-- Chạy SAU 001_schema.sql. An toàn khi chạy lại.
-- Nguyên tắc: học sinh chỉ đọc dữ liệu của mình + nội dung lớp mình đã mở;
-- giáo viên toàn quyền. Việc GHI quan trọng của học sinh (nộp bài) đi qua
-- hàm chạy ở server bằng khóa service_role (xem 004), không ghi thẳng bảng.
-- =====================================================================

-- ---------- HÀM TIỆN ÍCH (security definer: chạy với quyền chủ sở hữu, tránh vòng lặp RLS) ----------
create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and vai_tro in ('giao_vien','tro_giang') and deleted_at is null
  );
$$;

create or replace function public.my_class_id()
returns uuid language sql stable security definer set search_path = public as $$
  select class_id from public.profiles where id = auth.uid() and deleted_at is null;
$$;

-- Buổi học (gốc hoặc bản ghi đè) đã MỞ cho lớp p_class chưa?
create or replace function public.buoi_mo_cho_lop(p_lesson uuid, p_class uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_class is not null and exists (
    select 1
    from public.lessons l
    join public.class_curriculum cc on cc.curriculum_id = l.curriculum_id and cc.class_id = p_class
    join public.class_lessons cl on cl.class_id = cc.class_id and cl.lesson_id = coalesce(l.ghi_de_cua, l.id)
    join public.lessons base on base.id = coalesce(l.ghi_de_cua, l.id)
    where l.id = p_lesson
      and l.deleted_at is null and base.deleted_at is null
      and not l.ban_nhap and not base.ban_nhap
      and (l.class_id is null or l.class_id = cc.class_id)
      and cl.hien_thi and cl.deleted_at is null
      and (cl.ngay_mo is null or cl.ngay_mo <= now())
  );
$$;

-- Bài tập (gốc hoặc bản ghi đè) đã mở cho lớp p_class chưa?
create or replace function public.bai_tap_mo_cho_lop(p_assignment uuid, p_class uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_class is not null and exists (
    select 1
    from public.assignments a
    join public.assignments base on base.id = coalesce(a.ghi_de_cua, a.id)
    where a.id = p_assignment
      and a.deleted_at is null and base.deleted_at is null
      and a.hien_thi and base.hien_thi
      and (a.class_id is null or a.class_id = p_class)
      and (base.class_id is null or base.class_id = p_class)
      and public.buoi_mo_cho_lop(base.lesson_id, p_class)
  );
$$;

-- Phiên bản cho người đang đăng nhập (dùng trong chính sách RLS)
create or replace function public.hs_thay_buoi(p_lesson uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.buoi_mo_cho_lop(p_lesson, public.my_class_id());
$$;

create or replace function public.hs_thay_bai_tap(p_assignment uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.bai_tap_mo_cho_lop(p_assignment, public.my_class_id());
$$;

create or replace function public.hs_thay_tai_lieu(p_material uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.materials m
    where m.id = p_material and m.deleted_at is null and m.hien_thi
      and (
        not exists (select 1 from public.material_classes mc where mc.material_id = m.id)
        or exists (select 1 from public.material_classes mc where mc.material_id = m.id and mc.class_id = public.my_class_id())
      )
      and (
        (m.lesson_id is null and public.my_class_id() is not null)
        or (m.lesson_id is not null and public.hs_thay_buoi(m.lesson_id))
      )
  );
$$;

-- ---------- BẬT RLS CHO MỌI BẢNG ----------
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
    -- Giáo viên: toàn quyền trên mọi bảng
    execute format('drop policy if exists gv_all on public.%I', t);
    execute format('create policy gv_all on public.%I for all to authenticated using (public.is_teacher()) with check (public.is_teacher())', t);
  end loop;
end $$;

-- Nhật ký: giáo viên chỉ được ĐỌC và THÊM (không sửa/xóa lịch sử)
drop policy if exists gv_all on public.audit_log;
drop policy if exists gv_doc on public.audit_log;
drop policy if exists gv_them on public.audit_log;
create policy gv_doc on public.audit_log for select to authenticated using (public.is_teacher());
create policy gv_them on public.audit_log for insert to authenticated with check (public.is_teacher());

-- ---------- CHÍNH SÁCH CHO HỌC SINH ----------
-- Lớp của mình
drop policy if exists hs_doc on public.classes;
create policy hs_doc on public.classes for select to authenticated
  using (id = public.my_class_id() and deleted_at is null);

-- Hồ sơ: chỉ dòng của mình (danh sách bạn cùng lớp lấy qua hàm ds_ban_cung_lop, chỉ họ tên)
drop policy if exists hs_doc on public.profiles;
create policy hs_doc on public.profiles for select to authenticated using (id = auth.uid());

drop policy if exists hs_doc on public.enrollments;
create policy hs_doc on public.enrollments for select to authenticated using (student_id = auth.uid());

-- Chương trình / module / chủ đề của lớp mình
drop policy if exists hs_doc on public.curricula;
create policy hs_doc on public.curricula for select to authenticated using (
  deleted_at is null and exists (select 1 from public.class_curriculum cc
    where cc.curriculum_id = curricula.id and cc.class_id = public.my_class_id()));

drop policy if exists hs_doc on public.modules;
create policy hs_doc on public.modules for select to authenticated using (
  deleted_at is null and exists (select 1 from public.class_curriculum cc
    where cc.curriculum_id = modules.curriculum_id and cc.class_id = public.my_class_id()));

drop policy if exists hs_doc on public.topics;
create policy hs_doc on public.topics for select to authenticated using (
  deleted_at is null and exists (select 1 from public.modules m
    join public.class_curriculum cc on cc.curriculum_id = m.curriculum_id
    where m.id = topics.module_id and cc.class_id = public.my_class_id()));

-- Danh mục: ai đăng nhập cũng đọc được
drop policy if exists moi_nguoi_doc on public.lesson_types;
create policy moi_nguoi_doc on public.lesson_types for select to authenticated using (true);
drop policy if exists moi_nguoi_doc on public.material_categories;
create policy moi_nguoi_doc on public.material_categories for select to authenticated using (true);
drop policy if exists moi_nguoi_doc on public.app_settings;
create policy moi_nguoi_doc on public.app_settings for select to authenticated using (true);

drop policy if exists hs_doc on public.lessons;
create policy hs_doc on public.lessons for select to authenticated using (public.hs_thay_buoi(id));

drop policy if exists hs_doc on public.class_curriculum;
create policy hs_doc on public.class_curriculum for select to authenticated using (class_id = public.my_class_id());

drop policy if exists hs_doc on public.class_lessons;
create policy hs_doc on public.class_lessons for select to authenticated using (class_id = public.my_class_id());

drop policy if exists hs_doc on public.materials;
create policy hs_doc on public.materials for select to authenticated using (public.hs_thay_tai_lieu(id));

drop policy if exists hs_doc on public.material_classes;
create policy hs_doc on public.material_classes for select to authenticated using (class_id = public.my_class_id());

drop policy if exists hs_doc on public.assignments;
create policy hs_doc on public.assignments for select to authenticated using (public.hs_thay_bai_tap(id));

drop policy if exists hs_doc on public.assignment_files;
create policy hs_doc on public.assignment_files for select to authenticated using (public.hs_thay_bai_tap(assignment_id));

drop policy if exists hs_doc on public.assignment_deadlines;
create policy hs_doc on public.assignment_deadlines for select to authenticated using (class_id = public.my_class_id());

drop policy if exists hs_doc on public.student_overrides;
create policy hs_doc on public.student_overrides for select to authenticated using (student_id = auth.uid());

-- Bài nộp: học sinh chỉ ĐỌC bài của mình. Nộp bài đi qua hàm hs_nop_bai (server).
drop policy if exists hs_doc on public.submissions;
create policy hs_doc on public.submissions for select to authenticated using (student_id = auth.uid());

-- Nháp: học sinh đọc/ghi nháp của mình cho bài mình được thấy
drop policy if exists hs_doc on public.drafts;
drop policy if exists hs_them on public.drafts;
drop policy if exists hs_sua on public.drafts;
create policy hs_doc on public.drafts for select to authenticated using (student_id = auth.uid());
create policy hs_them on public.drafts for insert to authenticated
  with check (student_id = auth.uid() and public.hs_thay_bai_tap(assignment_id));
create policy hs_sua on public.drafts for update to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid() and public.hs_thay_bai_tap(assignment_id));

-- Cờ "Em chưa làm được": học sinh đọc/ghi dòng của mình (không thấy cờ của bạn khác)
drop policy if exists hs_doc on public.student_flags;
drop policy if exists hs_them on public.student_flags;
drop policy if exists hs_sua on public.student_flags;
create policy hs_doc on public.student_flags for select to authenticated using (student_id = auth.uid());
create policy hs_them on public.student_flags for insert to authenticated
  with check (student_id = auth.uid() and public.hs_thay_bai_tap(assignment_id) and da_ho_tro = false);
create policy hs_sua on public.student_flags for update to authenticated
  using (student_id = auth.uid()) with check (
    student_id = auth.uid() and public.hs_thay_bai_tap(assignment_id)
    -- Chỉ tích/bỏ tích được cho tới khi bài đã chấm
    and not exists (select 1 from public.submissions s where s.assignment_id = student_flags.assignment_id
                    and s.student_id = auth.uid() and s.trang_thai = 'da_cham'));

drop policy if exists hs_doc on public.announcements;
create policy hs_doc on public.announcements for select to authenticated
  using (class_id = public.my_class_id() and deleted_at is null);

-- Thông báo: mỗi người đọc/đánh dấu đã đọc thông báo của mình
drop policy if exists toi_doc on public.notifications;
drop policy if exists toi_sua on public.notifications;
create policy toi_doc on public.notifications for select to authenticated using (user_id = auth.uid());
create policy toi_sua on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Các bảng CHỈ giáo viên (đã có gv_all ở trên, không thêm chính sách học sinh):
-- class_teachers, password_requests, parent_reminders, message_templates,
-- comment_templates, teacher_notes, audit_log.

-- Người chưa đăng nhập (anon) KHÔNG có chính sách nào → không đọc/ghi được gì.
