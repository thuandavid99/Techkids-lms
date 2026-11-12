-- =====================================================================
-- tests/sql/rls_test.sql — KIỂM THỬ PHÂN QUYỀN + NỘP/CHẤM BÀI (dành cho lập trình viên)
-- KHÔNG chạy trên Supabase thật (file tạo người dùng giả trong auth.users).
-- Chạy trên Postgres thử nghiệm sau 00_supabase_stub + 001..006 + seed.
-- Mỗi kiểm tra in "OK ..." hoặc dừng với lỗi "FAIL ...".
-- =====================================================================
\set ON_ERROR_STOP 1
begin;

-- Người dùng giả
insert into auth.users(id, email) values
 ('00000000-0000-0000-0000-0000000000a1','thay@x.vn'),
 ('00000000-0000-0000-0000-0000000000a2','cob@x.vn'),
 ('00000000-0000-0000-0000-0000000000b1','hs001@x.vn'),
 ('00000000-0000-0000-0000-0000000000b2','hs002@x.vn');
insert into profiles(id, ma_hs, ho_ten, vai_tro, must_change_password) values
 ('00000000-0000-0000-0000-0000000000a1','thaythuan','Thầy Thuận','quan_tri', false);
-- Cô B: giáo viên thường, chỉ phụ trách lớp 6A2
insert into profiles(id, ma_hs, ho_ten, vai_tro, must_change_password) values
 ('00000000-0000-0000-0000-0000000000a2','cob','Cô B','giao_vien', false);
insert into class_teachers(class_id, teacher_id) select id, '00000000-0000-0000-0000-0000000000a2' from classes where ten_lop='6A2';
insert into profiles(id, ma_hs, ho_ten, vai_tro, class_id) values
 ('00000000-0000-0000-0000-0000000000b1','HS001','Nguyễn An','hoc_sinh',(select id from classes where ten_lop='6A1')),
 ('00000000-0000-0000-0000-0000000000b2','HS002','Trần Bình','hoc_sinh',(select id from classes where ten_lop='6A2'));

create temp table t_ctx as select
  (select id from classes where ten_lop='6A1') c1,
  (select a.id from assignments a where a.ma='7.1') a71,
  (select a.id from assignments a where a.ma='10.1') a101;
grant select on t_ctx to authenticated, service_role, anon;

-- ---------- 1. Học sinh chỉ thấy hồ sơ của mình ----------
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000b1', true);
do $$ begin
  if (select count(*) from profiles) <> 1 then raise exception 'FAIL: HS thấy hồ sơ người khác'; end if;
  raise notice 'OK 1: HS chỉ thấy hồ sơ của mình';
end $$;

-- ---------- 2. HS chỉ thấy buổi đã mở; không thấy buổi bị ẩn ----------
do $$ declare n_all int; n_seen int; begin
  select count(*) into n_seen from lessons;
  reset role; select count(*) into n_all from lessons; set local role authenticated;
  if n_seen = 0 or n_seen >= n_all then raise exception 'FAIL: HS thấy % / % buổi', n_seen, n_all; end if;
  raise notice 'OK 2: HS thấy %/% buổi (buổi chưa mở bị ẩn)', n_seen, n_all;
end $$;

-- ---------- 3. HS không thể ghi thẳng bảng submissions ----------
do $$ begin
  begin
    insert into submissions(assignment_id, student_id, code_text) select a71, auth.uid(), 'x' from t_ctx;
    raise exception 'FAIL: HS ghi thẳng được submissions';
  exception when insufficient_privilege then raise notice 'OK 3: HS không ghi thẳng được bài nộp';
  end;
end $$;

-- ---------- 4. HS không gọi được hs_nop_bai (chỉ server) ----------
do $$ begin
  begin
    perform hs_nop_bai(auth.uid(), (select a71 from t_ctx), 'print(1)', null, null, null, null);
    raise exception 'FAIL: HS gọi được hs_nop_bai';
  exception when insufficient_privilege then raise notice 'OK 4: hs_nop_bai bị chặn với HS';
  end;
end $$;

-- ---------- 5. Server nộp bài: lần đầu, nộp lại giữ nop_luc_dau ----------
reset role;
set local role service_role;
do $$ declare r jsonb; r2 jsonb; s record; begin
  r := hs_nop_bai('00000000-0000-0000-0000-0000000000b1', (select a71 from t_ctx), 'print(1)', null, null, null, null);
  if not (r->>'ok')::boolean then raise exception 'FAIL 5a: %', r; end if;
  select * into s from submissions where id = (r->>'submission_id')::uuid;
  perform pg_sleep(0.01);
  r2 := hs_nop_bai('00000000-0000-0000-0000-0000000000b1', (select a71 from t_ctx), 'print(2)', null, null, null, null);
  if (r2->>'so_lan')::int <> 2 then raise exception 'FAIL 5b: so_lan %', r2; end if;
  if (select nop_luc_dau from submissions where id = s.id) <> s.nop_luc_dau then raise exception 'FAIL 5c: đổi nop_luc_dau'; end if;
  if (select count(*) from submissions where assignment_id = s.assignment_id and student_id = s.student_id) <> 1 then raise exception 'FAIL 5d'; end if;
  raise notice 'OK 5: nộp lại ghi đè 1 dòng, giữ giờ nộp lần đầu';
end $$;

-- ---------- 6. HS lớp khác không nộp được bài của lớp chưa mở ----------
do $$ declare r jsonb; begin
  r := hs_nop_bai('00000000-0000-0000-0000-0000000000b2', (select a101 from t_ctx), 'x', null, null, null, null);
  if (r->>'ok')::boolean then raise exception 'FAIL 6: nộp được bài chưa mở'; end if;
  raise notice 'OK 6: chặn nộp bài chưa mở (%)', r->>'loi';
end $$;

-- ---------- 7. Thầy chấm; xung đột khi HS nộp bản mới; khóa sau khi chấm ----------
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a1', true);
do $$ declare sid uuid; r jsonb; begin
  select id into sid from submissions where student_id = '00000000-0000-0000-0000-0000000000b1';
  r := gv_luu_diem(sid, 9, 'Tốt', 'cham', now() - interval '1 hour', false, null);
  if not coalesce((r->>'xung_dot')::boolean,false) then raise exception 'FAIL 7a: không báo xung đột %', r; end if;
  r := gv_luu_diem(sid, 9, 'Tốt', 'cham', now(), false, null);
  if not (r->>'ok')::boolean then raise exception 'FAIL 7b %', r; end if;
  r := gv_luu_diem(sid, 8.5, 'Sửa điểm', 'cham', now(), false, null);
  if not exists (select 1 from audit_log where hanh_dong = 'sua_diem') then raise exception 'FAIL 7c: không ghi nhật ký'; end if;
  if not exists (select 1 from notifications where user_id = '00000000-0000-0000-0000-0000000000b1' and loai = 'da_cham') then raise exception 'FAIL 7d: không thông báo'; end if;
  raise notice 'OK 7: cảnh báo bản mới, chấm, ghi nhật ký sửa điểm, thông báo HS';
end $$;
reset role;
set local role service_role;
do $$ declare r jsonb; begin
  r := hs_nop_bai('00000000-0000-0000-0000-0000000000b1', (select a71 from t_ctx), 'print(3)', null, null, null, null);
  if (r->>'ok')::boolean then raise exception 'FAIL 7e: nộp được khi đã chấm'; end if;
  raise notice 'OK 7e: bài đã chấm bị khóa';
end $$;

-- ---------- 8. HS không thấy bài nộp/cờ của bạn; view chỉ trả dòng của mình ----------
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000b2', true);
do $$ begin
  if exists (select 1 from submissions) then raise exception 'FAIL 8a: HS2 thấy bài nộp của HS1'; end if;
  if exists (select 1 from v_bai_hoc_sinh where student_id <> auth.uid()) then raise exception 'FAIL 8b'; end if;
  if (select count(*) from ds_ban_cung_lop()) <> 1 then raise exception 'FAIL 8c'; end if;
  raise notice 'OK 8: HS không thấy dữ liệu bạn khác';
end $$;

-- ---------- 9. Cờ "Em chưa làm được" → thông báo thầy ----------
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000b1', true);
do $$ declare aid uuid; begin
  select a.id into aid from assignments a where a.ma = '8.1';
  if aid is null or not hs_thay_bai_tap(aid) then raise notice 'BỎ QUA 9: bài 8.1 chưa mở theo ngày mẫu'; return; end if;
  insert into student_flags(assignment_id, student_id, chua_lam_duoc, ghi_chu, danh_dau_luc) values (aid, auth.uid(), true, 'Em kẹt ở if', now());
  raise notice 'OK 9a: HS tích được cờ';
end $$;
reset role;
do $$ begin
  if exists (select 1 from student_flags) and not exists (select 1 from notifications where loai = 'chua_lam_duoc') then raise exception 'FAIL 9b'; end if;
  raise notice 'OK 9b: thông báo thầy khi HS báo chưa làm được';
end $$;

-- ---------- 10. anon không đọc được gì ----------
set local role anon;
do $$ begin
  if exists (select 1 from lessons) or exists (select 1 from profiles) then raise exception 'FAIL 10'; end if;
  raise notice 'OK 10: người chưa đăng nhập không đọc được dữ liệu';
end $$;

-- ---------- 11. Thông báo tự động cho học sinh (không cần cron) ----------
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000b1', true);
do $$ begin
  perform hs_tao_thong_bao_tu_dong();
  perform hs_tao_thong_bao_tu_dong(); -- gọi lại không tạo trùng
  if (select count(*) from notifications where loai = 'bai_moi') <> (select count(distinct khoa_gop) from notifications where loai = 'bai_moi') then raise exception 'FAIL 11: trùng thông báo'; end if;
  raise notice 'OK 11: sinh thông báo tự động, không trùng (% thông báo bài mới)', (select count(*) from notifications where loai = 'bai_moi');
end $$;

-- ---------- 12. Làm sạch thùng rác: giữ bài tập đã có bài nộp ----------
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a1', true);
do $$ declare r jsonb; begin
  update assignments set deleted_at = now() - interval '40 days' where ma in ('7.1','9.1');
  r := gv_lam_sach_thung_rac();
  if not exists (select 1 from assignments where ma = '7.1') then raise exception 'FAIL 12a: xóa mất bài đã có bài nộp'; end if;
  if exists (select 1 from assignments where ma = '9.1') then raise exception 'FAIL 12b: chưa xóa bài quá 30 ngày'; end if;
  raise notice 'OK 12: làm sạch % mục, giữ bài đã có bài nộp', r->>'so_muc';
end $$;

-- ---------- 13. HS không gọi được hàm làm sạch ----------
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000b1', true);
do $$ begin
  begin perform gv_lam_sach_thung_rac(); raise exception 'FAIL 13';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; raise notice 'OK 13: học sinh bị chặn hàm của giáo viên'; end;
end $$;

-- =====================================================================
-- 14–21. PHÂN QUYỀN THEO LỚP (005): Cô B chỉ phụ trách 6A2
-- =====================================================================
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a2', true);
do $$ begin
  if exists (select 1 from classes where ten_lop = '6A1') then raise exception 'FAIL 14: GV thấy lớp không phụ trách'; end if;
  if not exists (select 1 from classes where ten_lop = '6A2') then raise exception 'FAIL 14b: GV không thấy lớp mình'; end if;
  raise notice 'OK 14: GV chỉ thấy lớp mình phụ trách';
end $$;

do $$ begin
  if exists (select 1 from profiles where ma_hs = 'HS001') then raise exception 'FAIL 15: GV thấy HS lớp khác'; end if;
  if not exists (select 1 from profiles where ma_hs = 'HS002') then raise exception 'FAIL 15b: GV không thấy HS lớp mình'; end if;
  if exists (select 1 from submissions s join profiles p on p.id = s.student_id where p.ma_hs = 'HS001') then raise exception 'FAIL 15c'; end if;
  if (select count(*) from submissions) <> 0 then raise exception 'FAIL 15d: GV thấy bài nộp lớp khác'; end if;
  if exists (select 1 from v_bai_hoc_sinh where ma_hs = 'HS001') then raise exception 'FAIL 15e: view lộ HS lớp khác'; end if;
  raise notice 'OK 15: GV không thấy học sinh / bài nộp / view của lớp khác';
end $$;

-- 16. GV không chấm được bài lớp khác (kể cả gọi thẳng hàm)
do $$ declare r jsonb; v_sub uuid; begin
  reset role; select id into v_sub from submissions limit 1; set local role authenticated;
  perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a2', true);
  r := gv_luu_diem(v_sub, 1, 'x', 'cham', null, true, null);
  if (r->>'ok')::boolean then raise exception 'FAIL 16: GV chấm được bài lớp khác'; end if;
  raise notice 'OK 16: GV không chấm được bài lớp khác (%)', r->>'loi';
end $$;

-- 17. GV không sửa được chương trình CHUNG, không sửa cài đặt
do $$ declare n int; begin
  update lessons set tieu_de = 'hack' where class_id is null; get diagnostics n = row_count;
  if n > 0 then raise exception 'FAIL 17: GV sửa được buổi chung'; end if;
  begin
    insert into lessons(curriculum_id, thu_tu, tieu_de) select curriculum_id, 'zz', 'x' from lessons limit 1;
    raise exception 'FAIL 17b: GV thêm được buổi chung';
  exception when insufficient_privilege then null; end;
  update app_settings set value = '9'::jsonb; get diagnostics n = row_count;
  if n > 0 then raise exception 'FAIL 17c: GV sửa được cài đặt'; end if;
  begin
    insert into class_teachers(class_id, teacher_id) select id, auth.uid() from classes limit 1;
    raise exception 'FAIL 17d: GV tự gán lớp';
  exception when insufficient_privilege then null; end;
  raise notice 'OK 17: GV chỉ xem chương trình chung, không sửa cài đặt, không tự gán lớp';
end $$;

-- 18. GV tạo được BẢN RIÊNG cho lớp mình, không tạo được cho lớp khác
do $$ declare v_l uuid; v_c2 uuid; v_c1 uuid; begin
  reset role;
  select id into v_c1 from classes where ten_lop='6A1'; select id into v_c2 from classes where ten_lop='6A2';
  select id into v_l from lessons where class_id is null and ghi_de_cua is null limit 1;
  set local role authenticated; perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a2', true);
  insert into lessons(curriculum_id, thu_tu, tieu_de, class_id, ghi_de_cua)
    select curriculum_id, thu_tu, 'Bản riêng 6A2', v_c2, id from lessons where id = v_l;
  begin
    insert into lessons(curriculum_id, thu_tu, tieu_de, class_id, ghi_de_cua)
      select curriculum_id, thu_tu, 'Bản riêng 6A1', v_c1, id from lessons where id = v_l;
    raise exception 'FAIL 18: GV tạo bản riêng cho lớp khác';
  exception when insufficient_privilege then null; end;
  raise notice 'OK 18: GV tạo bản riêng cho lớp mình, bị chặn với lớp khác';
end $$;

-- 19. GV đăng thông báo lớp mình được, lớp khác bị chặn
do $$ begin
  insert into announcements(class_id, noi_dung) select id, 'Lớp 6A2 nghỉ' from classes where ten_lop = '6A2';
  begin
    insert into announcements(class_id, noi_dung) select id, 'x' from classes where ten_lop = '6A1';
    -- không thấy lớp 6A1 nên select trả 0 dòng: thử bằng id thật
    reset role; set local role authenticated;
    perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a2', true);
    insert into announcements(class_id, noi_dung) values ((select c1 from t_ctx), 'x');
    raise exception 'FAIL 19: GV đăng thông báo lớp khác';
  exception when insufficient_privilege then null; end;
  raise notice 'OK 19: thông báo lớp chỉ cho lớp mình';
end $$;

-- 20. Thông báo "Em chưa làm được" chỉ gửi GV lớp đó (+ quản trị)
do $$ declare v_b uuid := '00000000-0000-0000-0000-0000000000a2'; begin
  reset role;
  delete from notifications where loai = 'chua_lam_duoc';
  insert into student_flags(assignment_id, student_id, chua_lam_duoc)
    select (select a71 from t_ctx), '00000000-0000-0000-0000-0000000000b1', true
    on conflict (assignment_id, student_id) do update set chua_lam_duoc = true, da_ho_tro = false;
  update student_flags set chua_lam_duoc = false where student_id = '00000000-0000-0000-0000-0000000000b1';
  update student_flags set chua_lam_duoc = true where student_id = '00000000-0000-0000-0000-0000000000b1';
  if exists (select 1 from notifications where user_id = v_b and loai = 'chua_lam_duoc') then raise exception 'FAIL 20: GV lớp khác nhận thông báo'; end if;
  if not exists (select 1 from notifications where user_id = '00000000-0000-0000-0000-0000000000a1' and loai = 'chua_lam_duoc') then raise exception 'FAIL 20b: quản trị không nhận thông báo'; end if;
  raise notice 'OK 20: thông báo chỉ tới GV phụ trách + quản trị';
end $$;

-- 21. GV bị khóa (deleted_at) không đọc được gì; GV thường không làm sạch thùng rác
do $$ begin
  set local role authenticated;
  perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a2', true);
  begin perform gv_lam_sach_thung_rac(); raise exception 'FAIL 21a';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  reset role; update profiles set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000a2';
  set local role authenticated;
  perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a2', true);
  if exists (select 1 from classes) or exists (select 1 from profiles where vai_tro = 'hoc_sinh') then raise exception 'FAIL 21: GV bị khóa vẫn đọc được'; end if;
  raise notice 'OK 21: GV bị khóa không đọc được dữ liệu; GV thường không làm sạch thùng rác';
end $$;

-- 22. (006) Học sinh: không đổi được chế độ mở buổi; chỉ thấy TÊN 1–2 buổi sắp mở, không đọc được nội dung
do $$ declare c uuid; r jsonb; n int; l uuid; begin
  reset role; select class_id into c from profiles where id = '00000000-0000-0000-0000-0000000000b1';
  set local role authenticated;
  perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000b1', true);
  r := gv_dat_che_do_mo(c, 'theo_lich');
  if (r->>'ok')::boolean then raise exception 'FAIL 22a: HS đổi được chế độ mở buổi'; end if;
  select count(*) into n from hs_buoi_sap_mo(5);
  if n > 3 then raise exception 'FAIL 22b: lộ quá nhiều buổi sắp mở (%)', n; end if;
  for l in select lesson_id from hs_buoi_sap_mo(2) loop
    if exists (select 1 from lessons where id = l) then raise exception 'FAIL 22c: HS đọc được nội dung buổi chưa mở'; end if;
  end loop;
  raise notice 'OK 22: HS không đổi chế độ mở; chỉ thấy tên % buổi sắp mở, không đọc được nội dung', n;
end $$;

-- 23. (006) Quản trị bật "Tự mở theo lịch" → buổi đã tới ngày học tự mở khi học sinh vào web
do $$ declare c uuid; r jsonb; l uuid; begin
  reset role; select class_id into c from profiles where id = '00000000-0000-0000-0000-0000000000b1';
  select lesson_id into l from class_lessons where class_id = c and ngay_hoc is not null order by ngay_hoc limit 1;
  update class_lessons set hien_thi = false where class_id = c and lesson_id = l;
  set local role authenticated;
  perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a1', true);
  r := gv_dat_che_do_mo(c, 'theo_lich');
  if not (r->>'ok')::boolean then raise exception 'FAIL 23a: quản trị không đổi được chế độ (%)', r; end if;
  reset role; update class_lessons set hien_thi = false where class_id = c and lesson_id = l;
  set local role authenticated;
  perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000b1', true);
  perform hs_tao_thong_bao_tu_dong();
  if not exists (select 1 from lessons where id = l) then raise exception 'FAIL 23b: buổi tới ngày chưa tự mở'; end if;
  raise notice 'OK 23: chế độ "tự mở theo lịch" mở buổi đã tới ngày học';
end $$;

-- 24. (006) Giáo viên không phụ trách lớp không đổi được chế độ mở buổi; ai cũng gọi được /api/song
do $$ declare c uuid; r jsonb; begin
  reset role; select class_id into c from profiles where id = '00000000-0000-0000-0000-0000000000b1';
  update profiles set deleted_at = null where id = '00000000-0000-0000-0000-0000000000a2';
  set local role authenticated;
  perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a2', true);
  r := gv_dat_che_do_mo(c, 'thu_cong');
  if (r->>'ok')::boolean then raise exception 'FAIL 24a: GV lớp khác đổi được chế độ mở buổi'; end if;
  reset role; set local role anon;
  if song() is null then raise exception 'FAIL 24b'; end if;
  raise notice 'OK 24: GV lớp khác bị chặn đổi chế độ mở; hàm song() gọi được';
end $$;

rollback;
