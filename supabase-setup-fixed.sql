-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create fallen table
CREATE TABLE public.fallen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    image_path TEXT NOT NULL,
    approved BOOLEAN DEFAULT FALSE,
    uploader_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on approved field for faster queries
CREATE INDEX fallen_approved_idx ON public.fallen(approved);

-- Set up RLS (Row Level Security)
ALTER TABLE public.fallen ENABLE ROW LEVEL SECURITY;

-- RLS Policies:

-- 1. Allow anyone to insert records (public submissions)
CREATE POLICY "Anyone can insert" ON public.fallen
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- 2. Allow anyone to view approved records
CREATE POLICY "Anyone can view approved records" ON public.fallen
    FOR SELECT TO anon, authenticated
    USING (approved = true);

-- 3. Users can view their own submissions
CREATE POLICY "Users can view own submissions" ON public.fallen
    FOR SELECT TO authenticated
    USING (auth.uid() = uploader_id);

-- 4. Only admins can update or delete records
CREATE POLICY "Only admins can update" ON public.fallen
    FOR UPDATE TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete" ON public.fallen
    FOR DELETE TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

-- Create storage bucket for fallen images
INSERT INTO storage.buckets (id, name, public) VALUES ('fallen-images', 'fallen-images', true);

-- Storage policies
-- 1. Allow anyone to read public images
CREATE POLICY "Public read access" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'fallen-images' AND (storage.foldername(name))[1] != 'private');

-- 2. Allow authenticated users to upload images (without file size check - will be handled client-side)
CREATE POLICY "Authenticated users can upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'fallen-images' AND
        auth.role() = 'authenticated'
    );

-- 3. Users can update their own uploads
CREATE POLICY "Users can update own uploads" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'fallen-images' AND owner = auth.uid());

-- 4. Only admins can delete images
CREATE POLICY "Only admins can delete images" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'fallen-images' AND auth.jwt() ->> 'role' = 'admin');

-- Setting up admin role function
-- This function should be called manually through the SQL editor in Supabase to promote a user to admin
CREATE OR REPLACE FUNCTION public.make_user_admin(user_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = 
    CASE 
      WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
      ELSE jsonb_set(raw_user_meta_data, '{role}', '"admin"')
    END
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 