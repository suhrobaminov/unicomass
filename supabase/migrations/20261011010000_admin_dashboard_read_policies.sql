-- Restrict administrative reads to the site owner's authenticated email.
-- Safe to re-run. The admin can read academic profile summaries and feedback only.
alter table public.profiles enable row level security;
alter table public.site_feedback enable row level security;

drop policy if exists "Site admin can read feedback" on public.site_feedback;
create policy "Site admin can read feedback"
  on public.site_feedback
  for select
  to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'suhrobaminov067@gmail.com');

drop policy if exists "Site admin can read user profiles" on public.profiles;
create policy "Site admin can read user profiles"
  on public.profiles
  for select
  to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'suhrobaminov067@gmail.com');

grant select on public.site_feedback to authenticated;
grant select on public.profiles to authenticated;
