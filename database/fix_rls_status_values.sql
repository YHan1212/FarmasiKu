-- 修复 RLS 策略中的状态值（从旧状态改为新状态）
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 删除使用旧状态值的策略
-- ============================================
DROP POLICY IF EXISTS "Admins can view matched queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Linked pharmacists can accept queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Linked pharmacists can update accepted queues" ON public.consultation_queue;

-- ============================================
-- 步骤 2: 重新创建使用新状态值的策略
-- ============================================

-- 策略 1: Admin 可以查看所有 accepted/in_chat 队列
CREATE POLICY "Admins can view matched queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    status IN ('accepted', 'in_chat') AND 
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- 策略 2: 链接了 pharmacist account 的用户可以接受队列
CREATE POLICY "Linked pharmacists can accept queues"
  ON public.consultation_queue
  FOR UPDATE
  USING (
    status = 'waiting' AND 
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.user_id = auth.uid()
    )
  )
  WITH CHECK (
    consultation_queue.status IN ('accepted', 'in_chat')
  );

-- 策略 3: 链接了 pharmacist account 的用户可以更新已接受的队列
CREATE POLICY "Linked pharmacists can update accepted queues"
  ON public.consultation_queue
  FOR UPDATE
  USING (
    status IN ('accepted', 'in_chat') AND 
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.id = consultation_queue.pharmacist_id
      AND doctors.user_id = auth.uid()
    )
  )
  WITH CHECK (
    consultation_queue.status IN ('accepted', 'in_chat')
  );

-- ============================================
-- 步骤 3: 验证策略已更新
-- ============================================
SELECT 
  'Verification: Updated Policies' AS step,
  policyname,
  cmd AS command,
  qual AS condition
FROM pg_policies
WHERE tablename = 'consultation_queue'
  AND policyname IN (
    'Admins can view matched queues',
    'Linked pharmacists can accept queues',
    'Linked pharmacists can update accepted queues'
  )
ORDER BY policyname;

-- ============================================
-- 完成！
-- ============================================
-- 现在 Admin 用户应该能够看到 waiting 队列了
-- 如果还是看不到，请运行 database/check_admin_can_see_queues.sql 来诊断

