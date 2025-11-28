-- 修复 doctors 表的 RLS 策略，允许 Admin 查看所有 doctors
-- 解决 406 错误问题

-- ============================================
-- 步骤 1: 删除所有现有的 doctors RLS 策略
-- ============================================

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

-- 手动删除可能遗漏的策略
DROP POLICY IF EXISTS "Anyone can view doctors" ON public.doctors;
DROP POLICY IF EXISTS "Authenticated users can view all doctors" ON public.doctors;
DROP POLICY IF EXISTS "Users can view own doctor" ON public.doctors;
DROP POLICY IF EXISTS "Admins can view all doctors" ON public.doctors;
DROP POLICY IF EXISTS "Authenticated users can insert doctors" ON public.doctors;
DROP POLICY IF EXISTS "Users can update own doctor profile" ON public.doctors;
DROP POLICY IF EXISTS "Authenticated users can update doctors" ON public.doctors;
DROP POLICY IF EXISTS "Allow authenticated users to delete doctors" ON public.doctors;

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
-- 步骤 3: 重新创建 RLS 策略
-- ============================================

-- 策略 1: 所有人可以查看可用的 doctors（用于用户端显示）
CREATE POLICY "Anyone can view available doctors"
  ON public.doctors
  FOR SELECT
  USING (is_available = true);

-- 策略 2: Admin 可以查看所有 doctors（包括 user_id）
CREATE POLICY "Admins can view all doctors"
  ON public.doctors
  FOR SELECT
  USING (public.is_current_user_admin());

-- 策略 3: 用户可以查看链接给自己的 doctor
CREATE POLICY "Users can view own linked doctor"
  ON public.doctors
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- 步骤 4: INSERT 策略
-- ============================================

-- 允许认证用户创建 doctors（用于 Admin 创建 pharmacist）
CREATE POLICY "Authenticated users can insert doctors"
  ON public.doctors
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- 步骤 5: UPDATE 策略
-- ============================================

-- 用户可以更新链接给自己的 doctor
CREATE POLICY "Users can update own linked doctor"
  ON public.doctors
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin 可以更新所有 doctors（用于 link/unlink pharmacist account）
CREATE POLICY "Admins can update all doctors"
  ON public.doctors
  FOR UPDATE
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- ============================================
-- 步骤 6: DELETE 策略
-- ============================================

-- Admin 可以删除 doctors
CREATE POLICY "Admins can delete doctors"
  ON public.doctors
  FOR DELETE
  USING (public.is_current_user_admin());

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
WHERE tablename = 'doctors'
ORDER BY 
  CASE cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
    ELSE 5
  END,
  policyname;

-- 测试查询（Admin 应该能看到所有 doctors）
SELECT 
  'Verification: Test Admin Query' AS step,
  COUNT(*) AS total_doctors,
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) AS linked_doctors,
  public.is_current_user_admin() AS is_admin
FROM public.doctors;

-- 测试查询链接给自己的 doctor
SELECT 
  'Verification: Test Own Doctor Query' AS step,
  COUNT(*) AS own_doctors_count,
  auth.uid() AS current_user_id
FROM public.doctors
WHERE user_id = auth.uid();

-- ============================================
-- 完成！
-- ============================================
-- 现在 Admin 应该能够：
-- 1. 查看所有 doctors（包括 user_id）
-- 2. 查询 doctors 表不会返回 406 错误
-- 3. 可以 link/unlink pharmacist account

