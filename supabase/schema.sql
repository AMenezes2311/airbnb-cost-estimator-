create extension if not exists pgcrypto;

create table if not exists public.trips (
	id uuid primary key default gen_random_uuid(),
	check_in date not null,
	check_out date not null,
	guests integer not null check (guests >= 1),
	duvets integer not null default 0 check (duvets >= 0),
	cleanings integer not null default 1 check (cleanings >= 1),
	apartment text not null check (apartment in ('A407', 'B403', 'B404', 'B405', 'C204')),
	created_at timestamptz not null default now(),
	constraint trips_date_range check (check_out >= check_in)
);

create index if not exists trips_created_at_idx on public.trips (created_at desc);
create index if not exists trips_apartment_idx on public.trips (apartment);

alter table public.trips enable row level security;

drop policy if exists "Public read trips" on public.trips;
drop policy if exists "Public insert trips" on public.trips;
drop policy if exists "Public update trips" on public.trips;
drop policy if exists "Public delete trips" on public.trips;

create policy "Public read trips"
on public.trips
for select
to anon, authenticated
using (true);

create policy "Public insert trips"
on public.trips
for insert
to anon, authenticated
with check (true);

create policy "Public update trips"
on public.trips
for update
to anon, authenticated
using (true)
with check (true);

create policy "Public delete trips"
on public.trips
for delete
to anon, authenticated
using (true);
