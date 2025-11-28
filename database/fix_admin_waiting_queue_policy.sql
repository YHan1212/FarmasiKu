-- 修复 Admin 查看 waiting 队列的策略
-- 问题：Admin 用户无法看到 waiting 状态的队列
-- 解决：确保 "Admins can view all waiting queues" 策略存在
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 检查当前策略
-- ============================================
SELECT 
  'Current Policies' AS step,
  policyname,
  cmd AS command,
  qual AS condition
FROM pg_policies
WHERE tablename = 'consultation_queue'
ORDER BY policyname;

-- ============================================
-- 步骤 2: 删除可能冲突的策略（如果存在）
-- ============================================
DROP POLICY IF EXISTS "Admins can view all waiting queues" ON public.consultation_queue;

-- ============================================
-- 步骤 3: 创建/重新创建 Admin 查看 waiting 队列的策略
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
-- 步骤 4: 验证策略已创建
-- ============================================
SELECT 
  'Verification: Admin Waiting Queue Policy' AS step,
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
    WHEN role = 'admin' THEN '✅ You are admin - should be able to see waiting queues'
    ELSE '❌ You are NOT admin - this policy will not apply'
  END AS admin_status
FROM public.user_profiles
WHERE id = auth.uid();

-- ============================================
-- 步骤 6: 测试 Admin 能否看到 waiting 队列
-- ============================================
SELECT 
  COUNT(*) as visible_waiting_queues,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ SUCCESS: Admin can see waiting queues!'
    WHEN EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN '⚠️ Admin user but no waiting queues found (check if queues exist in database)'
    ELSE '❌ Cannot see waiting queues - check if you are admin'
  END AS test_result
FROM public.consultation_queue
WHERE status = 'waiting';

-- ============================================
-- 步骤 7: 显示所有等待队列（如果可见）
-- ============================================
SELECT 
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
-- 现在刷新浏览器页面，Admin 应该能看到 waiting 队列了

