-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  asal_sekolah VARCHAR(255),
  pendidikan_terakhir VARCHAR(50),
  jurusan VARCHAR(255),
  status_kepegawaian VARCHAR(50),
  role VARCHAR(50) DEFAULT 'Anggota', -- Admin, Pengurus, Anggota
  is_active BOOLEAN DEFAULT false,
  ukuran_baju VARCHAR(10),
  no_hp VARCHAR(20),
  foto_profile TEXT,
  mapel TEXT[], -- Array: ['Informatika', 'KKA']
  kelas TEXT[], -- Array: ['Kelas VII', 'Kelas VIII', 'Kelas IX']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  location VARCHAR(255),
  image_url TEXT,
  materials_url TEXT,
  tasks_url TEXT,
  certificate_url TEXT,
  certificate_template TEXT,
  is_registration_open BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Participants
CREATE TABLE event_participants (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_hadir BOOLEAN DEFAULT false,
  tugas_submitted BOOLEAN DEFAULT false,
  task_url TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- News Articles
CREATE TABLE news_articles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gallery Images
CREATE TABLE gallery_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT,
  event_id UUID REFERENCES events(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning CP & TP
CREATE TABLE learning_cp (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mapel VARCHAR(50) NOT NULL, -- 'Informatika' atau 'KKA'
  content TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE learning_tp (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mapel VARCHAR(50) NOT NULL,
  kelas VARCHAR(10) NOT NULL, -- '7', '8', '9'
  semester VARCHAR(10) NOT NULL, -- 'Ganjil', 'Genap'
  materi VARCHAR(255),
  tujuan TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Perangkat Pembelajaran (Resource Bank)
CREATE TABLE teaching_resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  mapel VARCHAR(50),
  kelas VARCHAR(10),
  rpp_url TEXT,     -- File RPP
  slide_url TEXT,   -- File Presentasi
  is_premium BOOLEAN DEFAULT false, -- Premium content
  author_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank Soal & Games
CREATE TABLE question_banks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  mapel VARCHAR(50),
  category VARCHAR(50), -- 'Ulangan', 'TTS', 'Wordsearch', 'Latihan'
  file_url TEXT,    -- Untuk import soal (Word/Excel)
  game_data JSONB,  -- Data untuk TTS/Wordsearch
  is_premium BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt Library
CREATE TABLE prompt_library (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  prompt_content TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  is_premium BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referensi Pembelajaran
CREATE TABLE learning_references (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- 'Buku', 'Simulator', 'Game'
  link_url TEXT NOT NULL,
  cover_image TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Letters (Surat)
CREATE TABLE letters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_id VARCHAR(100) NOT NULL,
  letter_number VARCHAR(255) NOT NULL,
  letter_date DATE NOT NULL,
  subject VARCHAR(255),
  recipient TEXT,
  event_id UUID REFERENCES events(id),
  author_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL, -- HTML content
  form_data JSONB, -- Flexible JSON for form fields
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Content (singleton)
CREATE TABLE site_content (
  id INT PRIMARY KEY DEFAULT 1,
  home_hero_title VARCHAR(255),
  home_hero_subtitle TEXT,
  home_hero_image TEXT,
  profile_visi TEXT,
  profile_misi TEXT,
  profile_sejarah TEXT,
  profile_struktur TEXT,
  contact_address TEXT,
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  contact_map_url TEXT,
  app_logo TEXT,
  kop_surat TEXT,
  -- Pejabat TTD
  ketua_nama VARCHAR(255),
  ketua_nip VARCHAR(100),
  ketua_signature_url TEXT,
  sekretaris_nama VARCHAR(255),
  sekretaris_nip VARCHAR(100),
  sekretaris_signature_url TEXT,
  mkks_nama VARCHAR(255),
  mkks_nip VARCHAR(100),
  mkks_signature_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Premium Settings
CREATE TABLE premium_settings (
  id INT PRIMARY KEY DEFAULT 1,
  registration_fee DECIMAL(10, 2) DEFAULT 0,
  bank_name VARCHAR(50),
  bank_account_number VARCHAR(50),
  bank_account_name VARCHAR(100),
  premium_features TEXT[], -- List fitur: ['Bank Soal', 'Prompts', 'Exclusive RPP']
  active_period_months INT DEFAULT 12,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Premium Subscriptions
CREATE TABLE premium_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payment_proof_url TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, active, expired, rejected
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  user_name VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  target TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Setup
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Adjust as needed)
-- Public read access for some tables
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public events are viewable by everyone" ON events FOR SELECT USING (true);
CREATE POLICY "Public news are viewable by everyone" ON news_articles FOR SELECT USING (true);

-- Premium Content Policy (Example)
CREATE POLICY "Premium content viewable by active subscribers" ON teaching_resources
FOR SELECT USING (
  is_premium = false OR 
  EXISTS (
    SELECT 1 FROM premium_subscriptions 
    WHERE user_id = auth.uid() AND status = 'active' AND end_date >= CURRENT_DATE
  )
);
