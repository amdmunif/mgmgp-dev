-- Create Games Board Table
CREATE TABLE IF NOT EXISTS public.games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL,
    image_url TEXT, -- Optional cover image
    plays_count INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Games
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read games" ON public.games FOR SELECT USING (true);

CREATE POLICY "Admins manage games" 
ON public.games FOR ALL 
USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('Admin', 'Pengurus')));


-- Update Prompt Library to include Example Result
ALTER TABLE public.prompt_library 
ADD COLUMN IF NOT EXISTS example_result TEXT,
ADD COLUMN IF NOT EXISTS example_type TEXT DEFAULT 'text'; -- 'text', 'image', 'link'
