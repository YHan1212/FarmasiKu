-- Add DELETE and UPDATE policies for doctors table
-- Run this in Supabase SQL Editor

-- Allow authenticated users to update any doctor (for admin)
DROP POLICY IF EXISTS "Authenticated users can update doctors" ON public.doctors;
CREATE POLICY "Authenticated users can update doctors"
  ON public.doctors
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete doctors
DROP POLICY IF EXISTS "Allow authenticated users to delete doctors" ON public.doctors;
CREATE POLICY "Allow authenticated users to delete doctors"
  ON public.doctors
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Also allow viewing all doctors (not just available ones) for admin
DROP POLICY IF EXISTS "Authenticated users can view all doctors" ON public.doctors;
CREATE POLICY "Authenticated users can view all doctors"
  ON public.doctors
  FOR SELECT
  USING (auth.role() = 'authenticated' OR is_available = true);

-- Verify the policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'doctors';

