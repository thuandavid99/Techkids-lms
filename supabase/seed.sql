-- =====================================================================
-- seed.sql — DỮ LIỆU MẪU (TÙY CHỌN) để thử web khi chưa nhập PPCT thật.
-- Tạo: 1 chương trình "Python cơ bản (mẫu)" gồm 2 module, 12 buổi, vài bài tập;
--      2 lớp 6A1, 6A2 dùng chương trình đó, lịch học Thứ 2 + Thứ 5.
-- KHÔNG tạo học sinh (học sinh phải tạo trong web: Học sinh → Thêm một bạn,
-- vì cần tạo tài khoản đăng nhập).
-- Chạy SAU 004. Chạy lại sẽ bỏ qua nếu đã có chương trình mẫu.
-- Muốn xóa dữ liệu mẫu: vào web → Chương trình học → xóa chương trình; Quản lý lớp → xóa lớp.
-- =====================================================================
do $$
declare
  v_cur uuid; m1 uuid; m2 uuid; t_re uuid; t_lap uuid;
  lt_lt uuid; lt_bt uuid; lt_lt_th uuid; lt_ot uuid; lt_kt uuid; lt_ct uuid;
  c1 uuid; c2 uuid; l uuid; a uuid; i int;
  cat_slide uuid; cat_phieu uuid;
begin
  if exists (select 1 from curricula where ten = 'Python cơ bản (mẫu)') then
    raise notice 'Đã có dữ liệu mẫu, bỏ qua.'; return;
  end if;

  select id into lt_lt    from lesson_types where ten = 'Lý thuyết' limit 1;
  select id into lt_bt    from lesson_types where ten = 'Bài tập' limit 1;
  select id into lt_lt_th from lesson_types where ten = 'Lý thuyết + thực hành' limit 1;
  select id into lt_ot    from lesson_types where ten = 'Ôn tập' limit 1;
  select id into lt_kt    from lesson_types where ten = 'Kiểm tra' limit 1;
  select id into lt_ct    from lesson_types where ten = 'Contest' limit 1;
  select id into cat_slide from material_categories where ten = 'Slide' limit 1;
  select id into cat_phieu from material_categories where ten = 'Phiếu học tập' limit 1;

  insert into curricula(ten, mo_ta, nam_hoc) values ('Python cơ bản (mẫu)', 'Chương trình mẫu để thử hệ thống', '2026-2027') returning id into v_cur;
  insert into modules(curriculum_id, ten, thu_tu) values (v_cur, 'Module 1: Làm quen với Python', 'a0') returning id into m1;
  insert into modules(curriculum_id, ten, thu_tu) values (v_cur, 'Module 2: Cấu trúc điều khiển', 'a1') returning id into m2;
  insert into topics(module_id, ten, thu_tu) values (m2, 'Cấu trúc rẽ nhánh', 'a0') returning id into t_re;
  insert into topics(module_id, ten, thu_tu) values (m2, 'Vòng lặp', 'a1') returning id into t_lap;

  -- Lớp trước để trigger tự tạo tình trạng buổi cho lớp
  insert into classes(ten_lop, nam_hoc) values ('6A1', '2026-2027') returning id into c1;
  insert into classes(ten_lop, nam_hoc) values ('6A2', '2026-2027') returning id into c2;
  insert into class_curriculum(class_id, curriculum_id, ngay_bat_dau, cac_thu_trong_tuan)
  values (c1, v_cur, current_date - 21, '{1,4}'), (c2, v_cur, current_date - 14, '{2,5}');

  -- Module 1
  insert into lessons(curriculum_id, module_id, thu_tu, nhan_buoi, tieu_de, tom_tat, loai_id, noi_dung_kien_thuc)
  values (v_cur, m1, 'a0', '1', 'Làm quen với Python', 'Cài đặt, chạy chương trình đầu tiên.', lt_lt,
  E'## 1. Python là gì?\nPython là ngôn ngữ lập trình dễ học, dùng rộng rãi.\n\n## 2. Chương trình đầu tiên\n```python\nprint("Xin chào Python!")\n```\n')
  returning id into l;
  insert into materials(lesson_id, loai, tieu_de, nguon, url) values (l, cat_slide, 'Slide bài giảng Buổi 1', 'link', 'https://docs.python.org/3/tutorial/');
  insert into assignments(lesson_id, ma, tieu_de, de_bai, loai_nop) values (l, '1.1', 'Lệnh print()', E'Viết chương trình in ra tên của em và lớp của em trên 2 dòng.', 'code') returning id into a;

  insert into lessons(curriculum_id, module_id, thu_tu, nhan_buoi, tieu_de, tom_tat, loai_id, noi_dung_kien_thuc)
  values (v_cur, m1, 'a1', '2', 'Biến và kiểu dữ liệu', 'Học cách sử dụng biến và các kiểu dữ liệu trong Python.', lt_lt_th,
  E'## 1. Biến trong Python\nBiến là nơi lưu trữ dữ liệu trong chương trình.\n\n```python\nten = "Python"\ntuoi = 12\nprint(ten, tuoi)\n```\n')
  returning id into l;
  insert into assignments(lesson_id, ma, tieu_de, de_bai, loai_nop) values (l, '2.1', 'Tính chu vi và diện tích', E'Nhập chiều dài, chiều rộng hình chữ nhật. In ra chu vi và diện tích.', 'code');
  insert into assignments(lesson_id, ma, tieu_de, de_bai, loai_nop, bat_buoc) values (l, '2.2', 'Thử thách: đổi giây ra giờ-phút-giây', E'Bài nâng cao (tùy chọn).', 'code', false);

  insert into lessons(curriculum_id, module_id, thu_tu, nhan_buoi, tieu_de, loai_id)
  values (v_cur, m1, 'a2', '3', 'Nhập/xuất dữ liệu', lt_bt) returning id into l;
  insert into assignments(lesson_id, ma, tieu_de, de_bai, loai_nop) values (l, '3.1', 'Phiếu học tập buổi 3', 'Làm phiếu và nộp file ảnh chụp hoặc Word.', 'file');

  insert into lessons(curriculum_id, module_id, thu_tu, nhan_buoi, tieu_de, loai_id)
  values (v_cur, m1, 'a3', '4–5', 'Ôn tập module 1', lt_ot);
  insert into lessons(curriculum_id, module_id, thu_tu, nhan_buoi, tieu_de, loai_id)
  values (v_cur, m1, 'a4', '6', 'Kiểm tra module 1', lt_kt) returning id into l;
  insert into assignments(lesson_id, ma, tieu_de, loai_nop, he_so) values (l, '6.1', 'Bài kiểm tra module 1', 'ngoai_he_thong', 2);

  -- Module 2
  for i in 7..9 loop
    insert into lessons(curriculum_id, module_id, topic_id, thu_tu, nhan_buoi, tieu_de, loai_id)
    values (v_cur, m2, t_re, 'b' || i, i::text, 'Cấu trúc rẽ nhánh', case when i = 7 then lt_lt else lt_bt end) returning id into l;
    insert into assignments(lesson_id, ma, tieu_de, de_bai, loai_nop)
    values (l, i || '.1', case i when 7 then 'Kiểm tra số chẵn lẻ' when 8 then 'Xếp loại học lực' else 'Giải phương trình bậc nhất' end,
            'Đọc đề trong phiếu học tập.', 'ca_hai');
  end loop;
  insert into lessons(curriculum_id, module_id, topic_id, thu_tu, nhan_buoi, tieu_de, loai_id)
  values (v_cur, m2, t_lap, 'c0', '10–11', 'Vòng lặp for', lt_lt_th) returning id into l;
  insert into assignments(lesson_id, ma, tieu_de, loai_nop) values (l, '10.1', 'Vòng lặp for cơ bản', 'code');
  insert into lessons(curriculum_id, module_id, thu_tu, nhan_buoi, tieu_de, loai_id)
  values (v_cur, m2, 'c1', '12', 'Contest module 2', lt_ct);

  -- Ngày học: lùi về quá khứ để có dữ liệu thử; hạn nộp = ngày học + 7 ngày, 21:00 giờ VN
  update class_lessons cl set ngay_hoc = x.d
  from (select l2.id, current_date - 21 + (row_number() over (order by l2.thu_tu))::int * 3 as d
          from lessons l2 where l2.curriculum_id = v_cur) x
  where cl.lesson_id = x.id;
  update class_lessons set da_day = (ngay_hoc < current_date) where lesson_id in (select id from lessons where curriculum_id = v_cur);
  -- Ẩn các buổi chưa tới ngày học (học sinh chỉ thấy buổi đã mở)
  update class_lessons set hien_thi = (ngay_hoc <= current_date + 3) where lesson_id in (select id from lessons where curriculum_id = v_cur);

  insert into assignment_deadlines(assignment_id, class_id, han_nop)
  select a2.id, cl.class_id, ((cl.ngay_hoc + 7)::timestamp + time '21:00') at time zone 'Asia/Ho_Chi_Minh'
    from assignments a2 join class_lessons cl on cl.lesson_id = a2.lesson_id
   where a2.lesson_id in (select id from lessons where curriculum_id = v_cur)
  on conflict do nothing;

  insert into announcements(class_id, noi_dung) values (c1, 'Chào mừng các em đến với lớp Python! Nhớ đổi mật khẩu khi đăng nhập lần đầu nhé.');
  raise notice 'Đã tạo dữ liệu mẫu.';
end $$;
