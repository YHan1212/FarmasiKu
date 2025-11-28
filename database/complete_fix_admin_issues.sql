-- 完整修复 Admin 相关问题
-- 1. 设置用户为 Admin
-- 2. 修复 doctors 表 RLS 策略
-- 3. 修复 consultation_queue 表 RLS 策略
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 设置当前用户为 Admin（安全方式）
-- ============================================
-- 先检查用户是否存在
DO $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user found. Please make sure you are logged in.';
  END IF;
  
  -- 更新或插入
  UPDATE public.user_profiles
  SET role = 'admin'
  WHERE id = current_user_id;
  
  -- 如果更新了 0 行，说明 profile 不存在（不应该发生，但以防万一）
  IF NOT FOUND THEN
    INSERT INTO public.user_profiles (id, role, age)
    VALUES (current_user_id, 'admin', NULL);
  END IF;
END $$;

-- 验证
SELECT 
  'Step 1: Set User as Admin' AS step,
  id,
  role,
  public.is_current_user_admin() AS is_admin,
  CASE 
    WHEN role = 'admin' THEN '✅ User is now Admin'
    ELSE '❌ Failed to set as Admin'
  END AS status
FROM public.user_profiles
WHERE id = auth.uid();

-- ============================================
-- 步骤 2: 确保 is_current_user_admin() 函数存在
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
-- 步骤 3: 修复 doctors 表 RLS 策略
-- ============================================

-- 删除所有现有策略
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'doctors'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.doctors', policy_record.policyname);
  END LOOP;
END $$;

-- 重新创建策略
CREATE POLICY "Anyone can view available doctors"
  ON public.doctors
  FOR SELECT
  USING (is_available = true);

CREATE POLICY "Admins can view all doctors"
  ON public.doctors
  FOR SELECT
  USING (public.is_current_user_admin());

CREATE POLICY "Users can view own linked doctor"
  ON public.doctors
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert doctors"
  ON public.doctors
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own linked doctor"
  ON public.doctors
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all doctors"
  ON public.doctors
  FOR UPDATE
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can delete doctors"
  ON public.doctors
  FOR DELETE
  USING (public.is_current_user_admin());

-- ============================================
-- 步骤 4: 修复 consultation_queue 表 RLS 策略
-- ============================================

-- 删除所有现有策略
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

-- 重新创建策略
CREATE POLICY "Users can view own queue"
  ON public.consultation_queue
  FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Admins can view all waiting queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    status = 'waiting' AND public.is_current_user_admin()
  );

CREATE POLICY "Admins can view matched queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    status IN ('matched', 'in_consultation') AND public.is_current_user_admin()
  );

CREATE POLICY "Linked pharmacists can view waiting queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    status = 'waiting' AND EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create queue"
  ON public.consultation_queue
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

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
-- 步骤 5: 验证所有设置
-- ============================================

-- 验证用户角色
SELECT 
  'Final Verification: User Role' AS step,
  id,
  role,
  public.is_current_user_admin() AS is_admin
FROM public.user_profiles
WHERE id = auth.uid();

-- 验证 doctors 查询
SELECT 
  'Final Verification: Doctors Query' AS step,
  COUNT(*) AS total_doctors,
  COUNT(*) FILTER (WHERE user_id = auth.uid()) AS own_doctors
FROM public.doctors;

-- 验证 waiting 队列查询
SELECT 
  'Final Verification: Waiting Queues Query' AS step,
  COUNT(*) AS waiting_queues_count,
  public.is_current_user_admin() AS is_admin
FROM public.consultation_queue
WHERE status = 'waiting';

-- ============================================
-- 完成！
-- ============================================
-- 现在应该：
-- 1. ✅ 用户角色是 'admin'
-- 2. ✅ 可以查询 doctors 表（不会返回 406 错误）
-- 3. ✅ 可以查看所有 waiting 队列
-- 4. ✅ 刷新浏览器页面，应该能看到 Pharmacist Dashboard

