-- 修复 role_in_table 为 null 的问题
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 检查当前登录用户
-- ============================================
SELECT 
  'Step 1: Current Auth User' AS step,
  auth.uid() AS current_auth_uid,
  auth.email() AS current_auth_email,
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ No authenticated user - Please login to Supabase'
    ELSE '✅ User authenticated'
  END AS auth_status;

-- ============================================
-- 步骤 2: 查看所有 user_profiles 记录
-- ============================================
SELECT 
  'Step 2: All User Profiles' AS step,
  up.id AS profile_id,
  up.role,
  up.age,
  au.email AS user_email,
  CASE 
    WHEN up.id = auth.uid() THEN '✅ This is current user'
    ELSE 'Other user'
  END AS is_current_user
FROM public.user_profiles up
LEFT JOIN auth.users au ON au.id = up.id
ORDER BY up.created_at DESC;

-- ============================================
-- 步骤 3: 检查当前用户是否有 profile
-- ============================================
SELECT 
  'Step 3: Check Current User Profile' AS step,
  auth.uid() AS auth_user_id,
  up.id AS profile_id,
  up.role,
  CASE 
    WHEN up.id IS NULL THEN '❌ Profile does NOT exist for current user'
    WHEN up.role IS NULL THEN '⚠️ Profile exists but role is NULL'
    WHEN up.role = 'admin' THEN '✅ Profile exists and is admin'
    ELSE '⚠️ Profile exists but role is: ' || up.role
  END AS status
FROM public.user_profiles up
WHERE up.id = auth.uid();

-- ============================================
-- 步骤 4: 创建或更新当前用户的 profile
-- ============================================
-- 方法 1: 如果 profile 不存在，创建它
INSERT INTO public.user_profiles (id, role, age)
SELECT 
  auth.uid(),
  'admin',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles WHERE id = auth.uid()
);

-- 方法 2: 如果 profile 存在但 role 是 NULL，更新它
UPDATE public.user_profiles
SET role = 'admin'
WHERE id = auth.uid() AND (role IS NULL OR role != 'admin');

-- ============================================
-- 步骤 5: 验证修复
-- ============================================
SELECT 
  'Step 5: Verify Fix' AS step,
  auth.uid() AS user_id,
  up.id AS profile_id,
  up.role,
  public.is_current_user_admin() AS is_admin_function,
  CASE 
    WHEN up.role = 'admin' AND public.is_current_user_admin() = true THEN '✅ SUCCESS - User is admin!'
    WHEN up.role = 'admin' AND public.is_current_user_admin() = false THEN '⚠️ Role is admin but function returns false - run fix_function_if_broken.sql'
    WHEN up.role IS NULL THEN '❌ Role is still NULL - check if profile was created'
    ELSE '❌ Role is: ' || COALESCE(up.role, 'NULL')
  END AS status
FROM public.user_profiles up
WHERE up.id = auth.uid();

-- ============================================
-- 步骤 6: 如果 auth.uid() 是 NULL，提供手动设置方法
-- ============================================
-- 如果上面的查询显示 auth.uid() 是 NULL，你需要：
-- 1. 在 Supabase Dashboard → Authentication → Users 中找到你的用户
-- 2. 复制用户 ID
-- 3. 运行下面的查询（替换 YOUR_USER_ID）

-- SELECT 
--   'Step 6: Manual Setup' AS step,
--   'Run this query with your actual user ID:' AS instruction;
-- 
-- -- UPDATE public.user_profiles
-- -- SET role = 'admin'
-- -- WHERE id = 'YOUR_USER_ID_HERE';
-- 
-- -- 或者创建 profile（如果不存在）
-- -- INSERT INTO public.user_profiles (id, role, age)
-- -- VALUES ('YOUR_USER_ID_HERE', 'admin', NULL)
-- -- ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ============================================
-- 步骤 7: 测试 waiting 队列查询
-- ============================================
SELECT 
  'Step 7: Test Waiting Queues' AS step,
  COUNT(*) AS visible_queues,
  public.is_current_user_admin() AS is_admin,
  CASE 
    WHEN public.is_current_user_admin() = true AND COUNT(*) > 0 THEN '✅ SUCCESS - Can see waiting queues!'
    WHEN public.is_current_user_admin() = true AND COUNT(*) = 0 THEN '⚠️ Admin but no queues visible (check RLS or no data)'
    WHEN public.is_current_user_admin() = false THEN '❌ NOT admin - cannot see queues'
    ELSE '❌ Unknown issue'
  END AS status
FROM public.consultation_queue
WHERE status = 'waiting' AND public.is_current_user_admin();

-- ============================================
-- 完成！
-- ============================================
-- 查看 Step 5 和 Step 7 的结果
-- 如果都显示 ✅ SUCCESS，刷新浏览器应该能看到队列了

