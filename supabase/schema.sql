-- ============================================================================
-- WIE HackEarth 2.0 (2026) · Supabase Production Database Schema
-- Run this script in: Supabase Dashboard > SQL Editor > New query > Run
-- ============================================================================

-- 1. Main Registrations Table
create table if not exists registrations (
  id                   uuid primary key default gen_random_uuid(),
  team_number          serial unique,                   -- sequential team counter: 1, 2, 3...
  team_id              text unique,                     -- zero-padded 3-digit team ID: '001', '002', etc.
  reg_code             text unique not null,            -- e.g. HE26-K7M2QX (printed on RSVP QR pass)
  status               text not null default 'paid',    -- paid | pending
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
  members              jsonb not null,                  -- [{name,email,gender,phone,rollNumber,role,present}]
  amount_paise         integer not null,
  is_all_female        boolean not null default false,
  need_stay            boolean not null default false,
  stay_count           integer not null default 0,
  stay_fee_paise       integer not null default 0,
  
  -- Paytm & UPI Payment Audit Columns
  paytm_txn_id         text,                            -- Official Paytm Transaction ID
  utr_number           text,                            -- 12-digit UPI UTR / Bank Reference Number
  payment_screenshot   text,                            -- Public URL to receipt screenshot in Supabase storage
  
  -- Legacy / Reference Fields
  razorpay_order_id    text,                            -- 'paytm_' || reg_code
  razorpay_payment_id  text,                            -- Primary transaction reference
  paid_at              timestamptz,
  email_sent_at        timestamptz,
  
  -- Entry Desk Scanner & Attendance Columns
  checked_in           boolean not null default false,
  checked_in_at        timestamptz,
  checked_in_by        text,                            -- Name of organiser who checked them in at the desk
  created_at           timestamptz not null default now()
);

-- Indexes for lightning-fast queries and deduplication checks
create index if not exists registrations_team_key_idx     on registrations (team_name_key);
create index if not exists registrations_leader_email_idx on registrations (leader_email);
create index if not exists registrations_team_id_idx      on registrations (team_id);
create index if not exists registrations_team_number_idx  on registrations (team_number);
create index if not exists registrations_reg_code_idx     on registrations (reg_code);
create index if not exists registrations_paytm_txn_idx    on registrations (paytm_txn_id);
create index if not exists registrations_utr_idx          on registrations (utr_number);

-- 2. Round 1 Qualified Shortlist Table (Unstop Leaders)
create table if not exists shortlist (
  email           text primary key,   -- lower-case email
  team_name       text,
  unstop_team_id  text
);

-- 3. Row Level Security (RLS)
-- Lock both tables so only server-side service-role requests can read/write
alter table registrations enable row level security;
alter table shortlist     enable row level security;

-- 4. Safe Migration Columns (if table already exists in your Supabase project)
create sequence if not exists registrations_team_number_seq start 1;
alter table registrations add column if not exists team_number integer default nextval('registrations_team_number_seq');
alter table registrations add column if not exists team_id text;
alter table registrations add column if not exists paytm_txn_id text;
alter table registrations add column if not exists utr_number text;
alter table registrations add column if not exists payment_screenshot text;
alter table registrations add column if not exists checked_in_by text;
alter table registrations add column if not exists emergency_name text;
alter table registrations add column if not exists emergency_relation text;
alter table registrations add column if not exists emergency_phone text;

-- 5. Supabase Storage: 'payment-proofs' Bucket Setup
-- Create the public storage bucket for payment screenshots if not already present
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do nothing;

-- Storage Security Policy: Public read access for organizer inspection
drop policy if exists "Public receipts read access" on storage.objects;
create policy "Public receipts read access"
  on storage.objects for select
  using (bucket_id = 'payment-proofs');

-- Storage Security Policy: Allow server service-role upload access
drop policy if exists "Service role receipts write access" on storage.objects;
create policy "Service role receipts write access"
  on storage.objects for insert
  with check (bucket_id = 'payment-proofs');
