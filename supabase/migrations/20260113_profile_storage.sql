-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Public can view profile photos
CREATE POLICY "Public Access Profile Photos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profile-photos' );

-- Policy: Users can upload their own profile photo
CREATE POLICY "Users Upload Own Profile Photo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos' AND 
  auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Policy: Users can update their own profile photo
CREATE POLICY "Users Update Own Profile Photo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos' AND 
  auth.uid() = (storage.foldername(name))[1]::uuid
);
