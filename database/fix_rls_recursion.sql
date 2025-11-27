-- 修复 RLS 策略的无限递归问题
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 问题：RLS 策略在检查 user_profiles 时又查询 user_profiles，导致无限递归
-- 解决方案：使用 SECURITY DEFINER 函数来检查角色
-- ============================================

-- 步骤 1: 删除有问题的策略
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_profiles;

-- 步骤 2: 创建 SECURITY DEFINER 函数来检查当前用户是否为管理员
-- 这个函数在安全上下文中运行，可以绕过 RLS
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

-- 步骤 3: 确保用户可以看到自己的 profile（基础策略）
-- 这个策略应该已经存在，但为了安全起见，我们确保它存在
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 步骤 4: 创建新的 RLS 策略（使用函数避免递归）
-- 允许管理员查看所有用户的 profile
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (public.is_current_user_admin());

-- 步骤 5: 允许管理员更新用户角色
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_profiles;
CREATE POLICY "Admins can update user roles"
  ON public.user_profiles
  FOR UPDATE
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- 步骤 6: 验证设置
SELECT 
  'Policy created successfully' AS status,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE tablename = 'user_profiles';

-- 步骤 7: 测试函数
SELECT 
  public.is_current_user_admin() AS is_admin,
  auth.uid() AS current_user_id;

