-- videoed server schema (Supabase). Media never stored here.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(display_name) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text unique,
  plan text not null default 'free' check (plan in ('free','pro')),
  status text not null default 'active' check (status in ('active','trialing','past_due','canceled','incomplete','unpaid')),
  cancel_at_period_end boolean not null default false,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table public.stripe_events (id text primary key, type text not null, received_at timestamptz not null default now());

-- Edit list only (tracks, items, text, cues, asset metadata). No media bytes, no thumbnails.
create table public.project_backups (
  id uuid primary key,                         -- same id as the local project
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  doc jsonb not null check (pg_column_size(doc) <= 1048576),
  version integer not null default 1,
  updated_at timestamptz not null default now()
);
create index on public.project_backups (owner_id, updated_at desc);

create table public.usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('export','caption_minutes')),
  amount integer not null check (amount > 0),
  at timestamptz not null default now()
);
create index on public.usage_events (user_id, kind, at desc);

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.stripe_events enable row level security;
alter table public.project_backups enable row level security;
alter table public.usage_events enable row level security;

create policy profile_rw on public.profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy sub_read on public.subscriptions for select to authenticated using (user_id = auth.uid());
create policy own_backups on public.project_backups for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy own_usage_read on public.usage_events for select to authenticated using (user_id = auth.uid());
create policy own_usage_insert on public.usage_events for insert to authenticated with check (user_id = auth.uid());
