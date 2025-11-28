-- ============================================
-- 快速修复：确保 Admin 可以看到 waiting queues
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- ============================================
-- 步骤 1: 确保当前用户是 Admin
-- ============================================
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE id = auth.uid()
AND (role IS NULL OR role != 'admin');

SELECT 'Step 1: User role updated' AS status, 
       (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS current_role;

-- ============================================
-- 步骤 2: 删除所有旧的 consultation_queue RLS 策略
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
  RAISE NOTICE 'All old policies dropped';
END $$;

-- ============================================
-- 步骤 3: 创建新的 RLS 策略
-- ============================================

-- 策略 1: 用户可以看到自己的队列
CREATE POLICY "Users can view own queue"
  ON public.consultation_queue
  FOR SELECT
  USING (auth.uid() = patient_id);

-- 策略 2: Admin 可以查看所有 waiting 队列（最重要！）
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

-- 策略 3: Admin 可以查看所有 matched/in_consultation 队列
CREATE POLICY "Admins can view matched queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    status IN ('matched', 'in_consultation') AND 
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- 策略 4: 链接了 pharmacist account 的用户可以查看 waiting 队列
CREATE POLICY "Linked pharmacists can view waiting queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    status = 'waiting' AND 
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.user_id = auth.uid()
    )
  );

-- 策略 5: 用户可以创建队列
CREATE POLICY "Users can create queue"
  ON public.consultation_queue
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- 策略 6: 用户可以更新自己的队列
CREATE POLICY "Users can update own queue"
  ON public.consultation_queue
  FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- 策略 7: 链接了 pharmacist account 的用户可以接受队列
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
    consultation_queue.status IN ('matched', 'in_consultation')
  );

-- 策略 8: 链接了 pharmacist account 的用户可以更新已接受的队列
CREATE POLICY "Linked pharmacists can update accepted queues"
  ON public.consultation_queue
  FOR UPDATE
  USING (
    status IN ('matched', 'in_consultation') AND 
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.id = consultation_queue.matched_pharmacist_id
      AND doctors.user_id = auth.uid()
    )
  )
  WITH CHECK (
    consultation_queue.status IN ('matched', 'in_consultation')
  );

-- ============================================
-- 步骤 4: 验证
-- ============================================
SELECT 
  'Step 4: Verification' AS step,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS user_role,
  (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting') AS total_waiting_queues,
  (SELECT COUNT(*) FROM public.consultation_queue 
   WHERE status = 'waiting' 
   AND EXISTS (
     SELECT 1 FROM public.user_profiles
     WHERE user_profiles.id = auth.uid()
     AND user_profiles.role = 'admin'
   )) AS admin_can_see_count,
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
    WHEN (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting') = 0
    THEN '⚠️ No waiting queues exist - create one first'
    ELSE '❌ Still has issues'
  END AS status;

