-- Create storage bucket for user uploads (avatars, workout photos, etc.)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, allowed_mime_types, file_size_limit)
VALUES (
  'user-uploads',
  'user-uploads',
  true,
  false,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  5242880 -- 5MB limit
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for user-uploads bucket
CREATE POLICY "Users can upload their own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-uploads'
  );