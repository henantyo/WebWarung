-- ============================================
-- SQL SETUP UNTUK SUPABASE WEBWARUNG
-- ============================================

-- 1. ENABLE REQUIRED EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. CREATE DISHES TABLE
create table if not exists public.dishes (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text not null,
  price integer not null,
  category text not null,
  image_url text,
  is_bestseller boolean default false,
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CREATE SETTINGS TABLE
create table if not exists public.settings (
  id text primary key default '1',
  whatsapp_number text not null default '6281234567890',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. CREATE STORAGE BUCKET
insert into storage.buckets (id, name, public) values ('dishes', 'dishes', true) on conflict do nothing;

-- 5. SET ROW LEVEL SECURITY (RLS) - DISHES TABLE
alter table public.dishes enable row level security;

-- Policy: Anyone can view dishes
create policy "allow_read_dishes" on public.dishes
  for select using (true);

-- Policy: Only authenticated admin can modify
create policy "allow_admin_modify_dishes" on public.dishes
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 6. SET ROW LEVEL SECURITY (RLS) - SETTINGS TABLE
alter table public.settings enable row level security;

-- Policy: Anyone can view settings
create policy "allow_read_settings" on public.settings
  for select using (true);

-- Policy: Only authenticated admin can modify
create policy "allow_admin_modify_settings" on public.settings
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 7. SET STORAGE PERMISSIONS
create policy "allow_public_read_dishes" on storage.objects
  for select using (bucket_id = 'dishes');

create policy "allow_admin_upload_dishes" on storage.objects
  for insert with check (
    bucket_id = 'dishes' and auth.role() = 'authenticated'
  );

-- 8. INSERT INITIAL SETTINGS
insert into public.settings (id, whatsapp_number) 
  values ('1', '6281234567890')
  on conflict (id) do nothing;

-- 9. INSERT INITIAL DISHES DATA
insert into public.dishes (name, description, price, category, image_url, is_bestseller, is_available) values
  ('Nasi Ayam Bakar', 'Ayam bakar bumbu rahasia, nasi hangat, lalapan & sambal terasi.', 28000, 'Menu Utama', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', true, true),
  ('Soto Ayam Kampung', 'Kuah bening gurih dengan suwiran ayam, soun, telur & koya.', 22000, 'Menu Utama', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', true, true),
  ('Nasi Goreng Kampung', 'Nasi goreng wangi dengan telur mata sapi dan kerupuk.', 20000, 'Menu Utama', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', false, true),
  ('Tempe Mendoan', 'Tempe tipis berbalut tepung berbumbu, digoreng hangat.', 12000, 'Camilan', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', false, true),
  ('Es Teh Kampung', 'Teh melati harum, disajikan dingin dengan gula asli.', 6000, 'Minuman', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', false, true),
  ('Es Jeruk Peras', 'Jeruk segar pilihan, manis dan menyegarkan.', 9000, 'Minuman', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', true, true)
on conflict do nothing;
