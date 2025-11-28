-- 验证 Admin 查看 waiting 队列的策略是否存在
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 检查所有 consultation_queue 的 RLS 策略
-- ============================================
SELECT 
  policyname,
  cmd AS command,
  qual AS using_condition,
  with_check AS with_check_condition
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
-- 步骤 2: 检查是否有 Admin 查看 waiting 队列的策略
-- ============================================
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_policies 
      WHERE tablename = 'consultation_queue'
      AND cmd = 'SELECT'
      AND qual::text LIKE '%status%waiting%'
      AND qual::text LIKE '%admin%'
    ) THEN '✅ Policy exists: Admin can view waiting queues'
    ELSE '❌ MISSING: Admin cannot view waiting queues - THIS IS THE PROBLEM!'
  END AS admin_waiting_policy_status;

-- ============================================
-- 步骤 3: 如果策略缺失，创建它
-- ============================================
DO $$
BEGIN
  -- 检查策略是否存在
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'consultation_queue'
    AND policyname = 'Admins can view all waiting queues'
  ) THEN
    -- 创建策略
    CREATE POLICY "Admins can view all waiting queues"
      ON public.consultation_queue
      FOR SELECT
      USING (
        status = 'waiting' AND 
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role = 'admin'
        )
      );
    
    RAISE NOTICE '✅ Created policy: Admins can view all waiting queues';
  ELSE
    RAISE NOTICE 'ℹ️ Policy already exists: Admins can view all waiting queues';
  END IF;
END $$;

-- ============================================
-- 步骤 4: 验证策略已创建
-- ============================================
SELECT 
  'Verification' AS step,
  policyname,
  cmd AS command,
  qual AS condition
FROM pg_policies
WHERE tablename = 'consultation_queue'
  AND policyname = 'Admins can view all waiting queues';

-- ============================================
-- 步骤 5: 测试当前用户是否是 admin
-- ============================================
SELECT 
  id,
  role,
  CASE 
    WHEN role = 'admin' THEN '✅ You are admin'
    ELSE '❌ You are NOT admin'
  END AS admin_status
FROM public.user_profiles
WHERE id = auth.uid();

-- ============================================
-- 步骤 6: 测试 Admin 能否看到 waiting 队列
-- ============================================
SELECT 
  COUNT(*) as visible_waiting_queues,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Admin can see waiting queues'
    WHEN EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN '⚠️ Admin user but no waiting queues found (check if queues exist)'
    ELSE '❌ Cannot see waiting queues'
  END AS test_result
FROM public.consultation_queue
WHERE status = 'waiting';

