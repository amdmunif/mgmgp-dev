-- Fix RLS policies to ensure Admin visibility

-- 1. Ensure profiles are publicly viewable (or at least by authenticated users) to avoid Join issues
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

-- 2. Drop existing Admin view policy on premium_requests to recreate it robustly
DROP POLICY IF EXISTS "Admins view all requests" ON public.premium_requests;

-- 3. Create a non-recursive way to check admin if possible, or rely on public profiles
-- Since profiles is public compliant now, this standard subquery should work without recursion issues
CREATE POLICY "Admins view all requests" 
ON public.premium_requests FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('Admin', 'Pengurus')
  )
);

-- 4. Ensure foreign key relationship is valid (just in case)
-- (No SQL needed, but good to know)

-- 5. Grant permissions just in case
GRANT SELECT, INSERT, UPDATE, DELETE ON public.premium_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.premium_requests TO service_role;
