-- Restrict administrative reads to the site owner's authenticated email.
-- This migration deliberately exposes profile summaries and anonymous feedback only.
create policy "Site admin can read feedback"
  on public.site_feedback
  for select
  to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'suhrobaminov067@gmail.com');

create policy "Site admin can read user profiles"
  on public.profiles
  for select
  to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'suhrobaminov067@gmail.com');

grant select on public.site_feedback to authenticated;
grant select on public.profiles to authenticated;
