-- Fix RLS policies for avatar upload
-- Execute this in Supabase SQL Editor

DROP POLICY IF EXISTS "users_update_own_avatar" ON public.profiles;
CREATE POLICY "users_update_own_avatar" ON public.profiles
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "storage_avatar_insert" ON storage.objects;
CREATE POLICY "storage_avatar_insert" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage_avatar_select" ON storage.objects;
CREATE POLICY "storage_avatar_select" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "storage_avatar_update" ON storage.objects;
CREATE POLICY "storage_avatar_update" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
