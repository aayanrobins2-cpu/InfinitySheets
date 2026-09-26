-- Applied to project annyogfzxzznyzkzlodx on 26 Sept 2026 (migration "school_codes").
create table if not exists public.school_codes (
  code text primary key check (code = upper(code) and length(code) between 4 and 24),
  name text not null,
  board text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.school_codes enable row level security;
drop policy if exists "admins manage school codes" on public.school_codes;
create policy "admins manage school codes" on public.school_codes
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create or replace function public.redeem_school_code(p_code text)
returns table (code text, name text, board text, notes text)
language sql security definer set search_path = '' stable
as $$
  select s.code, s.name, s.board, s.notes from public.school_codes s
  where s.code = upper(trim(p_code)) and s.active limit 1;
$$;
revoke all on function public.redeem_school_code(text) from public, anon;
grant execute on function public.redeem_school_code(text) to authenticated;
