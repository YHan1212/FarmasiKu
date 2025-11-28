-- ============================================
-- 完整诊断和修复 waiting queues 显示问题
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- ============================================
-- 步骤 1: 检查当前用户和角色
-- ============================================
SELECT 
  'Step 1: Current User & Role' AS step,
  auth.uid() AS current_user_id,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS current_role,
  CASE 
    WHEN (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin' 
    THEN '✅ User is admin'
    ELSE '❌ User is NOT admin - Run: UPDATE public.user_profiles SET role = ''admin'' WHERE id = auth.uid();'
  END AS role_status;

-- ============================================
-- 步骤 2: 检查所有队列状态
-- ============================================
SELECT 
  'Step 2: All Queue Statuses' AS step,
  status,
  COUNT(*) AS count
FROM public.consultation_queue
GROUP BY status
ORDER BY status;

-- ============================================
-- 步骤 3: 查看所有 waiting 队列（绕过 RLS）
-- ============================================
SELECT 
  'Step 3: All Waiting Queues (Bypass RLS)' AS step,
  id,
  patient_id,
  status,
  matched_pharmacist_id,
  created_at
FROM public.consultation_queue
WHERE status = 'waiting'
ORDER BY created_at DESC;

-- ============================================
-- 步骤 4: 测试 Admin 查询（模拟）
-- ============================================
SELECT 
  'Step 4: Test Admin Query' AS step,
  (SELECT COUNT(*) FROM public.consultation_queue 
   WHERE status = 'waiting' 
   AND EXISTS (
     SELECT 1 FROM public.user_profiles
     WHERE user_profiles.id = auth.uid()
     AND user_profiles.role = 'admin'
   )) AS admin_can_see_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting') = 0 
    THEN '⚠️ No waiting queues exist'
    WHEN (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
         AND (SELECT COUNT(*) FROM public.consultation_queue 
              WHERE status = 'waiting' 
              AND EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.role = 'admin'
              )) > 0
    THEN '✅ Admin can see queues'
    ELSE '❌ RLS blocking - need to fix policies'
  END AS diagnosis;

-- ============================================
-- 步骤 5: 检查 RLS 策略
-- ============================================
SELECT 
  'Step 5: Current RLS Policies' AS step,
  policyname,
  cmd AS command,
  qual AS condition
FROM pg_policies
WHERE tablename = 'consultation_queue'
ORDER BY 
  CASE cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    ELSE 4
  END,
  policyname;

-- ============================================
-- 步骤 6: 修复 - 确保用户是 Admin
-- ============================================
-- 如果 Step 1 显示用户不是 admin，运行这个：
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE id = auth.uid()
AND (role IS NULL OR role != 'admin');

-- ============================================
-- 步骤 7: 修复 - 重建 RLS 策略（如果 Step 4 显示 RLS blocking）
-- ============================================
-- 如果 Step 4 显示 RLS blocking，运行这个：
-- 注意：这会删除所有现有策略并重建
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- 删除所有现有策略
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'consultation_queue'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.consultation_queue', policy_record.policyname);
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
  
  -- 确保 RLS 已启用
  ALTER TABLE public.consultation_queue ENABLE ROW LEVEL SECURITY;
  
  RAISE NOTICE 'All policies dropped. Now run rebuild_consultation_queue_rls.sql';
END $$;

-- ============================================
-- 步骤 8: 验证修复后
-- ============================================
SELECT 
  'Step 8: Verification After Fix' AS step,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS user_role,
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
         AND (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting') > 0
         AND (SELECT COUNT(*) FROM public.consultation_queue 
              WHERE status = 'waiting' 
              AND EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.role = 'admin'
              )) = (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting')
    THEN '✅ Fixed! Admin can see all waiting queues'
    ELSE '❌ Still has issues - check RLS policies'
  END AS final_status;

