-- 如果函数返回 false 但角色是 admin，重新创建函数
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 删除旧函数
-- ============================================
DROP FUNCTION IF EXISTS public.is_current_user_admin();

-- ============================================
-- 步骤 2: 重新创建函数（确保正确）
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
  
  -- 直接查询 user_profiles（绕过 RLS，因为函数是 SECURITY DEFINER）
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = current_user_id;
  
  -- 返回是否为管理员
  -- 如果 role 是 NULL，默认为 'user'
  RETURN COALESCE(user_role, 'user') = 'admin';
END;
$$;

-- ============================================
-- 步骤 3: 验证函数
-- ============================================
SELECT 
  'Verification' AS step,
  auth.uid() AS user_id,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS role_in_table,
  public.is_current_user_admin() AS function_result,
  CASE 
    WHEN (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin' 
         AND public.is_current_user_admin() = true 
    THEN '✅ Function works correctly!'
    WHEN (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin' 
         AND public.is_current_user_admin() = false 
    THEN '❌ Function still broken - check function source'
    ELSE '⚠️ Role is not admin'
  END AS status;

-- ============================================
-- 完成！
-- ============================================
-- 如果 status 显示 ✅，函数已修复
-- 然后运行 test_admin_access.sql 测试完整流程

