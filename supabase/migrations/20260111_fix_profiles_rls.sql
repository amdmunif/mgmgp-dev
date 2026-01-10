-- Fix RLS for profiles to allow registration
-- Users need to be able to INSERT their own profile during sign up
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Users should be able to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Grant usage to authenticated users (just in case)
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
