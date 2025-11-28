-- ============================================
-- 🔧 修复 Admin 查看 waiting 队列 - 直接复制粘贴到 Supabase SQL Editor
-- ============================================
-- 在 Supabase SQL Editor 中：https://supabase.com/dashboard/project/jkbuoszyjleuxkkolzcy/sql
-- 复制下面的所有代码，粘贴到编辑器，然后点击 "Run" 按钮
-- ============================================

-- 步骤 1: 删除可能冲突的策略
DROP POLICY IF EXISTS "Admins can view all waiting queues" ON public.consultation_queue;

-- 步骤 2: 创建 Admin 查看 waiting 队列的策略（最重要！）
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

-- 步骤 3: 验证策略已创建
SELECT 
  '✅ Policy Created' AS status,
  policyname,
  cmd AS command
FROM pg_policies
WHERE tablename = 'consultation_queue'
  AND policyname = 'Admins can view all waiting queues';

-- 步骤 4: 检查所有 waiting 相关策略（应该看到 2 个）
SELECT 
  '📋 All Waiting Policies' AS status,
  policyname,
  cmd AS command
FROM pg_policies
WHERE tablename = 'consultation_queue'
  AND cmd = 'SELECT'
  AND qual::text LIKE '%waiting%'
ORDER BY policyname;

-- 步骤 5: 测试 Admin 能否看到 waiting 队列（关键测试！）
SELECT 
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

-- 步骤 6: 显示所有可见的 waiting 队列
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
-- ✅ 完成！
-- ============================================
-- 如果步骤 5 显示 "✅ SUCCESS"，说明修复成功
-- 现在刷新浏览器页面，Admin 应该能看到 waiting 队列了

