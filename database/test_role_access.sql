-- 测试用户角色访问
-- 在 Supabase SQL Editor 中运行此脚本
-- 注意：在 SQL Editor 中运行，auth.uid() 会返回 null，这是正常的

-- ============================================
-- 步骤 1: 检查 role 字段和用户数据
-- ============================================
SELECT 
  id,
  role,
  created_at
FROM public.user_profiles
WHERE id = '56e324aa-e1dd-40a8-9e96-2473cfcba661';

-- ============================================
-- 步骤 2: 检查策略
-- ============================================
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- ============================================
-- 步骤 3: 检查函数
-- ============================================
SELECT 
  proname AS function_name,
  prosrc AS function_body
FROM pg_proc
WHERE proname = 'is_current_user_admin';

-- ============================================
-- 步骤 4: 手动测试（模拟用户查询）
-- ============================================
-- 这个查询应该能返回用户数据（如果用户已登录）
-- 在 SQL Editor 中，auth.uid() 会返回 null，所以这个查询可能返回空
-- 但在应用中，如果用户已登录，应该能正常工作

-- 检查用户是否为管理员（直接查询，不使用函数）
SELECT 
  id,
  role,
  CASE 
    WHEN role = 'admin' THEN '✅ 是管理员'
    ELSE '❌ 不是管理员'
  END AS admin_status
FROM public.user_profiles
WHERE id = '56e324aa-e1dd-40a8-9e96-2473cfcba661';

-- ============================================
-- 步骤 5: 如果角色不是 admin，设置为 admin
-- ============================================
-- 如果上面的查询显示不是管理员，运行这个：
-- UPDATE public.user_profiles 
-- SET role = 'admin' 
-- WHERE id = '56e324aa-e1dd-40a8-9e96-2473cfcba661';

