create extension if not exists "uuid-ossp";

create table if not exists public.page_insights (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default timezone('utc', now()),
  url text,
  title text,
  summary text,
  key_points jsonb default '[]'::jsonb,
  tasks jsonb default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb
);

create index if not exists page_insights_created_at_idx on public.page_insights (created_at desc);
create index if not exists page_insights_url_idx on public.page_insights using gin (to_tsvector('english', coalesce(url, '')));
