# Sistem Registrasi Sertifikasi Kampus

Aplikasi web untuk manajemen pendaftaran program sertifikasi kampus dengan konsep marketplace. Dibangun menggunakan React, TypeScript, Vite, Tailwind CSS v3, dan Supabase.

## Fitur Utama

- **Landing Page Public**: Menampilkan daftar program sertifikasi yang tersedia
- **Autentikasi via NIM**: Login dan Register menggunakan Nomor Induk Mahasiswa (NIM)
- **Dashboard Mahasiswa**: Pendaftaran program dan melihat status pendaftaran
- **Dashboard Admin**: Mengelola program, memverifikasi pendaftaran, dan mengunggah sertifikat
- **Unduh Sertifikat**: Mahasiswa dapat mengunduh sertifikat langsung jika pendaftarannya telah disetujui (Approved)
- **Export Data**: Admin dapat mengekspor data pendaftaran ke file CSV

## Teknologi yang Digunakan

- React (Vite) + TypeScript
- Tailwind CSS v3 (untuk styling modern)
- React Router DOM (untuk routing)
- React Hook Form + Zod (untuk form dan validasi)
- Supabase (PostgreSQL Database, Auth, dan Storage)
- Lucide React (untuk ikon)
- React Hot Toast (untuk notifikasi)

## Persiapan Awal (Supabase)

1. Buat project baru di [Supabase](https://supabase.com/)
2. Buka menu **SQL Editor** di dashboard Supabase
3. Copy isi dari file `supabase/schema.sql` dan jalankan (RUN) di SQL Editor tersebut. Script ini akan:
   - Membuat tabel `users`, `programs`, dan `registrations`
   - Mengatur Row Level Security (RLS)
   - Membuat storage bucket `certificates`
   - Menambahkan beberapa data dummy program
4. Buka menu **Authentication > Providers**
   - Pastikan Email provider aktif
   - **Matikan (Disable)** opsi "Confirm email" agar mahasiswa bisa langsung login setelah mendaftar dengan email dummy (NIM@kampus.com)
5. Buka menu **Project Settings > API**
   - Salin **Project URL** dan **anon public key**

## Instalasi dan Menjalankan Proyek Lokal

1. Clone atau buka folder project ini di terminal
2. Install semua dependensi:
   ```bash
   npm install
   ```
3. Buka file `.env` di root project dan masukkan kredensial Supabase Anda:
   ```env
   VITE_SUPABASE_URL=https://<project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-public-key>
   ```
4. Jalankan aplikasi di mode development:
   ```bash
   npm run dev
   ```
5. Buka browser di `http://localhost:5173`

## Cara Membuat Akun Admin Pertama

1. Pergi ke halaman Register (`/register`) dan daftar akun seperti biasa (misal: NIM `admin001`, Nama `Administrator`)
2. Buka Supabase Dashboard > **Table Editor** > tabel `users`
3. Cari baris user yang baru Anda daftarkan tersebut
4. Ubah kolom `role` dari `student` menjadi `admin`
5. Logout dari aplikasi dan Login kembali. Anda akan diarahkan ke Admin Dashboard.
