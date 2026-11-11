-- Run this once in Supabase > SQL Editor

create table if not exists registrations (
  id                   uuid primary key default gen_random_uuid(),
  team_number          serial unique,                   -- sequential team counter: 1, 2, 3...
  team_id              text unique,                     -- zero-padded 3-digit team ID: '001', '002', etc.
  reg_code             text unique not null,            -- e.g. HE26-K7M2QX (printed on QR)
  status               text not null default 'pending', -- pending | paid
  team_name            text not null,
  team_name_key        text not null,                   -- lower-case, for duplicate checks
  track                text not null,
  idea_title           text,
  college              text not null,
  city                 text,
  unstop_team_id       text,
  leader_name          text not null,
  leader_email         text not null,
  leader_phone         text not null,
  emergency_name       text,
  emergency_relation   text,
  emergency_phone      text,
  members              jsonb not null,                  -- [{name,email,gender,phone,rollNumber,role}]
  amount_paise         integer not null,
  is_all_female        boolean not null default false,
  need_stay            boolean not null default false,
  stay_count           integer not null default 0,
  stay_fee_paise       integer not null default 0,
  razorpay_order_id    text unique not null,
  razorpay_payment_id  text,
  paid_at              timestamptz,
  email_sent_at        timestamptz,
  -- used by the scanner site later
  checked_in           boolean not null default false,
  checked_in_at        timestamptz,
  checked_in_by        text,                            -- name of organiser who checked them in
  created_at           timestamptz not null default now()
);

create index if not exists registrations_team_key_idx on registrations (team_name_key);
create index if not exists registrations_leader_email_idx on registrations (leader_email);
create index if not exists registrations_team_id_idx on registrations (team_id);
create index if not exists registrations_team_number_idx on registrations (team_number);

-- Round 1 qualified teams (leader email as registered on Unstop)
create table if not exists shortlist (
  email           text primary key,   -- lower-case
  team_name       text,
  unstop_team_id  text
);

-- Lock both tables: only the server (service-role key) can read/write.
alter table registrations enable row level security;
alter table shortlist     enable row level security;

-- Safe column additions if migrating an existing table in Supabase
create sequence if not exists registrations_team_number_seq start 1;
alter table registrations add column if not exists team_number integer default nextval('registrations_team_number_seq');
alter table registrations add column if not exists team_id text;
alter table registrations add column if not exists checked_in_by text;
alter table registrations add column if not exists emergency_name text;
alter table registrations add column if not exists emergency_relation text;
alter table registrations add column if not exists emergency_phone text;
