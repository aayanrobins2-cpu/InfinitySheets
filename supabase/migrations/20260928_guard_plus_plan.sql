-- user_settings.data.plan ('free' | 'plus') is server-owned, like profiles.role.
-- RLS lets a student upsert their own settings row, so without this anyone
-- could write {"plan": "plus"} and get unlimited AI credits (ai-chat reads the
-- plan from here) and every Plus feature for free. Only the service role (the
-- payment webhook / admin tooling) may change it; client writes keep the
-- stored value.

create or replace function public.user_settings_guard_plan()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if current_setting('request.jwt.claim.role', true) = 'service_role' or auth.uid() is null then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.data := jsonb_set(coalesce(new.data, '{}'::jsonb), '{plan}', '"free"'::jsonb);
  else
    new.data := jsonb_set(coalesce(new.data, '{}'::jsonb), '{plan}',
                          coalesce(old.data -> 'plan', '"free"'::jsonb));
  end if;
  return new;
end; $$;

drop trigger if exists user_settings_guard_plan on public.user_settings;
create trigger user_settings_guard_plan before insert or update on public.user_settings
  for each row execute function public.user_settings_guard_plan();
