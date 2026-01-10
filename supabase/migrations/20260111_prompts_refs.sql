-- Create Prompt Library Table
CREATE TABLE IF NOT EXISTS public.prompt_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    prompt_content TEXT NOT NULL,
    category TEXT, -- 'Coding', 'Writing', 'Teaching'
    tags TEXT[],
    is_premium BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.prompt_library ENABLE ROW LEVEL SECURITY;

-- Public Read
CREATE POLICY "Public read prompts" 
ON public.prompt_library FOR SELECT 
USING (true);

-- Admin Manage
CREATE POLICY "Admins manage prompts" 
ON public.prompt_library FOR ALL 
USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('Admin', 'Pengurus')));

-- Reference Bank Table (Satu file migration biar efisien)
CREATE TABLE IF NOT EXISTS public.learning_references (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Buku', 'Simulator', 'Game'
    link_url TEXT NOT NULL,
    cover_image TEXT,
    description TEXT,
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.learning_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read references" 
ON public.learning_references FOR SELECT 
USING (true);

CREATE POLICY "Admins manage references" 
ON public.learning_references FOR ALL 
USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('Admin', 'Pengurus')));
