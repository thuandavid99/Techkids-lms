-- =====================================================================
-- 008_khoa_ham.sql — Khóa các hàm SQL với người CHƯA đăng nhập (anon)
-- Sửa cảnh báo Supabase Security Advisor:
--   • "Public Can Execute SECURITY DEFINER Function"
--   • "Function Search Path Mutable" (hàm song)
-- Cách làm: bỏ quyền chạy hàm của PUBLIC và anon cho MỌI hàm trong schema public;
-- người đã đăng nhập (authenticated) giữ nguyên quyền như cũ (hàm nào trước đây chạy được thì vẫn chạy được).
-- Chỉ chừa hàm song() cho anon (trang /api/song dùng để giữ web thức).
-- Chạy sau 007. Chạy lại nhiều lần không sao. Nếu sau này chạy lại 004/005/006/007 → chạy lại file này.
-- =====================================================================

alter function public.song() set search_path = public;

do $$
declare
  f record;
  co_quyen boolean;
begin
  for f in
    select p.oid, p.oid::regprocedure as ten
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f'
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e') -- bỏ qua hàm của extension
  loop
    co_quyen := has_function_privilege('authenticated', f.oid, 'execute');
    execute format('revoke execute on function %s from public, anon', f.ten);
    if co_quyen then
      execute format('grant execute on function %s to authenticated', f.ten);
    end if;
    execute format('grant execute on function %s to service_role', f.ten);
  end loop;
end $$;

-- Hàm tạo SAU này cũng mặc định không cho anon/public chạy
alter default privileges in schema public revoke execute on functions from public, anon;

-- Chừa riêng hàm "báo còn sống"
grant execute on function public.song() to anon, authenticated;
