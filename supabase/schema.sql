-- =============================================
-- Sistem Registrasi Sertifikasi Kampus
-- Supabase SQL Schema
-- Jalankan di Supabase SQL Editor
-- =============================================

-- 1. Tabel users (profil mahasiswa & admin)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nim TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel programs (program sertifikasi)
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  venue TEXT NOT NULL DEFAULT 'Online',
  price INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel registrations (pendaftaran mahasiswa)
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, program_id)
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin (bypasses RLS to avoid infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Users policies
CREATE POLICY "Anyone can view users"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Programs policies (public read, admin write)
CREATE POLICY "Anyone can view programs"
  ON public.programs FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert programs"
  ON public.programs FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update programs"
  ON public.programs FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete programs"
  ON public.programs FOR DELETE
  USING (public.is_admin());

-- Registrations policies
CREATE POLICY "Students can view own registrations"
  ON public.registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all registrations"
  ON public.registrations FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Students can insert own registrations"
  ON public.registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update registrations"
  ON public.registrations FOR UPDATE
  USING (public.is_admin());

-- =============================================
-- STORAGE: certificates bucket
-- =============================================
-- Buat bucket 'certificates' di Supabase Dashboard > Storage
-- Atau jalankan:

INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT DO NOTHING;

-- Storage policy: admin can upload
CREATE POLICY "Admins can upload certificates"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'certificates' AND
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Storage policy: anyone can download (public bucket)
CREATE POLICY "Anyone can view certificates"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificates');

-- Storage policy: admin can update/replace
CREATE POLICY "Admins can update certificates"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'certificates' AND
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- SEED DATA (Opsional - Sample Programs)
-- =============================================
INSERT INTO public.programs (title, description, date, venue, price) VALUES
  ('Sertifikasi Web Developer', 'Program sertifikasi untuk pengembang web modern. Mencakup HTML, CSS, JavaScript, React, dan teknologi backend. Peserta akan mendapatkan sertifikat resmi kampus.', '2024-03-15', 'Lab Komputer A1', 150000),
  ('Sertifikasi Data Science', 'Program komprehensif tentang analisis data, machine learning, dan visualisasi data menggunakan Python. Cocok untuk mahasiswa yang ingin berkarir di bidang data.', '2024-04-20', 'Lab Komputer B2', 200000),
  ('Sertifikasi UI/UX Design', 'Pelajari desain antarmuka pengguna yang modern dan pengalaman pengguna yang luar biasa. Menggunakan Figma dan prinsip-prinsip desain terkini.', '2024-05-10', 'Online via Zoom', 0),
  ('Sertifikasi Cybersecurity', 'Program keamanan siber yang mencakup ethical hacking, network security, dan best practices keamanan informasi.', '2024-06-05', 'Auditorium Kampus', 250000),
  ('Sertifikasi Mobile Development', 'Pengembangan aplikasi mobile menggunakan Flutter dan React Native untuk platform Android dan iOS.', '2024-07-15', 'Lab Komputer C1', 100000),
  ('Sertifikasi Cloud Computing', 'Teknologi cloud menggunakan AWS, Google Cloud, dan Azure. Mencakup deployment, scalability, dan manajemen infrastruktur cloud.', '2024-08-20', 'Online via Meet', 0)
ON CONFLICT DO NOTHING;

-- =============================================
-- BUAT AKUN ADMIN (Lakukan di Supabase Auth Dashboard)
-- =============================================
-- 1. Buka Supabase Dashboard > Authentication > Users
-- 2. Klik "Add User"
-- 3. Email: admin001@kampus.com (NIM: admin001)
-- 4. Password: admin123456
-- 5. Setelah dibuat, jalankan SQL berikut dengan UUID user yang baru dibuat:

-- INSERT INTO public.users (id, nim, name, role) VALUES
--   ('<UUID_DARI_AUTH_USER>', 'admin001', 'Administrator Kampus', 'admin');

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON public.registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_program_id ON public.registrations(program_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);


