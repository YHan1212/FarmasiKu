-- 修复 Admin 查看 waiting 队列的问题
-- 只有 Admin 账号可以 link pharmacist account
-- Admin 账号（无论是否 link pharmacist）都应该能看到所有 waiting 队列

-- ============================================
-- 步骤 1: 确保 is_current_user_admin() 函数存在
-- ============================================

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  current_user_id UUID;
  user_role TEXT;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = current_user_id;
  
  RETURN COALESCE(user_role, 'user') = 'admin';
END;
$$;

-- ============================================
-- 步骤 2: 删除所有现有的 consultation_queue RLS 策略
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
-- 步骤 3: 确保 RLS 已启用
-- ============================================

ALTER TABLE public.consultation_queue ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 步骤 4: 重新创建 RLS 策略
-- ============================================

-- 策略 1: 用户可以看到自己的队列
CREATE POLICY "Users can view own queue"
  ON public.consultation_queue
  FOR SELECT
  USING (auth.uid() = patient_id);

-- 策略 2: Admin 可以查看所有等待中的队列（无论是否 link pharmacist）
-- 这是最重要的策略！
CREATE POLICY "Admins can view all waiting queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    status = 'waiting' AND public.is_current_user_admin()
  );

-- 策略 3: Admin 可以查看已匹配的队列（用于查看所有会话）
CREATE POLICY "Admins can view matched queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    status IN ('matched', 'in_consultation') AND public.is_current_user_admin()
  );

-- 策略 4: 链接了 pharmacist account 的 Admin 也可以查看（虽然策略 2 已经覆盖，但保留用于明确性）
-- 注意：这个策略实际上被策略 2 覆盖了，但保留用于文档说明
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
-- 步骤 5: INSERT 策略
-- ============================================

CREATE POLICY "Users can create queue"
  ON public.consultation_queue
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- ============================================
-- 步骤 6: UPDATE 策略
-- ============================================

-- 用户可以更新自己的队列
CREATE POLICY "Users can update own queue"
  ON public.consultation_queue
  FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- Admin 如果 link 了 pharmacist account，可以更新等待中的队列（接受咨询）
CREATE POLICY "Linked pharmacists can update queues"
  ON public.consultation_queue
  FOR UPDATE
  USING (
    -- 可以更新等待中的队列（接受时）- 必须 link 了 pharmacist account
    (status = 'waiting' AND EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.user_id = auth.uid()
    )) OR
    -- 或者更新已匹配给自己的队列
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
-- 步骤 7: 验证设置
-- ============================================

-- 检查所有策略
SELECT 
  'Verification: All Policies' AS step,
  policyname,
  cmd,
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

-- 测试查询（Admin 应该能看到所有 waiting 队列）
SELECT 
  'Verification: Test Admin Query' AS step,
  COUNT(*) AS visible_waiting_queues,
  public.is_current_user_admin() AS is_admin,
  auth.uid() AS current_user_id
FROM public.consultation_queue
WHERE status = 'waiting';

-- 检查是否有链接的 pharmacist account
SELECT 
  'Verification: Check Linked Pharmacist' AS step,
  COUNT(*) AS linked_pharmacist_count,
  EXISTS (
    SELECT 1 FROM public.doctors
    WHERE doctors.user_id = auth.uid()
  ) AS has_linked_pharmacist
FROM public.doctors
WHERE user_id = auth.uid();

-- ============================================
-- 完成！
-- ============================================
-- 现在 Admin 账号（无论是否 link pharmacist）都应该能看到所有 waiting 队列
-- 只有 link 了 pharmacist account 的 Admin 才能接受队列（UPDATE）

