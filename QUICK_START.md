# 🚀 QUICK START - Setup Supabase WebWarung

## STEP 1: Setup di Supabase Dashboard (5 menit)

### 1️⃣ Buka Supabase
- Pergi ke https://app.supabase.com
- Login dengan email Anda
- Pilih project `lmrqucodhdqryszxhwbo`

### 2️⃣ Jalankan SQL Setup
Di menu sidebar, buka **SQL Editor** kemudian:
1. Klik **"New Query"**
2. Copy semua kode dari file `SUPABASE_SETUP.sql` 
3. Paste ke editor
4. Klik **"Run"** atau tekan Ctrl+Enter

✅ Jika berhasil akan muncul "Success"

### 3️⃣ Buat Admin User
Pilih **Authentication** > **Users** kemudian:
1. Klik **"Add user"** (tombol hijau)
2. Email: `admin@gmail.com`
3. Password: `segogoreng1`
4. Klik **"Create user"**

### 4️⃣ Enable Realtime (Penting!)
Buka **Project Settings** (icon gear di kiri bawah):
1. Pilih tab **API**
2. Scroll ke **Realtime** 
3. Pastikan toggle **ON** (hijau)

### 5️⃣ Setup Storage Bucket
Di sidebar, pilih **Storage** kemudian:
1. Klik **"Create new bucket"**
2. Bucket name: `dishes`
3. Pilih **Public** ✓
4. Klik **"Create bucket"**

✅ Selesai! Database sudah siap.

---

## STEP 2: Test Aplikasi React (1 menit)

Di terminal, jalankan:
```bash
cd /home/henantyo/Downloads/WebWarung
npm run dev
```

Buka browser: http://localhost:5173

---

## STEP 3: Test Admin Panel

1. Klik icon ⚙️ (Settings) di footer kanan
2. Login dengan:
   - Email: `admin@gmail.com`
   - Password: `segogoreng1`
3. Coba fitur:
   - ✅ Tambah menu → klik **"+ Tambah menu"**
   - ✅ Edit menu → klik **"Edit"** di tabel
   - ✅ Hapus menu → klik **"Hapus"**
   - ✅ Edit nomor WA → di **"Pengaturan WhatsApp"**

Jika semua berjalan lancar = **Success!** 🎉

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Login gagal | Cek email/password di Supabase Users |
| Menu tidak muncul | Cek tabel `dishes` sudah ada data |
| Real-time tidak update | Buka Project Settings > API > enable Realtime |
| Error CORS | Pastikan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` benar di `.env.local` |

---

## Catatan
- `.env.local` sudah dibuat dengan credentials Anda
- `App.tsx` sudah diupdate untuk Supabase
- **Jangan commit `.env.local` ke Git** (file sensitif!)
