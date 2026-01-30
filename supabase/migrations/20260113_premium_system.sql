-- Add premium_until to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS premium_until timestamp with time zone;

-- Create premium_requests table
CREATE TABLE IF NOT EXISTS public.premium_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    proof_url text NOT NULL,
    status text CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    bank_name text,
    account_number text,
    account_holder text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- RLS for premium_requests
ALTER TABLE public.premium_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own requests
CREATE POLICY "Users view own requests" 
ON public.premium_requests FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own requests
CREATE POLICY "Users insert own requests" 
ON public.premium_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins view all requests" 
ON public.premium_requests FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Pengurus'))
);

-- Admins can update requests
CREATE POLICY "Admins update requests" 
ON public.premium_requests FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Pengurus'))
);

-- Storage for payment proofs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-proofs', 'payment-proofs', false) -- Private bucket, authorized access only
ON CONFLICT (id) DO NOTHING;

-- RLS for Storage (Authenticated users can upload, only Admins/Owners can view?)
-- Actually, for simplicity, let's make it public read for now or restricted. 
-- Secure approach:
CREATE POLICY "Users upload proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs' AND auth.role() = 'authenticated'
);

CREATE POLICY "Admins view proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs' AND 
  (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Pengurus'))
    OR
    (owner = auth.uid()) -- Owner can view their own
  )
);
