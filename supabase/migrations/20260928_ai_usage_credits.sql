-- Applied to project annyogfzxzznyzkzlodx on 28 Sept 2026 (migration "ai_usage_credits").
create table if not exists public.ai_usage (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null,
  model text,
  plan text not null default 'free',
  credits integer not null default 0,
  prompt_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cached boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_user_day on public.ai_usage (user_id, created_at desc);
alter table public.ai_usage enable row level security;
drop policy if exists "read own ai usage" on public.ai_usage;
create policy "read own ai usage" on public.ai_usage for select to authenticated
  using (user_id = (select auth.uid())
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create or replace view public.ai_usage_daily
with (security_invoker = true) as
select date_trunc('day', created_at)::date as day, plan,
       count(distinct user_id) as users, count(*) as calls, sum(credits) as credits,
       sum(prompt_tokens) as prompt_tokens, sum(output_tokens) as output_tokens,
       count(*) filter (where cached) as cached_calls
from public.ai_usage group by 1, 2;
