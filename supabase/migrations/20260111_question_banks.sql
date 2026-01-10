-- Create Question Banks Table if not exists
CREATE TABLE IF NOT EXISTS public.question_banks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    mapel TEXT,
    category TEXT NOT NULL, -- 'Ulangan', 'Latihan', 'TTS', 'Wordsearch'
    file_url TEXT,
    game_data JSONB, -- For interactive games
    is_premium BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.question_banks ENABLE ROW LEVEL SECURITY;

-- Public Read (maybe restricted to premium?)
-- For now let's allow read for authenticated users or everyone?
-- Requirement: "Bank Soal" usually Premium.
CREATE POLICY "Public read question banks" 
ON public.question_banks FOR SELECT 
USING (true); -- We will handle premium check in UI or separate policy if needed strict

-- Admin Manage
CREATE POLICY "Admins manage question banks" 
ON public.question_banks FOR ALL 
USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('Admin', 'Pengurus')));
