# Setup Supabase untuk WebWarung

## LANGKAH 1: Setup Database di Supabase Dashboard

### 1.1 Masuk ke Supabase Dashboard
1. Buka https://app.supabase.com
2. Login dengan email Anda
3. Pilih project "lmrqucodhdqryszxhwbo"

### 1.2 Buat Tables dan Setup Struktur
Ikuti langkah ini di Supabase SQL Editor:

1. Buka **SQL Editor** di sidebar kiri
2. Klik **"New Query"**
3. Copy-paste seluruh SQL dari file `SUPABASE_SETUP.sql`
4. Klik **"Run"** (Ctrl+Enter)

Atau jalankan SQL berikut secara bertahap:

```sql
-- 1. ENABLE EXTENSIONS
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

-- 4. ENABLE ROW LEVEL SECURITY
alter table public.dishes enable row level security;
alter table public.settings enable row level security;

-- 5. CREATE POLICIES - DISHES (PUBLIC READ)
create policy "allow_read_dishes" on public.dishes
  for select using (true);

-- 6. CREATE POLICIES - DISHES (ADMIN MODIFY)
create policy "allow_admin_modify_dishes" on public.dishes
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 7. CREATE POLICIES - SETTINGS (PUBLIC READ)
create policy "allow_read_settings" on public.settings
  for select using (true);

-- 8. CREATE POLICIES - SETTINGS (ADMIN MODIFY)
create policy "allow_admin_modify_settings" on public.settings
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 9. INSERT INITIAL SETTINGS
insert into public.settings (id, whatsapp_number) 
  values ('1', '6281234567890')
  on conflict (id) do nothing;

-- 10. INSERT INITIAL DISHES DATA (Optional - kalau ingin data sample)
insert into public.dishes (name, description, price, category, image_url, is_bestseller, is_available) values
  ('Nasi Ayam Bakar', 'Ayam bakar bumbu rahasia, nasi hangat, lalapan & sambal terasi.', 28000, 'Menu Utama', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', true, true),
  ('Soto Ayam Kampung', 'Kuah bening gurih dengan suwiran ayam, soun, telur & koya.', 22000, 'Menu Utama', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', true, true),
  ('Nasi Goreng Kampung', 'Nasi goreng wangi dengan telur mata sapi dan kerupuk.', 20000, 'Menu Utama', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', false, true),
  ('Tempe Mendoan', 'Tempe tipis berbalut tepung berbumbu, digoreng hangat.', 12000, 'Camilan', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', false, true),
  ('Es Teh Kampung', 'Teh melati harum, disajikan dingin dengan gula asli.', 6000, 'Minuman', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', false, true),
  ('Es Jeruk Peras', 'Jeruk segar pilihan, manis dan menyegarkan.', 9000, 'Minuman', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', true, true)
on conflict do nothing;
```

### 1.3 Setup Authentication
1. Buka **Authentication** di sidebar
2. Klik **"Providers"**
3. Pastikan **"Email"** sudah enabled

### 1.4 Buat Admin User
1. Buka **Authentication** > **Users**
2. Klik **"Invite user"**
3. Masukkan email: `admin@gmail.com`
4. Klik **"Send invite"**

Atau setup manual:
1. Di **Authentication** > **Users**, klik **"Add user"**
2. Email: `admin@gmail.com`
3. Password: `segogoreng1`
4. Klik **"Create user"**

### 1.5 Setup File Storage untuk Gambar
1. Buka **Storage** di sidebar
2. Klik **"Create new bucket"**
3. Name: `dishes`
4. Pilih **"Public"** (agar gambar bisa diakses publik)
5. Klik **"Create bucket"**

6. Di bucket "dishes", klik **"Policies"**
7. Tambahkan policy:
   - **SELECT**: Public (semua bisa baca)
   - **INSERT**: Authenticated only (hanya admin yang upload)

## LANGKAH 2: Setup Project React

Sudah saya lakukan:
- ✅ Install `@supabase/supabase-js`
- ✅ Membuat file `.env.local` dengan credentials
- ✅ Update `App.tsx` untuk menggunakan Supabase
- ✅ Real-time updates sudah setup

## LANGKAH 3: Testing Aplikasi

Jalankan dev server:
```bash
npm run dev
```

1. Akses aplikasi di http://localhost:5173
2. Klik icon Settings di footer untuk buka admin panel
3. Login dengan:
   - Email: `admin@gmail.com`
   - Password: `segogoreng1`
4. Test fitur:
   - ✅ Tambah menu baru
   - ✅ Edit menu
   - ✅ Hapus menu
   - ✅ Ubah nomor WhatsApp
   - ✅ Real-time updates

## LANGKAH 4: Troubleshooting

### Masalah: Login tidak bekerja
- Pastikan admin user sudah dibuat di Supabase
- Check email/password benar

### Masalah: Data tidak muncul
- Check RLS policies di Supabase
- Verify tables sudah dibuat

### Masalah: Real-time tidak bekerja
- Check Realtime enabled di Supabase project settings
- Buka **Project Settings** > **API** > pastikan **Realtime** aktif

## File yang Sudah Dimodifikasi:
- `.env.local` - Credentials Supabase
- `src/App.tsx` - Integrasi Supabase + real-time
- `src/lib/supabase.ts` - Supabase client setup
- `src/lib/api.ts` - API helper functions
- `SUPABASE_SETUP.sql` - SQL queries untuk setup

Next step: Jalankan SQL queries di Supabase, kemudian test aplikasinya!
