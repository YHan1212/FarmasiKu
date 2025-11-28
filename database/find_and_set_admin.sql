-- 查找所有用户并设置 Admin（如果不知道当前用户 ID）
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 查看所有用户（从 auth.users）
-- ============================================
SELECT 
  'Step 1: All Auth Users' AS step,
  au.id AS user_id,
  au.email AS email,
  au.created_at AS user_created_at,
  up.role AS current_role,
  CASE 
    WHEN up.id IS NULL THEN '❌ No profile - needs creation'
    WHEN up.role = 'admin' THEN '✅ Already admin'
    WHEN up.role IS NULL THEN '⚠️ Profile exists but role is NULL'
    ELSE '⚠️ Role is: ' || up.role
  END AS status
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
ORDER BY au.created_at DESC;

-- ============================================
-- 步骤 2: 查看所有 user_profiles
-- ============================================
SELECT 
  'Step 2: All User Profiles' AS step,
  up.id AS profile_id,
  up.role,
  up.age,
  au.email AS email,
  CASE 
    WHEN au.id IS NULL THEN '⚠️ Profile exists but no auth user'
    WHEN up.role = 'admin' THEN '✅ Admin'
    WHEN up.role IS NULL THEN '⚠️ Role is NULL'
    ELSE 'Role: ' || up.role
  END AS status
FROM public.user_profiles up
LEFT JOIN auth.users au ON au.id = up.id
ORDER BY up.created_at DESC;

-- ============================================
-- 步骤 3: 设置所有 NULL role 为 'user'（安全措施）
-- ============================================
-- 先查看哪些是 NULL
SELECT 
  'Step 3: Profiles with NULL role' AS step,
  COUNT(*) AS null_role_count
FROM public.user_profiles
WHERE role IS NULL;

-- 更新 NULL role 为 'user'（默认值）
UPDATE public.user_profiles
SET role = 'user'
WHERE role IS NULL;

-- ============================================
-- 步骤 4: 设置特定用户为 Admin（手动选择）
-- ============================================
-- 从 Step 1 的结果中，找到你的用户 ID 和邮箱
-- 然后运行下面的查询（替换 YOUR_USER_ID 和 YOUR_EMAIL）

-- 示例：设置邮箱为 'admin@example.com' 的用户为 admin
-- UPDATE public.user_profiles
-- SET role = 'admin'
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'admin@example.com'
-- );

-- 或者直接使用用户 ID：
-- UPDATE public.user_profiles
-- SET role = 'admin'
-- WHERE id = 'YOUR_USER_ID_HERE';

-- 或者如果 profile 不存在，创建它：
-- INSERT INTO public.user_profiles (id, role, age)
-- VALUES ('YOUR_USER_ID_HERE', 'admin', NULL)
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ============================================
-- 步骤 5: 验证所有设置
-- ============================================
SELECT 
  'Step 5: Final Verification' AS step,
  up.id,
  au.email,
  up.role,
  public.is_current_user_admin() AS is_admin_function,
  CASE 
    WHEN up.role = 'admin' THEN '✅ Admin'
    WHEN up.role = 'user' THEN 'User'
    WHEN up.role IS NULL THEN '❌ NULL'
    ELSE 'Other: ' || up.role
  END AS status
FROM public.user_profiles up
LEFT JOIN auth.users au ON au.id = up.id
ORDER BY up.created_at DESC;

-- ============================================
-- 完成！
-- ============================================
-- 从 Step 1 找到你的用户，然后使用 Step 4 的方法设置

