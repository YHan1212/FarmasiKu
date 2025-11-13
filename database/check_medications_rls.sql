-- Check RLS policies for medications table
-- Run this in Supabase SQL Editor to check if UPDATE is allowed

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'medications';

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'medications';

-- If no UPDATE policy exists, create one:
-- Allow authenticated users to update medications (for admin)
-- Uncomment and run if needed:

/*
DROP POLICY IF EXISTS "Allow authenticated users to update medications" ON public.medications;

CREATE POLICY "Allow authenticated users to update medications"
  ON public.medications
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
*/

-- Or allow public updates (less secure, but simpler for admin):
/*
DROP POLICY IF EXISTS "Allow public updates to medications" ON public.medications;

CREATE POLICY "Allow public updates to medications"
  ON public.medications
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
*/

