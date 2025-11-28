-- 彻底诊断和修复 Admin 无法查看 waiting 队列的问题
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 检查当前用户信息
-- ============================================
SELECT 
  'Step 1: Current User Info' AS step,
  auth.uid() AS current_user_id,
  up.id AS profile_id,
  up.role AS current_role,
  up.age,
  up.created_at AS profile_created_at
FROM public.user_profiles up
WHERE up.id = auth.uid();

-- ============================================
-- 步骤 2: 检查 is_current_user_admin() 函数
-- ============================================
SELECT 
  'Step 2: Check Function' AS step,
  proname AS function_name,
  prosrc AS function_source
FROM pg_proc
WHERE proname = 'is_current_user_admin';

-- 测试函数
SELECT 
  'Step 2b: Test Function' AS step,
  public.is_current_user_admin() AS function_result,
  auth.uid() AS current_user_id;

-- ============================================
-- 步骤 3: 强制设置当前用户为 Admin
-- ============================================
-- 先检查 auth.uid() 是否存在
DO $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user found. Please make sure you are logged in.';
  END IF;
  
  -- 使用 INSERT ... ON CONFLICT 或 UPDATE
  INSERT INTO public.user_profiles (id, role, age)
  VALUES (current_user_id, 'admin', NULL)
  ON CONFLICT (id) 
  DO UPDATE SET role = 'admin';
  
  RAISE NOTICE 'User % set as admin', current_user_id;
END $$;

-- 验证设置
SELECT 
  'Step 3: Verify Admin Role' AS step,
  id,
  role,
  public.is_current_user_admin() AS is_admin,
  CASE 
    WHEN role = 'admin' AND public.is_current_user_admin() = true THEN '✅ User is Admin'
    WHEN role = 'admin' AND public.is_current_user_admin() = false THEN '❌ Role is admin but function returns false - check function'
    WHEN role != 'admin' THEN '❌ Role is NOT admin - UPDATE failed'
    ELSE '❌ Unknown issue'
  END AS status
FROM public.user_profiles
WHERE id = auth.uid();

-- ============================================
-- 步骤 4: 重新创建 is_current_user_admin() 函数（确保正确）
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

-- 再次测试函数
SELECT 
  'Step 4: Test Function After Recreation' AS step,
  public.is_current_user_admin() AS function_result,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS user_role,
  CASE 
    WHEN public.is_current_user_admin() = true THEN '✅ Function works correctly'
    ELSE '❌ Function still returns false'
  END AS status;

-- ============================================
-- 步骤 5: 检查 waiting 队列
-- ============================================
SELECT 
  'Step 5: Check Waiting Queues' AS step,
  COUNT(*) AS total_waiting_queues,
  id,
  patient_id,
  status,
  created_at
FROM public.consultation_queue
WHERE status = 'waiting'
GROUP BY id, patient_id, status, created_at
ORDER BY created_at DESC;

-- ============================================
-- 步骤 6: 检查 consultation_queue 的 RLS 策略
-- ============================================
SELECT 
  'Step 6: Check RLS Policies' AS step,
  policyname,
  cmd,
  qual AS condition
FROM pg_policies
WHERE tablename = 'consultation_queue'
ORDER BY policyname;

-- ============================================
-- 步骤 7: 测试 Admin 查询 waiting 队列
-- ============================================
SELECT 
  'Step 7: Test Admin Query' AS step,
  id,
  patient_id,
  status,
  created_at,
  public.is_current_user_admin() AS is_admin,
  CASE 
    WHEN public.is_current_user_admin() = true THEN '✅ Should be able to see this queue'
    ELSE '❌ NOT admin - cannot see queue'
  END AS status
FROM public.consultation_queue
WHERE status = 'waiting';

-- ============================================
-- 步骤 8: 修复 consultation_queue RLS 策略（如果查询返回空）
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
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
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
-- 步骤 9: 再次测试查询（应该能看到数据了）
-- ============================================
SELECT 
  'Step 9: Final Test Query' AS step,
  COUNT(*) AS visible_waiting_queues,
  public.is_current_user_admin() AS is_admin,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS user_role,
  CASE 
    WHEN public.is_current_user_admin() = true AND COUNT(*) > 0 THEN '✅ SUCCESS - Admin can see waiting queues!'
    WHEN public.is_current_user_admin() = true AND COUNT(*) = 0 THEN '⚠️ Admin but no waiting queues exist'
    WHEN public.is_current_user_admin() = false THEN '❌ FAILED - User is NOT admin'
    ELSE '❌ Unknown issue'
  END AS final_status
FROM public.consultation_queue
WHERE status = 'waiting' AND public.is_current_user_admin();

-- ============================================
-- 步骤 10: 显示所有 waiting 队列（如果能看到）
-- ============================================
SELECT 
  'Step 10: All Waiting Queues' AS step,
  id,
  patient_id,
  status,
  matched_pharmacist_id,
  created_at
FROM public.consultation_queue
WHERE status = 'waiting'
ORDER BY created_at DESC;

-- ============================================
-- 完成！
-- ============================================
-- 查看 Step 9 的结果：
-- - 如果显示 ✅ SUCCESS，说明修复成功，刷新浏览器应该能看到队列
-- - 如果显示 ❌ FAILED，说明用户角色设置失败，需要手动检查 user_profiles 表
-- - 如果显示 ⚠️，说明没有 waiting 队列，需要创建一个测试队列

