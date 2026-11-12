-- ======================================================================
-- 09_restart_rank.sql : (1) ปุ่ม Restart ของพนักงาน  (2) อันดับตามคะแนนรวม (เลิกแข่งตามเวลา)
-- รันใน Supabase > SQL Editor (รันซ้ำได้ปลอดภัย: create ... if not exists / create or replace)
--
-- ต้องรันหลัง 01 → 02 (ฉบับล่าสุด) → 03 → 06 → 08
-- ไฟล์นี้ "ไม่ลบข้อมูลของใครทันที" เพียงสร้างตารางประวัติ + เปลี่ยนฟังก์ชัน
-- ข้อมูลจะถูกล้างเมื่อพนักงานกด Restart ในแอปเท่านั้น (และเก็บสำเนาไว้ใน restart_log)
--
-- หมายเหตุสำคัญ: ถ้าในอนาคตรัน 02_functions.sql ซ้ำ
--   - get_rank จะกลับเป็นแบบเรียงตามเวลา และสิทธิ์ของฟังก์ชันใน 08/09 จะถูก revoke
--   - ให้รัน 08_trainer_scan.sql และ 09_restart_rank.sql ซ้ำอีกครั้งหลังจากนั้น
-- ======================================================================

-- ----------------------------------------------------------------------
-- 1) ประวัติการ Restart (หน้าเว็บอ่านไม่ได้ ใช้ดูใน Table Editor เมื่อมีข้อโต้แย้ง)
--    details = สำเนาผลการผ่านก่อนล้าง [{station_code, passed_at, bonus_points, trainer_emp_no}]
-- ----------------------------------------------------------------------
create table if not exists public.restart_log (
  id            bigint generated always as identity primary key,
  emp_no        text not null references public.employees(emp_no)
                  on update cascade on delete cascade,
  restarted_at  timestamptz not null default now(),
  total_points  int  not null,
  passed_count  int  not null,
  details       jsonb not null
);
create index if not exists restart_log_emp_idx on public.restart_log (emp_no, restarted_at desc);
alter table public.restart_log enable row level security;
revoke all on public.restart_log from anon, authenticated;

-- ----------------------------------------------------------------------
-- 2) Restart: พนักงานล้างผลของตัวเองเพื่อเริ่มเล่นใหม่
--    เงื่อนไข: ใส่ PIN ถูก และผ่านครบทุกสถานีแล้ว (ไม่ครบ -> NOT_ALL_PASSED ไม่ลบอะไร)
--    ทำงาน: เก็บสำเนาลง restart_log -> ลบผลการผ่านของคนนี้ (คะแนนเพิ่มหายไปด้วย)
--           -> คนนี้หายจากหน้า Rank เพราะ Rank แสดงเฉพาะคนที่ผ่านอย่างน้อย 1 สถานี
--    คืนข้อมูล Passport ใหม่ (เหมือน passport_login) + archived_points
-- ----------------------------------------------------------------------
create or replace function public.passport_restart(p_emp_no text, p_pin text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_emp     text := upper(trim(p_emp_no));
  v_err     jsonb;
  v_total   int;
  v_passed  int;
  v_points  int;
  v_details jsonb;
begin
  v_err := public._check_pin(v_emp, p_pin);   -- ล็อกแถวพนักงาน กันกดซ้อนสองครั้ง
  if v_err is not null then
    return v_err;
  end if;

  select count(*)::int into v_total from public.stations;

  select count(*)::int,
         coalesce(sum(c.bonus_points), 0)::int,
         coalesce(jsonb_agg(jsonb_build_object(
                    'station_code', c.station_code, 'passed_at', c.passed_at,
                    'bonus_points', c.bonus_points, 'trainer_emp_no', c.trainer_emp_no)
                  order by c.station_code), '[]'::jsonb)
    into v_passed, v_points, v_details
    from public.completions c
   where c.emp_no = v_emp;

  if v_total = 0 or v_passed < v_total then
    return jsonb_build_object('ok', false, 'error', 'NOT_ALL_PASSED',
                              'passed_count', v_passed, 'total', v_total);
  end if;

  insert into public.restart_log (emp_no, total_points, passed_count, details)
  values (v_emp, v_points, v_passed, v_details);

  delete from public.completions where emp_no = v_emp;

  return public._passport_payload(v_emp)
         || jsonb_build_object('restarted', true, 'archived_points', v_points);
end $$;

-- ----------------------------------------------------------------------
-- 3) get_rank: จัดอันดับตามคะแนนรวมอย่างเดียว (เลิกแท็บ "ครบก่อน"/เวลา)
--    - คะแนนเท่ากัน = อันดับเดียวกัน (dense: 1,1,2,3,3,4)
--    - ในกลุ่มคะแนนเท่ากัน เรียงคนที่ผ่านล่าสุด "เร็วกว่า" ขึ้นก่อน (completions.passed_at)
--    - ยังรับพารามิเตอร์ p_sort เพื่อให้หน้าเว็บเวอร์ชันเก่าเรียกได้ แต่ไม่ใช้แล้ว
--    - ยังแสดงเฉพาะคนที่ผ่านอย่างน้อย 1 สถานี; อันดับเป็น "อันดับรวม" แม้มีการค้นหา
-- ----------------------------------------------------------------------
create or replace function public.get_rank(
  p_sort text default 'points', p_search text default null, p_limit int default 100)
returns jsonb
language sql stable security definer set search_path = public as $$
  with st as (select count(*)::int as n from public.stations),
  agg as (
    select e.emp_no, e.name_th, e.surname_th, e.dept_code,
           count(*)::int                         as passed_count,
           coalesce(sum(c.bonus_points), 0)::int as points,
           max(c.passed_at)                      as last_passed_at
      from public.employees e
      join public.completions c on c.emp_no = e.emp_no
     group by e.emp_no
  ),
  scored as (
    select a.*, (a.passed_count = st.n) as completed
      from agg a cross join st
  ),
  ranked as (
    select s.*,
           dense_rank() over (order by s.points desc)::int as rank,
           row_number() over (order by s.points desc, s.last_passed_at asc, s.emp_no)::int as ord
      from scored s
  )
  select jsonb_build_object(
    'ok', true,
    'total_ranked', (select count(*) from ranked),
    'rows', coalesce((
      select jsonb_agg(to_jsonb(x) - 'ord' order by x.ord)
        from (
          select r.rank, r.ord, r.emp_no,
                 trim(coalesce(r.name_th, '') || ' ' || coalesce(r.surname_th, '')) as name,
                 r.dept_code, r.points, r.passed_count, r.completed, r.last_passed_at
            from ranked r
           where coalesce(p_search, '') = ''
              or r.emp_no ilike '%' || p_search || '%'
              or (coalesce(r.name_th, '') || ' ' || coalesce(r.surname_th, '')) ilike '%' || p_search || '%'
           order by r.ord
           limit least(greatest(coalesce(p_limit, 100), 1), 500)
        ) x
    ), '[]'::jsonb)
  );
$$;

-- ----------------------------------------------------------------------
-- 4) สิทธิ์: เปิดให้หน้าเว็บเรียกได้เฉพาะ passport_restart (get_rank เดิมมีสิทธิ์อยู่แล้ว)
-- ----------------------------------------------------------------------
revoke execute on function public.passport_restart(text, text) from public, anon, authenticated;
grant  execute on function public.passport_restart(text, text) to anon, authenticated;

notify pgrst, 'reload schema';

-- ======================================================================
-- ตรวจผลหลังรัน (รันแยกทีละ query):
--   (ก) ต้องได้ 2 แถว และ anon_can_run = true ทั้งคู่
--     select p.proname, has_function_privilege('anon', p.oid, 'execute') as anon_can_run
--       from pg_proc p where p.pronamespace = 'public'::regnamespace
--        and p.proname in ('passport_restart', 'get_rank') order by 1;
--   (ข) ต้องได้ ok = true
--     select public.get_rank('points', null, 5) ->> 'ok';
--   (ค) หน้าเว็บอ่านตารางประวัติไม่ได้ (ต้องได้ false):
--     select has_table_privilege('anon', 'public.restart_log', 'select');
-- ======================================================================
