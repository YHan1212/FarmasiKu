-- 修复 RLS 策略：使用直接角色检查而不是函数
-- 如果 is_current_user_admin() 函数在 RLS 中不工作，使用这个脚本

-- ============================================
-- 步骤 1: 删除所有现有的 consultation_queue RLS 策略
-- ============================================
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'consultation_queue'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.consultation_queue', policy_record.policyname);
  END LOOP;
END $$;

-- ============================================
-- 步骤 2: 重新创建 RLS 策略（使用直接角色检查）
-- ============================================

-- 策略 1: 用户可以看到自己的队列
CREATE POLICY "Users can view own queue"
  ON public.consultation_queue
  FOR SELECT
  USING (auth.uid() = patient_id);

-- 策略 2: Admin 可以查看所有等待中的队列（使用直接角色检查）
CREATE POLICY "Admins can view all waiting queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    status = 'waiting' AND 
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- 策略 3: Admin 可以查看已匹配的队列
CREATE POLICY "Admins can view matched queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    status IN ('matched', 'in_consultation') AND 
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- 策略 4: 链接了 pharmacist account 的用户可以查看所有等待中的队列
CREATE POLICY "Linked pharmacists can view waiting queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    status = 'waiting' AND EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.user_id = auth.uid()
    )
  );

-- ============================================
-- 步骤 3: INSERT 策略
-- ============================================
CREATE POLICY "Users can create queue"
  ON public.consultation_queue
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- ============================================
-- 步骤 4: UPDATE 策略
-- ============================================
CREATE POLICY "Users can update own queue"
  ON public.consultation_queue
  FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Linked pharmacists can update queues"
  ON public.consultation_queue
  FOR UPDATE
  USING (
    (status = 'waiting' AND EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.user_id = auth.uid()
    )) OR
    (
      status IN ('matched', 'in_consultation') AND
      EXISTS (
        SELECT 1 FROM public.doctors
        WHERE doctors.id = consultation_queue.matched_pharmacist_id
        AND doctors.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    consultation_queue.status IN ('matched', 'in_consultation')
  );

-- ============================================
-- 步骤 5: 验证设置
-- ============================================
SELECT 
  'Verification: Policies Created' AS step,
  policyname,
  cmd,
  qual AS condition
FROM pg_policies
WHERE tablename = 'consultation_queue'
ORDER BY policyname;

-- 测试查询（需要以 Admin 用户登录）
SELECT 
  'Verification: Test Query' AS step,
  COUNT(*) AS visible_queues,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS current_role,
  CASE 
    WHEN (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin' 
         AND COUNT(*) > 0 
    THEN '✅ SUCCESS - Admin can see waiting queues!'
    WHEN (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin' 
         AND COUNT(*) = 0 
    THEN '⚠️ Admin but no queues visible (check if queues exist)'
    ELSE '❌ Not logged in as Admin'
  END AS status
FROM public.consultation_queue
WHERE status = 'waiting' 
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );

-- ============================================
-- 完成！
-- ============================================
-- 这个脚本使用直接的角色检查而不是函数
-- 如果函数在 RLS 中不工作，这个应该可以工作

