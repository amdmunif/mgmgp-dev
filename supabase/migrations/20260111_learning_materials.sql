-- Create Enum for Material Types
CREATE TYPE material_type AS ENUM ('cp', 'tp', 'rpp', 'slide', 'modul');

-- Create Learning Materials Table
CREATE TABLE public.learning_materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    type material_type NOT NULL,
    mapel TEXT NOT NULL,
    kelas VARCHAR(10),
    semester INTEGER,
    content TEXT, -- For CP/TP text content/description
    file_url TEXT, -- For RPP/Slide downloads
    is_premium BOOLEAN DEFAULT false,
    author_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Public Read (Everyone can see/read materials)
-- Note: You might want to restrict PREMIUM materials in the future, but for list viewing it's often public.
-- We can handle the "download" restriction in the storage bucket or simplified logic here.
CREATE POLICY "Materials are viewable by everyone" 
ON public.learning_materials FOR SELECT 
USING (true);

-- 2. Admin/Pengurus Create/Update/Delete
-- Assuming 'profiles' table has 'role'. We'll simpler check if user is authenticated for now or specific role.
-- For strict security: EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Pengurus'))
CREATE POLICY "Admins can manage materials" 
ON public.learning_materials FOR ALL 
USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('Admin', 'Pengurus')));

-- Create Storage Bucket for Documents if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage Policy
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('Admin', 'Pengurus'))
);
