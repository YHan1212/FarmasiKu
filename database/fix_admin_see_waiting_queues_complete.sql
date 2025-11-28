-- ============================================
-- 完整修复：让 Admin 能够查看 waiting 队列
-- 一次性运行所有必要的修复步骤
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- ============================================
-- 步骤 1: 检查当前状态
-- ============================================
SELECT 
  'Step 1: Current State' AS step,
  COUNT(*) as waiting_queues_count
FROM public.consultation_queue
WHERE status = 'waiting';

-- ============================================
-- 步骤 2: 检查当前用户是否是 admin
-- ============================================
SELECT 
  'Step 2: Check Admin Status' AS step,
  id,
  role,
  CASE 
    WHEN role = 'admin' THEN '✅ You are admin'
    ELSE '❌ You are NOT admin'
  END AS admin_status
FROM public.user_profiles
WHERE id = auth.uid();

-- ============================================
-- 步骤 3: 检查当前 RLS 策略
-- ============================================
SELECT 
  'Step 3: Current RLS Policies' AS step,
  policyname,
  cmd AS command
FROM pg_policies
WHERE tablename = 'consultation_queue'
  AND cmd = 'SELECT'
  AND qual::text LIKE '%waiting%'
ORDER BY policyname;

-- ============================================
-- 步骤 4: 删除可能冲突的策略（如果存在）
-- ============================================
DROP POLICY IF EXISTS "Admins can view all waiting queues" ON public.consultation_queue;

-- ============================================
-- 步骤 5: 创建 Admin 查看 waiting 队列的策略（关键步骤！）
-- ============================================
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

-- ============================================
-- 步骤 6: 验证策略已创建
-- ============================================
SELECT 
  'Step 6: Verify Policy Created' AS step,
  policyname,
  cmd AS command,
  qual AS condition
FROM pg_policies
WHERE tablename = 'consultation_queue'
  AND policyname = 'Admins can view all waiting queues';

-- ============================================
-- 步骤 7: 检查所有与 waiting 相关的策略（应该看到 2 个）
-- ============================================
SELECT 
  'Step 7: All Waiting-Related Policies' AS step,
  policyname,
  cmd AS command
FROM pg_policies
WHERE tablename = 'consultation_queue'
  AND cmd = 'SELECT'
  AND qual::text LIKE '%waiting%'
ORDER BY policyname;

-- ============================================
-- 步骤 8: 测试 Admin 能否看到 waiting 队列（关键测试！）
-- ============================================
SELECT 
  'Step 8: Test Admin Access' AS step,
  COUNT(*) as visible_waiting_queues,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ SUCCESS: Admin can see waiting queues!'
    WHEN EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN '⚠️ Admin user but no waiting queues found (this is normal if no queues exist)'
    ELSE '❌ Cannot see waiting queues - check if you are admin'
  END AS test_result
FROM public.consultation_queue
WHERE status = 'waiting';

-- ============================================
-- 步骤 9: 显示所有可见的 waiting 队列
-- ============================================
SELECT 
  'Step 9: Visible Waiting Queues' AS step,
  id,
  patient_id,
  status,
  created_at,
  position,
  estimated_wait_minutes
FROM public.consultation_queue
WHERE status = 'waiting'
ORDER BY created_at ASC;

-- ============================================
-- 完成！
-- ============================================
-- 如果步骤 8 显示 "✅ SUCCESS"，说明修复成功
-- 现在刷新浏览器页面，Admin 应该能看到 waiting 队列了
-- 
-- 如果步骤 8 显示 "⚠️ Admin user but no waiting queues found"，
-- 但步骤 1 显示有 waiting 队列，说明 RLS 策略还有问题
-- 
-- 如果步骤 8 显示 "❌ Cannot see waiting queues"，
-- 检查步骤 2 确认你的用户角色是 'admin'

