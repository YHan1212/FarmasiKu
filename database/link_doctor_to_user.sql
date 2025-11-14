-- Link existing doctor to a user account
-- Run this in Supabase SQL Editor
-- Replace 'doctor-name' and 'user-email' with actual values

-- Method 1: Link doctor by name to user by email
-- First, get the user ID from email
-- Then update the doctor record

-- Example:
-- UPDATE public.doctors
-- SET user_id = (
--   SELECT id FROM auth.users 
--   WHERE email = 'doctor@example.com'
-- )
-- WHERE name = 'Dr. Default';

-- Method 2: Link all doctors without user_id to a specific user
-- UPDATE public.doctors
-- SET user_id = (
--   SELECT id FROM auth.users 
--   WHERE email = 'your-email@example.com'
-- )
-- WHERE user_id IS NULL
-- LIMIT 1;

-- Method 3: Check which doctors need linking
SELECT 
  d.id,
  d.name,
  d.user_id,
  u.email as user_email
FROM public.doctors d
LEFT JOIN auth.users u ON d.user_id = u.id
ORDER BY d.created_at DESC;

-- After checking, use Method 1 or 2 to link doctors to users

