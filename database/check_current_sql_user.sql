-- 检查当前 Supabase SQL Editor 中登录的用户
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 检查当前 SQL Editor 中的用户
-- ============================================
SELECT 
  'Current SQL Editor User' AS step,
  auth.uid() AS current_user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) AS email,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS role,
  CASE 
    WHEN auth.uid() = '56e324aa-e1dd-40a8-9e96-2473cfcba661' THEN '✅ Admin user'
    WHEN auth.uid() = 'abf84f0a-5b14-4aa1-8521-54a1ffa8daab' THEN '⚠️ User (not Admin)'
    WHEN auth.uid() IS NULL THEN '❌ No user logged in'
    ELSE '⚠️ Different user: ' || auth.uid()::text
  END AS status;

-- ============================================
-- 步骤 2: 显示两个用户的详细信息
-- ============================================
SELECT 
  'All Users Info' AS step,
  au.id AS user_id,
  au.email AS email,
  up.role AS role,
  CASE 
    WHEN au.id = auth.uid() THEN '✅ Currently logged in SQL Editor'
    ELSE 'Not current user'
  END AS is_current
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE au.id IN (
  '56e324aa-e1dd-40a8-9e96-2473cfcba661',
  'abf84f0a-5b14-4aa1-8521-54a1ffa8daab'
)
ORDER BY 
  CASE 
    WHEN au.id = auth.uid() THEN 1
    ELSE 2
  END;

-- ============================================
-- 重要提示
-- ============================================
-- Supabase SQL Editor 可能使用：
-- 1. 项目所有者（service_role）的权限
-- 2. 或者你登录 Supabase Dashboard 时使用的账户
-- 
-- 要测试 Admin 功能，最好在应用中测试，因为：
-- 1. 应用中的用户是明确的（你登录时使用的用户）
-- 2. RLS 策略在应用中会正确应用
-- 
-- 在应用中测试：
-- 1. 以 Admin 用户登录应用
-- 2. 进入 Pharmacist Dashboard
-- 3. 查看浏览器控制台的日志
-- 4. 检查 Network 标签中的 API 请求

