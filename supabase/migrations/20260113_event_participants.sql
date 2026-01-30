-- Create event_participants table
CREATE TABLE IF NOT EXISTS public.event_participants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    status text CHECK (status IN ('registered', 'attended', 'cancelled')) DEFAULT 'registered',
    registered_at timestamp with time zone DEFAULT now(),
    UNIQUE(event_id, user_id)
);

-- RLS
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- Users can view their own participations
CREATE POLICY "Users view own participations" 
ON public.event_participants FOR SELECT 
USING (auth.uid() = user_id);

-- Users can register themselves
CREATE POLICY "Users register themselves" 
ON public.event_participants FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can cancel (update status) ??? Or just delete? Let's allow delete for cancellation or update status.
-- Let's say update status to cancelled.
CREATE POLICY "Users update own participation" 
ON public.event_participants FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins view all participations" 
ON public.event_participants FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Pengurus'))
);

-- Admins can update (e.g. mark as attended)
CREATE POLICY "Admins update participations" 
ON public.event_participants FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Pengurus'))
);
