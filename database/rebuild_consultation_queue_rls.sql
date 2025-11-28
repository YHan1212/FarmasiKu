-- 重建 consultation_queue 表的 RLS 策略
-- 清理所有旧策略，创建简单清晰的新策略
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 删除所有现有的 RLS 策略
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
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- 确保表存在且 RLS 已启用
ALTER TABLE public.consultation_queue ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 步骤 2: 创建 SELECT 策略（查看）
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
-- 注意：这个策略主要是为了非 Admin 但 link 了 pharmacist 的用户
-- Admin 用户已经被策略 2 覆盖了
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

-- ============================================
-- 步骤 3: 创建 INSERT 策略（创建）
-- ============================================

CREATE POLICY "Users can create queue"
  ON public.consultation_queue
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- ============================================
-- 步骤 4: 创建 UPDATE 策略（更新）
-- ============================================

-- 策略 1: 用户可以更新自己的队列
CREATE POLICY "Users can update own queue"
  ON public.consultation_queue
  FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

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
    consultation_queue.status IN ('matched', 'in_consultation')
  );

-- 策略 3: 链接了 pharmacist account 的用户可以更新已接受的队列
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
-- 步骤 5: 验证策略已创建
-- ============================================
SELECT 
  'Verification: All Policies' AS step,
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
-- 完成！
-- ============================================
-- 现在运行 database/verify_new_rls.sql 来验证策略是否正确工作

