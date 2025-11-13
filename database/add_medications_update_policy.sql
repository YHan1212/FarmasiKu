-- Add UPDATE policy for medications table
-- This allows authenticated users to update medications (for admin)
-- Run this in Supabase SQL Editor

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow authenticated users to update medications" ON public.medications;

-- Create UPDATE policy for authenticated users
CREATE POLICY "Allow authenticated users to update medications"
  ON public.medications
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Also allow INSERT for authenticated users (if needed)
DROP POLICY IF EXISTS "Allow authenticated users to insert medications" ON public.medications;

CREATE POLICY "Allow authenticated users to insert medications"
  ON public.medications
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Verify the policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'medications';

