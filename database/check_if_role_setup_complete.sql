-- 检查用户角色系统是否完整设置
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 检查 1: role 字段是否存在
-- ============================================
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_profiles' AND column_name = 'role'
    ) THEN '✅ role 字段已存在'
    ELSE '❌ role 字段不存在 - 需要运行脚本'
  END AS role_field_status;

-- ============================================
-- 检查 2: RLS 策略是否存在
-- ============================================
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'user_profiles' 
      AND policyname = 'Admins can view all profiles'
    ) THEN '✅ RLS 策略已设置'
    ELSE '❌ RLS 策略未设置 - 需要运行完整脚本'
  END AS rls_policy_status;

-- ============================================
-- 检查 3: 函数是否存在
-- ============================================
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'is_admin'
    ) THEN '✅ 函数已创建'
    ELSE '❌ 函数未创建 - 需要运行完整脚本'
  END AS function_status;

-- ============================================
-- 检查 4: 查看当前用户角色
-- ============================================
SELECT 
  id,
  role,
  created_at
FROM public.user_profiles
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 总结
-- ============================================
-- 如果所有检查都显示 ✅，说明已经完整设置
-- 如果有 ❌，需要运行 add_user_role.sql 完整脚本

