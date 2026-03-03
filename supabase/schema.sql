create extension if not exists pgcrypto;

create table if not exists public.trips (
	id uuid primary key default gen_random_uuid(),
	check_in date not null,
	check_out date not null,
	guests integer not null check (guests >= 1),
	duvets integer not null default 0 check (duvets >= 0),
	cleanings integer not null default 1 check (cleanings >= 1),
	apartment text not null check (apartment in ('A407', 'B403', 'B404', 'B405', 'C204')),
	user_id uuid not null references auth.users(id) on delete cascade,
	created_at timestamptz not null default now(),
	constraint trips_date_range check (check_out >= check_in)
);

create index if not exists trips_created_at_idx on public.trips (created_at desc);
create index if not exists trips_apartment_idx on public.trips (apartment);
create index if not exists trips_user_id_idx on public.trips (user_id);

alter table public.trips enable row level security;

drop policy if exists "Public read trips" on public.trips;
drop policy if exists "Public insert trips" on public.trips;
drop policy if exists "Public update trips" on public.trips;
drop policy if exists "Public delete trips" on public.trips;

create policy "Users read own trips"
on public.trips
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users insert own trips"
on public.trips
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users update own trips"
on public.trips
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users delete own trips"
on public.trips
for delete
to authenticated
using (auth.uid() = user_id);
