-- 修复 Admin 无法查看 waiting 队列的问题 - 完整版本
-- 在 Supabase SQL Editor 中运行此脚本
-- 这个版本会完全重置所有策略，确保 Admin 可以查看

-- ============================================
-- 步骤 1: 确保 is_current_user_admin() 函数存在且正确
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
  -- 获取当前用户 ID
  current_user_id := auth.uid();
  
  -- 如果没有登录用户，返回 false
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 直接查询（绕过 RLS，因为函数是 SECURITY DEFINER）
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = current_user_id;
  
  -- 返回是否为管理员
  RETURN COALESCE(user_role, 'user') = 'admin';
END;
$$;

-- 验证函数
SELECT 
  'Function created' AS status,
  public.is_current_user_admin() AS test_result,
  auth.uid() AS current_user_id;

-- ============================================
-- 步骤 2: 删除所有现有的 consultation_queue RLS 策略
-- ============================================

-- 获取所有策略名称
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

-- 手动删除可能遗漏的策略
DROP POLICY IF EXISTS "Users can view own queue" ON public.consultation_queue;
DROP POLICY IF EXISTS "Users can create queue" ON public.consultation_queue;
DROP POLICY IF EXISTS "Users can update own queue" ON public.consultation_queue;
DROP POLICY IF EXISTS "Pharmacists can view all queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Pharmacists can view all waiting queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Admins can view all queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Admins can view all waiting queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Linked pharmacists can view all waiting queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Pharmacists can update queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Pharmacists can view matched queues" ON public.consultation_queue;

-- ============================================
-- 步骤 3: 确保 RLS 已启用
-- ============================================

ALTER TABLE public.consultation_queue ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 步骤 4: 重新创建 RLS 策略（使用 PERMISSIVE，多个策略用 OR 连接）
-- ============================================

-- 策略 1: 用户可以看到自己的队列
CREATE POLICY "Users can view own queue"
  ON public.consultation_queue
  FOR SELECT
  USING (auth.uid() = patient_id);

-- 策略 2: Admin 可以查看所有等待中的队列（最重要！）
CREATE POLICY "Admins can view all waiting queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    status = 'waiting' AND public.is_current_user_admin()
  );

-- 策略 3: 链接了 pharmacist account 的用户可以查看所有等待中的队列
CREATE POLICY "Linked pharmacists can view all waiting queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    status = 'waiting' AND EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.user_id = auth.uid()
    )
  );

-- 策略 4: 药剂师可以查看已匹配给自己的队列
CREATE POLICY "Pharmacists can view matched queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    status IN ('matched', 'in_consultation') AND
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.id = consultation_queue.matched_pharmacist_id
      AND doctors.user_id = auth.uid()
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

-- 链接了 pharmacist account 的用户可以更新等待中的队列
CREATE POLICY "Pharmacists can update queues"
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

-- 测试查询（应该能看到所有 waiting 队列，如果用户是 admin）
SELECT 
  'Verification: Test Query' AS step,
  COUNT(*) AS visible_waiting_queues,
  public.is_current_user_admin() AS is_admin,
  auth.uid() AS current_user_id
FROM public.consultation_queue
WHERE status = 'waiting';

-- ============================================
-- 完成！
-- ============================================
-- 现在运行诊断脚本 database/diagnose_admin_queue_issue.sql 来验证

