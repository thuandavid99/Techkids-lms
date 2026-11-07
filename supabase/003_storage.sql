-- =====================================================================
-- 003_storage.sql — KHO FILE (Supabase Storage)
-- 3 bucket RIÊNG TƯ: submissions (bài nộp), materials (tài liệu), assignment-files (file đề).
-- Học sinh KHÔNG truy cập bucket trực tiếp: mọi lượt tải lên/tải xuống đi qua
-- server của web (kiểm tra quyền + kiểm tra nội dung file) và đường dẫn ký ngắn hạn.
-- Chạy SAU 002. An toàn khi chạy lại.
-- Lưu ý: giới hạn dung lượng thật còn phụ thuộc gói Supabase (gói miễn phí giới hạn cỡ file).
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('submissions',      'submissions',      false, 10485760),   -- 10 MB
  ('materials',        'materials',        false, 52428800),   -- 50 MB
  ('assignment-files', 'assignment-files', false, 20971520)    -- 20 MB
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit;

-- Chỉ giáo viên được thao tác trực tiếp trên 3 bucket (ví dụ xem trong trang quản trị).
drop policy if exists lms_gv_all on storage.objects;
create policy lms_gv_all on storage.objects for all to authenticated
  using (bucket_id in ('submissions','materials','assignment-files') and public.is_teacher())
  with check (bucket_id in ('submissions','materials','assignment-files') and public.is_teacher());

-- Không có chính sách nào cho học sinh/anon → không đọc, không liệt kê, không ghi trực tiếp.
