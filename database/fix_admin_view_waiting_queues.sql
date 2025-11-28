-- 修复 Admin 无法查看 waiting 队列的问题
-- 在 Supabase SQL Editor 中运行此脚本

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

-- ============================================
-- 步骤 2: 删除所有现有的 consultation_queue RLS 策略
-- ============================================

-- 删除所有可能存在的策略
DROP POLICY IF EXISTS "Users can view own queue" ON public.consultation_queue;
DROP POLICY IF EXISTS "Users can create queue" ON public.consultation_queue;
DROP POLICY IF EXISTS "Users can update own queue" ON public.consultation_queue;
DROP POLICY IF EXISTS "Pharmacists can view all queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Pharmacists can view all waiting queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Admins can view all queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Admins can view all waiting queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Linked pharmacists can view all waiting queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Pharmacists can update queues" ON public.consultation_queue;

-- ============================================
-- 步骤 3: 重新创建 RLS 策略（按优先级顺序）
-- ============================================

-- 策略 1: 用户可以看到自己的队列
CREATE POLICY "Users can view own queue"
  ON public.consultation_queue
  FOR SELECT
  USING (auth.uid() = patient_id);

-- 策略 2: Admin 可以查看所有等待中的队列（最高优先级）
CREATE POLICY "Admins can view all waiting queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    -- Admin 可以查看所有等待中的队列
    (status = 'waiting' AND public.is_current_user_admin())
  );

-- 策略 3: 链接了 pharmacist account 的用户可以查看所有等待中的队列
CREATE POLICY "Linked pharmacists can view all waiting queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    -- 如果 link 了 pharmacist account，可以查看所有等待中的队列
    (status = 'waiting' AND EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.user_id = auth.uid()
    ))
  );

-- 策略 4: 药剂师可以查看已匹配给自己的队列
CREATE POLICY "Pharmacists can view matched queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    -- 查看已匹配给自己的队列
    (
      status IN ('matched', 'in_consultation') AND
      EXISTS (
        SELECT 1 FROM public.doctors
        WHERE doctors.id = consultation_queue.matched_pharmacist_id
        AND doctors.user_id = auth.uid()
      )
    )
  );

-- ============================================
-- 步骤 4: INSERT 策略
-- ============================================

-- 用户可以创建自己的队列
CREATE POLICY "Users can create queue"
  ON public.consultation_queue
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- ============================================
-- 步骤 5: UPDATE 策略
-- ============================================

-- 用户可以更新自己的队列
CREATE POLICY "Users can update own queue"
  ON public.consultation_queue
  FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- 链接了 pharmacist account 的用户可以更新等待中的队列（接受咨询时）
CREATE POLICY "Pharmacists can update queues"
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
    -- 更新后的状态必须是 matched 或 in_consultation
    consultation_queue.status IN ('matched', 'in_consultation')
  );

-- ============================================
-- 步骤 6: 验证设置
-- ============================================

-- 检查策略是否已创建
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'consultation_queue'
ORDER BY policyname;

-- 测试函数（需要替换为实际的 admin user_id）
-- SELECT 
--   public.is_current_user_admin() AS is_admin,
--   auth.uid() AS current_user_id;

-- ============================================
-- 完成！
-- ============================================
-- 现在 Admin 应该能够查看所有等待中的队列了
-- 如果仍然看不到，请检查：
-- 1. 用户是否真的是 admin（role = 'admin'）
-- 2. is_current_user_admin() 函数是否返回 true
-- 3. 队列状态是否真的是 'waiting'

