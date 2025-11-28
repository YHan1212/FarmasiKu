-- 直接测试 Admin 用户（不依赖 auth.uid()）
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 检查 Admin 用户的 profile
-- ============================================
SELECT 
  'Step 1: Admin User Profile' AS step,
  up.id AS user_id,
  au.email AS email,
  up.role AS role,
  CASE 
    WHEN up.role = 'admin' THEN '✅ Admin role is correct'
    WHEN up.role IS NULL THEN '❌ Role is NULL'
    ELSE '❌ Role is wrong: ' || up.role
  END AS status
FROM public.user_profiles up
LEFT JOIN auth.users au ON au.id = up.id
WHERE up.id = '56e324aa-e1dd-40a8-9e96-2473cfcba661';

-- ============================================
-- 步骤 2: 确保 Admin 用户角色正确
-- ============================================
UPDATE public.user_profiles
SET role = 'admin'
WHERE id = '56e324aa-e1dd-40a8-9e96-2473cfcba661';

-- 如果不存在，创建
INSERT INTO public.user_profiles (id, role, age)
VALUES ('56e324aa-e1dd-40a8-9e96-2473cfcba661', 'admin', NULL)
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ============================================
-- 步骤 3: 测试 is_current_user_admin() 函数（模拟 Admin 用户）
-- ============================================
-- 注意：这个测试需要以 Admin 用户身份登录
-- 如果当前不是 Admin 用户，函数会返回 false

SELECT 
  'Step 3: Test Function as Admin' AS step,
  auth.uid() AS current_user_id,
  CASE 
    WHEN auth.uid() = '56e324aa-e1dd-40a8-9e96-2473cfcba661' THEN '✅ Logged in as Admin'
    ELSE '⚠️ Not logged in as Admin - current user: ' || COALESCE(auth.uid()::text, 'NULL')
  END AS login_status,
  (SELECT role FROM public.user_profiles WHERE id = '56e324aa-e1dd-40a8-9e96-2473cfcba661') AS admin_role,
  public.is_current_user_admin() AS function_result;

-- ============================================
-- 步骤 4: 检查 waiting 队列
-- ============================================
SELECT 
  'Step 4: Waiting Queues' AS step,
  COUNT(*) AS total_waiting_queues,
  id,
  patient_id,
  status,
  created_at
FROM public.consultation_queue
WHERE status = 'waiting'
GROUP BY id, patient_id, status, created_at
ORDER BY created_at DESC;

-- ============================================
-- 步骤 5: 测试 Admin 能否看到队列（需要以 Admin 登录）
-- ============================================
SELECT 
  'Step 5: Admin Query Test' AS step,
  COUNT(*) AS visible_queues,
  public.is_current_user_admin() AS is_admin,
  auth.uid() AS current_user_id
FROM public.consultation_queue
WHERE status = 'waiting' AND public.is_current_user_admin();

-- ============================================
-- 重要提示
-- ============================================
-- 要测试 Admin 功能，必须：
-- 1. 在 Supabase Dashboard 中以 Admin 用户登录
-- 2. 或者在应用中以 Admin 用户登录，然后在浏览器中查看
-- 
-- 如果 Step 3 显示 "Not logged in as Admin"：
-- - 在 Supabase Dashboard → Authentication → Users
-- - 找到用户 56e324aa-e1dd-40a8-9e96-2473cfcba661
-- - 使用该用户的邮箱登录应用
-- - 然后刷新 Pharmacist Dashboard

