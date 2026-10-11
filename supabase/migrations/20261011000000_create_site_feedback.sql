-- Public feedback form: allow anonymous submissions, but never public reads.
create table if not exists public.site_feedback (
  id bigint generated always as identity primary key,
  category text not null check (category in (
    'Product suggestion',
    'Bug or technical issue',
    'University or scholarship data',
    'Design and usability',
    'Other feedback'
  )),
  message text not null check (char_length(trim(message)) between 10 and 3000),
  created_at timestamptz not null default now()
);

alter table public.site_feedback enable row level security;

revoke all on public.site_feedback from anon, authenticated;
grant insert (category, message) on public.site_feedback to anon, authenticated;
grant usage, select on sequence public.site_feedback_id_seq to anon, authenticated;

drop policy if exists "Anyone can submit feedback" on public.site_feedback;
create policy "Anyone can submit feedback"
  on public.site_feedback
  for insert
  to anon, authenticated
  with check (
    category in (
      'Product suggestion',
      'Bug or technical issue',
      'University or scholarship data',
      'Design and usability',
      'Other feedback'
    )
    and char_length(trim(message)) between 10 and 3000
  );
