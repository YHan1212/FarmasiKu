-- 设置特定用户为 Admin（如果知道用户 ID 或邮箱）
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 方法 1: 通过用户 ID 设置（推荐）
-- ============================================
-- 替换 'YOUR_USER_ID_HERE' 为实际的用户 ID
-- 可以在 Supabase Dashboard → Authentication → Users 中找到

-- UPDATE public.user_profiles
-- SET role = 'admin'
-- WHERE id = 'YOUR_USER_ID_HERE';

-- ============================================
-- 方法 2: 通过邮箱查找并设置
-- ============================================
-- 替换 'your-email@example.com' 为实际的邮箱地址

-- UPDATE public.user_profiles
-- SET role = 'admin'
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'your-email@example.com'
-- );

-- ============================================
-- 方法 3: 查看所有用户，然后选择设置
-- ============================================
SELECT 
  up.id AS user_id,
  au.email AS user_email,
  up.role AS current_role,
  up.age,
  up.created_at
FROM public.user_profiles up
LEFT JOIN auth.users au ON au.id = up.id
ORDER BY up.created_at DESC;

-- 运行上面的查询后，找到你的用户，然后使用方法 1 或 2 设置

-- ============================================
-- 方法 4: 设置当前登录用户（最简单）
-- ============================================
UPDATE public.user_profiles
SET role = 'admin'
WHERE id = auth.uid();

-- 验证
SELECT 
  id,
  role,
  public.is_current_user_admin() AS is_admin
FROM public.user_profiles
WHERE id = auth.uid();

