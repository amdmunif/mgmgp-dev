-- 1. Add Code Column to Learning Materials
ALTER TABLE public.learning_materials 
ADD COLUMN IF NOT EXISTS code VARCHAR(50);

-- 2. Create Questions Table (if not exists)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    type VARCHAR(20) NOT NULL, -- single_choice, multiple_choice, true_false, match, essay, short_answer
    options JSONB, -- Array of options: [{id, text, is_correct}]
    answer_key TEXT, -- For essay/short_answer
    explanation TEXT,
    level VARCHAR(20), -- Mudah, Sedang, Sukar
    mapel VARCHAR(50) NOT NULL,
    kelas VARCHAR(10) NOT NULL,
    tp_id UUID, -- Reference to Learning Material (TP)
    tp_code VARCHAR(50), -- Cached TP Code
    creator_id UUID REFERENCES auth.users(id),
    creator_name TEXT,
    status VARCHAR(20) DEFAULT 'draft', -- draft, pending, verified, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- 3. Cleanup Unused Tables
DROP TABLE IF EXISTS public.learning_cp;
DROP TABLE IF EXISTS public.learning_tp;
DROP TABLE IF EXISTS public.teaching_resources;

-- 4. Policies for Questions
-- Public Read (Verified only or all?)
CREATE POLICY "Everyone can view verified questions" 
ON public.questions FOR SELECT 
USING (status = 'verified' OR auth.uid() = creator_id);

-- Creators can manage their own questions
CREATE POLICY "Users can manage own questions" 
ON public.questions FOR ALL 
USING (auth.uid() = creator_id);

-- Admins can manage all
CREATE POLICY "Admins can manage all questions" 
ON public.questions FOR ALL 
USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('Admin', 'Pengurus')));
