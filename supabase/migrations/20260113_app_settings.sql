-- Create app_settings table (Singleton pattern enforced by id=1)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    site_title text DEFAULT 'MGMP Informatika',
    site_description text,
    logo_url text,
    email text,
    phone text,
    address text,
    bank_name text,
    bank_number text,
    bank_holder text,
    premium_price decimal(12, 2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for footer, header, favicon)
CREATE POLICY "Public read access" ON public.app_settings FOR SELECT USING (true);

-- Allow Admin update access
CREATE POLICY "Admin update access" ON public.app_settings FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'Admin'
  )
);

-- Allow Admin insert access (only needed once, but good for safety)
CREATE POLICY "Admin insert access" ON public.app_settings FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'Admin'
  )
);

-- Insert default row
INSERT INTO public.app_settings (id, site_title)
VALUES (1, 'MGMP Informatika')
ON CONFLICT (id) DO NOTHING;

-- Storage bucket for site assets (logo)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies with specific names to avoid conflicts
CREATE POLICY "Public Access Site Assets" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'site-assets' );

CREATE POLICY "Admin Upload Site Assets" 
ON storage.objects FOR INSERT 
WITH CHECK ( 
  bucket_id = 'site-assets' 
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin') 
);

CREATE POLICY "Admin Update Site Assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'site-assets'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
);
