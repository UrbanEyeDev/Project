-- Create the issues table for UrbanEye app
CREATE TABLE IF NOT EXISTS public.issues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    issue_type TEXT NOT NULL,
    user_description TEXT,
    ai_description TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'in_progress', 'resolved', 'closed')),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    accuracy DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (only if not already enabled)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'issues' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies only if they don't exist
DO $$ 
BEGIN
    -- Users can view their own issues
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'issues' 
        AND policyname = 'Users can view their own issues'
    ) THEN
        CREATE POLICY "Users can view their own issues" ON public.issues
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    -- Users can insert their own issues
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'issues' 
        AND policyname = 'Users can insert their own issues'
    ) THEN
        CREATE POLICY "Users can insert their own issues" ON public.issues
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- Users can update their own issues
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'issues' 
        AND policyname = 'Users can update their own issues'
    ) THEN
        CREATE POLICY "Users can update their own issues" ON public.issues
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_issues_user_id ON public.issues(user_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON public.issues(created_at);

-- Grant permissions (safe to run multiple times)
GRANT ALL ON public.issues TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ========================================
-- STORAGE SETUP (This was missing!)
-- ========================================

-- Create storage bucket for urban issues
INSERT INTO storage.buckets (id, name, public)
VALUES ('urbaneye-issues', 'urbaneye-issues', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (only if not already enabled)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create storage policies only if they don't exist
DO $$ 
BEGIN
    -- Allow authenticated uploads
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname = 'Allow authenticated uploads'
    ) THEN
        CREATE POLICY "Allow authenticated uploads" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'urbaneye-issues' 
                AND auth.role() = 'authenticated'
            );
    END IF;
    
    -- Allow authenticated reads
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname = 'Allow authenticated reads'
    ) THEN
        CREATE POLICY "Allow authenticated reads" ON storage.objects
            FOR SELECT USING (
                bucket_id = 'urbaneye-issues' 
                AND auth.role() = 'authenticated'
            );
    END IF;
    
    -- Allow users to delete own files
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname = 'Allow users to delete own files'
    ) THEN
        CREATE POLICY "Allow users to delete own files" ON storage.objects
            FOR DELETE USING (
                bucket_id = 'urbaneye-issues' 
                AND auth.uid()::text = (storage.foldername(name))[1]
            );
    END IF;
END $$;

-- Grant storage permissions (safe to run multiple times)
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
