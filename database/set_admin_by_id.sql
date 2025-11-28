-- 使用用户 ID 直接设置 Admin
-- 在 Supabase SQL Editor 中运行此脚本
-- 替换 YOUR_USER_ID 为实际的用户 ID

-- ============================================
-- 方法 1: 如果你知道用户 ID，直接设置
-- ============================================
-- 替换 'YOUR_USER_ID_HERE' 为实际的用户 ID（UUID 格式）
-- 例如: 'abf84f0a-5b14-4aa1-8521-54a1ffa8daab'

-- UPDATE public.user_profiles
-- SET role = 'admin'
-- WHERE id = 'YOUR_USER_ID_HERE';

-- 如果 profile 不存在，创建它：
-- INSERT INTO public.user_profiles (id, role, age)
-- VALUES ('YOUR_USER_ID_HERE', 'admin', NULL)
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

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
-- 先运行这个查询，找到你的用户 ID
SELECT 
  'All Users' AS step,
  au.id AS user_id,
  au.email AS email,
  up.role AS current_role,
  CASE 
    WHEN up.role = 'admin' THEN '✅ Already admin'
    WHEN up.id IS NULL THEN '❌ No profile'
    ELSE '⚠️ Role: ' || COALESCE(up.role, 'NULL')
  END AS status
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
ORDER BY au.created_at DESC;

-- 找到你的用户后，使用方法 1 或 2 设置

-- ============================================
-- 方法 4: 设置多个用户为 Admin（如果需要）
-- ============================================
-- 设置多个用户 ID 为 admin
-- UPDATE public.user_profiles
-- SET role = 'admin'
-- WHERE id IN (
--   'user-id-1',
--   'user-id-2',
--   'user-id-3'
-- );

-- ============================================
-- 验证设置
-- ============================================
-- 设置后，运行这个查询验证：
-- SELECT 
--   id,
--   role,
--   public.is_current_user_admin() AS is_admin_function
-- FROM public.user_profiles
-- WHERE id = 'YOUR_USER_ID_HERE';

-- ============================================
-- 快速设置（如果你知道你的用户 ID）
-- ============================================
-- 直接运行这个，替换 YOUR_USER_ID：
-- 
-- INSERT INTO public.user_profiles (id, role, age)
-- VALUES ('YOUR_USER_ID', 'admin', NULL)
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';
--
-- 然后验证：
-- SELECT id, role, public.is_current_user_admin() AS is_admin
-- FROM public.user_profiles
-- WHERE id = 'YOUR_USER_ID';

