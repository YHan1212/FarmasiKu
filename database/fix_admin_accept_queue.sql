-- 修复 Admin 无法接受队列的问题
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 问题：Admin 可以查看队列，但无法更新队列（接受队列）
-- 解决：添加 Admin 的 UPDATE 策略
-- ============================================

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Admins can accept queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Admins can update queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Admins can update accepted queues" ON public.consultation_queue;

-- 策略 1: Admin 可以接受 waiting 队列
CREATE POLICY "Admins can accept queues"
  ON public.consultation_queue
  FOR UPDATE
  USING (
    status = 'waiting' AND 
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    consultation_queue.status IN ('accepted', 'in_chat')
  );

-- 策略 2: Admin 可以更新已接受的队列
CREATE POLICY "Admins can update accepted queues"
  ON public.consultation_queue
  FOR UPDATE
  USING (
    status IN ('accepted', 'in_chat') AND 
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    consultation_queue.status IN ('accepted', 'in_chat', 'completed')
  );

-- ============================================
-- 验证策略已创建
-- ============================================
SELECT 
  '✅ 验证 Admin UPDATE 策略' as status,
  policyname,
  cmd,
  qual::text as using_condition,
  with_check::text as with_check_condition
FROM pg_policies
WHERE tablename = 'consultation_queue'
  AND (policyname LIKE '%Admin%' OR policyname LIKE '%admin%')
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- ============================================
-- 完成！
-- ============================================
SELECT '✅ Admin 现在可以接受和更新队列了！' as status;

