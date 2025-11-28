-- 检查是否有 waiting 队列存在
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 检查所有队列状态
-- ============================================
SELECT 
  'Step 1: All Queue Statuses' AS step,
  status,
  COUNT(*) AS count
FROM public.consultation_queue
GROUP BY status
ORDER BY status;

-- ============================================
-- 步骤 2: 显示所有 waiting 队列（绕过 RLS）
-- ============================================
SELECT 
  'Step 2: All Waiting Queues (Bypass RLS)' AS step,
  id,
  patient_id,
  status,
  matched_pharmacist_id,
  created_at,
  updated_at
FROM public.consultation_queue
WHERE status = 'waiting'
ORDER BY created_at DESC;

-- ============================================
-- 步骤 3: 检查队列的 patient_id 是否有效
-- ============================================
SELECT 
  'Step 3: Queue Patient Info' AS step,
  cq.id AS queue_id,
  cq.patient_id,
  cq.status,
  au.email AS patient_email,
  up.role AS patient_role,
  CASE 
    WHEN au.id IS NULL THEN '❌ Patient user does not exist'
    WHEN up.id IS NULL THEN '⚠️ Patient profile does not exist'
    ELSE '✅ Patient exists'
  END AS patient_status
FROM public.consultation_queue cq
LEFT JOIN auth.users au ON au.id = cq.patient_id
LEFT JOIN public.user_profiles up ON up.id = cq.patient_id
WHERE cq.status = 'waiting'
ORDER BY cq.created_at DESC;

-- ============================================
-- 步骤 4: 测试 Admin 用户查询（模拟）
-- ============================================
SELECT 
  'Step 4: Test Admin Query' AS step,
  '56e324aa-e1dd-40a8-9e96-2473cfcba661'::uuid AS admin_user_id,
  (SELECT role FROM public.user_profiles WHERE id = '56e324aa-e1dd-40a8-9e96-2473cfcba661') AS admin_role,
  (SELECT COUNT(*) FROM public.consultation_queue 
   WHERE status = 'waiting' 
   AND EXISTS (
     SELECT 1 FROM public.user_profiles
     WHERE user_profiles.id = '56e324aa-e1dd-40a8-9e96-2473cfcba661'::uuid
     AND user_profiles.role = 'admin'
   )) AS would_see_queues,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting') = 0 
    THEN '⚠️ No waiting queues exist - create one first'
    WHEN (SELECT role FROM public.user_profiles WHERE id = '56e324aa-e1dd-40a8-9e96-2473cfcba661') = 'admin'
         AND (SELECT COUNT(*) FROM public.consultation_queue 
              WHERE status = 'waiting' 
              AND EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_profiles.id = '56e324aa-e1dd-40a8-9e96-2473cfcba661'::uuid
                AND user_profiles.role = 'admin'
              )) > 0
    THEN '✅ Admin would see queues'
    WHEN (SELECT role FROM public.user_profiles WHERE id = '56e324aa-e1dd-40a8-9e96-2473cfcba661') = 'admin'
         AND (SELECT COUNT(*) FROM public.consultation_queue 
              WHERE status = 'waiting' 
              AND EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_profiles.id = '56e324aa-e1dd-40a8-9e96-2473cfcba661'::uuid
                AND user_profiles.role = 'admin'
              )) = 0
    THEN '❌ Admin but RLS blocking - check policies'
    ELSE '❌ Admin role is not set correctly'
  END AS diagnosis;

