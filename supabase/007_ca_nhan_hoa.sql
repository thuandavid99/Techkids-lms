-- =====================================================================
-- 007_ca_nhan_hoa.sql — CHẠY SAU 006 (Supabase → SQL Editor → dán → Run). An toàn khi chạy lại.
-- CÁ NHÂN HÓA TỪNG HỌC SINH — chỉ thêm "ngoại lệ" cho từng em, lớp không bị ảnh hưởng:
--   1) Mở buổi riêng cho 1 em (học bù / học vượt)  → bảng student_lesson_access
--   2) Gia hạn / miễn nộp riêng                     → bảng student_overrides (đã có từ 001)
--   3) Bài tập riêng (chỉ giao cho vài em)          → assignments.chi_rieng + bảng assignment_students
-- =====================================================================

create table if not exists public.student_lesson_access (
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id  uuid not null references public.lessons(id) on delete cascade,   -- buổi GỐC
  ghi_chu    text,
  tao_luc    timestamptz not null default now(),
  tao_boi    uuid default auth.uid(),
  primary key (student_id, lesson_id)
);
alter table public.student_lesson_access enable row level security;

alter table public.assignments add column if not exists chi_rieng boolean not null default false;
create table if not exists public.assignment_students (
  assignment_id uuid not null references public.assignments(id) on delete cascade,  -- bài GỐC
  student_id    uuid not null references public.profiles(id) on delete cascade,
  primary key (assignment_id, student_id)
);
alter table public.assignment_students enable row level security;
create index if not exists assignment_students_hs on public.assignment_students(student_id);

-- Quyền: quản trị mọi thứ; GV chỉ học sinh lớp mình; học sinh chỉ đọc dòng của mình
do $$ declare t text; begin
  foreach t in array array['student_lesson_access', 'assignment_students'] loop
    execute format('drop policy if exists qt_all on public.%I', t);
    execute format('drop policy if exists gv_all on public.%I', t);
    execute format('drop policy if exists hs_doc on public.%I', t);
    execute format('create policy qt_all on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy gv_all on public.%I for all to authenticated using (public.teaches_student(student_id)) with check (public.teaches_student(student_id))', t);
    execute format('create policy hs_doc on public.%I for select to authenticated using (student_id = auth.uid())', t);
  end loop;
end $$;

-- Buổi mở cho MỘT học sinh = mở cho lớp của em HOẶC được mở riêng (buổi phải thuộc chương trình lớp em)
create or replace function public.buoi_mo_cho_hs(p_lesson uuid, p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  with hs as (select class_id from profiles where id = p_student and vai_tro = 'hoc_sinh' and deleted_at is null)
  select coalesce((select public.buoi_mo_cho_lop(p_lesson, hs.class_id) from hs), false)
      or exists (
        select 1 from hs
        join lessons l on l.id = p_lesson and l.deleted_at is null and not l.ban_nhap
        join class_curriculum cc on cc.curriculum_id = l.curriculum_id and cc.class_id = hs.class_id
        join student_lesson_access sla on sla.student_id = p_student and sla.lesson_id = coalesce(l.ghi_de_cua, l.id)
        where (l.class_id is null or l.class_id = hs.class_id)
      );
$$;

-- Bài tập mở cho MỘT học sinh: như cho lớp, nhưng buổi xét theo em (mở riêng) và bài riêng phải được giao
create or replace function public.bai_tap_mo_cho_hs(p_assignment uuid, p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  with hs as (select class_id from profiles where id = p_student and vai_tro = 'hoc_sinh' and deleted_at is null)
  select exists (
    select 1 from hs
    join assignments a on a.id = p_assignment
    join assignments base on base.id = coalesce(a.ghi_de_cua, a.id)
    where a.deleted_at is null and base.deleted_at is null
      and a.hien_thi and base.hien_thi
      and (a.class_id is null or a.class_id = hs.class_id)
      and (base.class_id is null or base.class_id = hs.class_id)
      and public.buoi_mo_cho_hs(base.lesson_id, p_student)
      and (not base.chi_rieng or exists (select 1 from assignment_students ast where ast.assignment_id = base.id and ast.student_id = p_student))
  );
$$;

create or replace function public.hs_thay_buoi(p_lesson uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.buoi_mo_cho_hs(p_lesson, auth.uid());
$$;

create or replace function public.hs_thay_bai_tap(p_assignment uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.bai_tap_mo_cho_hs(p_assignment, auth.uid());
$$;

-- View trạng thái từng em × từng bài: tính cả buổi mở riêng + bài riêng
create or replace view public.v_bai_hoc_sinh with (security_invoker = true) as
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
  (b.hien_thi and not l.ban_nhap and (
     (coalesce(cl.hien_thi,false) and cl.deleted_at is null and (cl.ngay_mo is null or cl.ngay_mo <= now()))
     or exists (select 1 from public.student_lesson_access sla where sla.student_id = p.id and sla.lesson_id = b.lesson_id)
  )) as da_mo,
  cl.ngay_hoc, coalesce(cl.da_day,false) as da_day
from public.v_bai_tap_hieu_luc b
join public.profiles p
  on p.class_id = b.class_id and p.vai_tro = 'hoc_sinh' and p.deleted_at is null and p.dang_hoc
join public.lessons l on l.id = b.lesson_id
left join public.class_lessons cl on cl.class_id = b.class_id and cl.lesson_id = b.lesson_id
left join public.student_overrides ov on ov.assignment_id = b.assignment_id and ov.student_id = p.id
left join public.submissions s on s.assignment_id = b.assignment_id and s.student_id = p.id
left join public.student_flags f on f.assignment_id = b.assignment_id and f.student_id = p.id
-- Bài riêng: chỉ học sinh được giao mới có dòng (không tính "chưa nộp" cho em khác)
where not exists (select 1 from public.assignments ar where ar.id = b.assignment_id and ar.chi_rieng)
   or exists (select 1 from public.assignment_students ast where ast.assignment_id = b.assignment_id and ast.student_id = p.id);

-- Nộp bài: kiểm tra theo từng em (buổi mở riêng, bài riêng)
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
    if not public.bai_tap_mo_cho_hs(p_assignment, p_student) then
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

-- Thông báo tự động: theo từng em
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
   where b.class_id = v_class and public.bai_tap_mo_cho_hs(b.assignment_id, v_uid)
     and b.loai_nop <> 'ngoai_he_thong'
     and greatest(coalesce(cl.ngay_mo, '-infinity'), coalesce(cl.ngay_hoc::timestamptz, '-infinity')) >= now() - interval '7 days'
  on conflict (user_id, khoa_gop) where khoa_gop is not null do nothing;

  insert into notifications(user_id, loai, noi_dung, lien_ket, khoa_gop)
  select v_uid, 'sap_han',
         'Nhắc nhở: Hạn nộp Bài tập ' || b.ma || ' là ' || to_char(coalesce(o.han_nop_rieng, b.han_nop) at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI DD/MM'),
         '/bai-tap/' || b.assignment_id || '/lam-bai', 'han:' || b.assignment_id
    from v_bai_tap_hieu_luc b
    left join student_overrides o on o.assignment_id = b.assignment_id and o.student_id = v_uid
   where b.class_id = v_class and public.bai_tap_mo_cho_hs(b.assignment_id, v_uid)
     and b.loai_nop <> 'ngoai_he_thong'
     and coalesce(o.mien_nop, false) = false
     and coalesce(o.han_nop_rieng, b.han_nop) between now() and now() + interval '24 hours'
     and not exists (select 1 from submissions s where s.assignment_id = b.assignment_id and s.student_id = v_uid)
  on conflict (user_id, khoa_gop) where khoa_gop is not null do nothing;
end $$;

-- Buổi sắp mở: bỏ các buổi em đã được mở riêng
create or replace function public.hs_buoi_sap_mo(p_so int default 2)
returns table(lesson_id uuid, nhan_buoi text, tieu_de text, ngay_hoc date)
language sql stable security definer set search_path = public as $$
  select b.lesson_id, b.nhan_buoi, b.tieu_de, b.ngay_hoc
    from v_buoi_hieu_luc b
    left join modules m on m.id = b.module_id
   where b.class_id = public.my_class_id() and not b.da_mo and not b.ban_nhap
     and not exists (select 1 from student_lesson_access sla where sla.student_id = auth.uid() and sla.lesson_id = b.lesson_id)
   order by m.thu_tu nulls last, b.thu_tu
   limit least(greatest(coalesce(p_so, 2), 1), 3);
$$;
