-- ============================================
-- 修复 user_role 为 null 的问题
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- ============================================
-- 步骤 1: 检查当前用户和 profile
-- ============================================
SELECT 
  'Step 1: Check Current User' AS step,
  auth.uid() AS current_user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) AS current_email,
  (SELECT id FROM public.user_profiles WHERE id = auth.uid()) AS profile_exists,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS current_role;

-- ============================================
-- 步骤 2: 如果 profile 不存在，创建它
-- ============================================
INSERT INTO public.user_profiles (id, role, created_at, updated_at)
SELECT 
  auth.uid(),
  'admin',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles WHERE id = auth.uid()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 步骤 3: 确保 role 是 'admin'
-- ============================================
UPDATE public.user_profiles 
SET 
  role = 'admin',
  updated_at = NOW()
WHERE id = auth.uid()
AND (role IS NULL OR role != 'admin');

-- ============================================
-- 步骤 4: 验证修复
-- ============================================
SELECT 
  'Step 4: Verification' AS step,
  auth.uid() AS user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) AS email,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS role,
  CASE 
    WHEN (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    THEN '✅ Role is now admin'
    WHEN (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IS NULL
    THEN '❌ Role is still NULL - profile might not exist'
    ELSE '⚠️ Role is: ' || (SELECT role FROM public.user_profiles WHERE id = auth.uid())
  END AS status;

-- ============================================
-- 步骤 5: 测试 Admin 查询
-- ============================================
SELECT 
  'Step 5: Test Admin Query' AS step,
  (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting') AS total_waiting,
  (SELECT COUNT(*) FROM public.consultation_queue 
   WHERE status = 'waiting' 
   AND EXISTS (
     SELECT 1 FROM public.user_profiles
     WHERE user_profiles.id = auth.uid()
     AND user_profiles.role = 'admin'
   )) AS admin_can_see,
  CASE 
    WHEN (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
         AND (SELECT COUNT(*) FROM public.consultation_queue 
              WHERE status = 'waiting' 
              AND EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.role = 'admin'
              )) = (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting')
    THEN '✅ SUCCESS! Admin can see all waiting queues'
    WHEN (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IS NULL
    THEN '❌ User role is still NULL - check if profile exists'
    ELSE '⚠️ Partial success - check RLS policies'
  END AS final_status;

