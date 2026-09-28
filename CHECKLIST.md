## ✅ VERIFIKASI SETUP SUPABASE

Sebelum mulai, pastikan sudah selesai:

### Di Supabase Dashboard:
- [ ] SQL Setup sudah dijalankan (tidak ada error)
- [ ] Admin user `admin@gmail.com` sudah dibuat
- [ ] Tabel `dishes` sudah ada (cek di Table Editor)
- [ ] Tabel `settings` sudah ada
- [ ] Realtime enabled di Project Settings > API
- [ ] Storage bucket `dishes` sudah dibuat

### Di Aplikasi React:
- [ ] File `.env.local` exist dengan credentials
- [ ] `npm install` sudah dijalankan
- [ ] `npm run build` berhasil (tidak ada error)
- [ ] `npm run dev` berjalan di http://localhost:5173

### Testing Aplikasi:
- [ ] Halaman utama muncul dengan baik
- [ ] Klik Settings icon → Admin login panel muncul
- [ ] Login berhasil dengan admin@gmail.com / segogoreng1
- [ ] Admin panel menampilkan daftar menu
- [ ] Bisa tambah menu baru
- [ ] Bisa edit menu
- [ ] Bisa hapus menu
- [ ] Bisa update nomor WhatsApp
- [ ] Menu berubah real-time (jika edit dari tab lain, tab pertama update otomatis)

---

## Jika Semua ✅ Maka Siap Produksi!

Next steps:
1. Ganti data dummy dengan menu asli Warung Bu Siti
2. Upload foto produk ke storage bucket
3. Customize branding/warna sesuai keinginan
4. Deploy ke hosting (Vercel, Netlify, dsb)

Pertanyaan? Ada bug? Tanya saja!
