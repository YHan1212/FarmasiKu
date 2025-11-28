-- 验证和修复用户设置
-- Admin: 56e324aa-e1dd-40a8-9e96-2473cfcba661
-- User: abf84f0a-5b14-4aa1-8521-54a1ffa8daab

-- ============================================
-- 步骤 1: 检查两个用户的当前状态
-- ============================================
SELECT 
  'Step 1: Check Users' AS step,
  up.id AS user_id,
  au.email AS email,
  up.role AS current_role,
  CASE 
    WHEN up.id = '56e324aa-e1dd-40a8-9e96-2473cfcba661' AND up.role = 'admin' THEN '✅ Admin user correct'
    WHEN up.id = '56e324aa-e1dd-40a8-9e96-2473cfcba661' AND up.role != 'admin' THEN '❌ Admin user role is wrong'
    WHEN up.id = 'abf84f0a-5b14-4aa1-8521-54a1ffa8daab' AND up.role = 'user' THEN '✅ User correct'
    WHEN up.id = 'abf84f0a-5b14-4aa1-8521-54a1ffa8daab' AND up.role != 'user' THEN '⚠️ User role is: ' || COALESCE(up.role, 'NULL')
    WHEN up.id IS NULL THEN '❌ User profile does not exist'
    ELSE 'Other'
  END AS status
FROM public.user_profiles up
LEFT JOIN auth.users au ON au.id = up.id
WHERE up.id IN (
  '56e324aa-e1dd-40a8-9e96-2473cfcba661',
  'abf84f0a-5b14-4aa1-8521-54a1ffa8daab'
)
ORDER BY 
  CASE 
    WHEN up.id = '56e324aa-e1dd-40a8-9e96-2473cfcba661' THEN 1
    ELSE 2
  END;

-- ============================================
-- 步骤 2: 确保 Admin 用户角色正确
-- ============================================
-- 设置 Admin 用户
UPDATE public.user_profiles
SET role = 'admin'
WHERE id = '56e324aa-e1dd-40a8-9e96-2473cfcba661';

-- 如果 profile 不存在，创建它
INSERT INTO public.user_profiles (id, role, age)
VALUES ('56e324aa-e1dd-40a8-9e96-2473cfcba661', 'admin', NULL)
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ============================================
-- 步骤 3: 确保 User 用户角色正确
-- ============================================
-- 设置 User 用户
UPDATE public.user_profiles
SET role = 'user'
WHERE id = 'abf84f0a-5b14-4aa1-8521-54a1ffa8daab';

-- 如果 profile 不存在，创建它
INSERT INTO public.user_profiles (id, role, age)
VALUES ('abf84f0a-5b14-4aa1-8521-54a1ffa8daab', 'user', NULL)
ON CONFLICT (id) DO UPDATE SET role = 'user';

-- ============================================
-- 步骤 4: 验证设置
-- ============================================
SELECT 
  'Step 4: Verify Settings' AS step,
  up.id AS user_id,
  au.email AS email,
  up.role AS role,
  CASE 
    WHEN up.id = '56e324aa-e1dd-40a8-9e96-2473cfcba661' THEN 
      CASE 
        WHEN up.role = 'admin' THEN '✅ Admin user is correct'
        ELSE '❌ Admin user role is wrong: ' || COALESCE(up.role, 'NULL')
      END
    WHEN up.id = 'abf84f0a-5b14-4aa1-8521-54a1ffa8daab' THEN 
      CASE 
        WHEN up.role = 'user' THEN '✅ User is correct'
        ELSE '⚠️ User role is: ' || COALESCE(up.role, 'NULL')
      END
  END AS status
FROM public.user_profiles up
LEFT JOIN auth.users au ON au.id = up.id
WHERE up.id IN (
  '56e324aa-e1dd-40a8-9e96-2473cfcba661',
  'abf84f0a-5b14-4aa1-8521-54a1ffa8daab'
)
ORDER BY 
  CASE 
    WHEN up.id = '56e324aa-e1dd-40a8-9e96-2473cfcba661' THEN 1
    ELSE 2
  END;

-- ============================================
-- 步骤 5: 测试 Admin 用户查询 waiting 队列
-- ============================================
-- 注意：这个查询需要以 Admin 用户身份登录才能测试
-- 如果当前登录的不是 Admin 用户，这个查询会返回 0

-- 先检查当前登录用户
SELECT 
  'Step 5a: Current Logged In User' AS step,
  auth.uid() AS current_user_id,
  CASE 
    WHEN auth.uid() = '56e324aa-e1dd-40a8-9e96-2473cfcba661' THEN '✅ Logged in as Admin'
    WHEN auth.uid() = 'abf84f0a-5b14-4aa1-8521-54a1ffa8daab' THEN '⚠️ Logged in as User (not Admin)'
    WHEN auth.uid() IS NULL THEN '❌ Not logged in'
    ELSE '⚠️ Logged in as different user: ' || auth.uid()::text
  END AS status;

-- 测试 Admin 函数（需要以 Admin 用户登录）
SELECT 
  'Step 5b: Test Admin Function' AS step,
  auth.uid() AS current_user_id,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS role_in_table,
  public.is_current_user_admin() AS function_result,
  CASE 
    WHEN auth.uid() = '56e324aa-e1dd-40a8-9e96-2473cfcba661' 
         AND public.is_current_user_admin() = true 
    THEN '✅ Admin function works correctly!'
    WHEN auth.uid() = '56e324aa-e1dd-40a8-9e96-2473cfcba661' 
         AND public.is_current_user_admin() = false 
    THEN '❌ Admin function returns false - run fix_function_if_broken.sql'
    WHEN auth.uid() != '56e324aa-e1dd-40a8-9e96-2473cfcba661' 
    THEN '⚠️ Not logged in as Admin user - please login as Admin first'
    ELSE '❌ Unknown issue'
  END AS status;

-- 测试 waiting 队列查询（需要以 Admin 用户登录）
SELECT 
  'Step 5c: Test Waiting Queues Query' AS step,
  COUNT(*) AS visible_queues,
  public.is_current_user_admin() AS is_admin,
  CASE 
    WHEN auth.uid() = '56e324aa-e1dd-40a8-9e96-2473cfcba661' 
         AND public.is_current_user_admin() = true 
         AND COUNT(*) > 0 
    THEN '✅ SUCCESS - Admin can see waiting queues!'
    WHEN auth.uid() = '56e324aa-e1dd-40a8-9e96-2473cfcba661' 
         AND public.is_current_user_admin() = true 
         AND COUNT(*) = 0 
    THEN '⚠️ Admin but no queues visible (check RLS or no data)'
    WHEN auth.uid() != '56e324aa-e1dd-40a8-9e96-2473cfcba661' 
    THEN '⚠️ Not logged in as Admin - login as Admin user first'
    ELSE '❌ Cannot see queues'
  END AS status
FROM public.consultation_queue
WHERE status = 'waiting' AND public.is_current_user_admin();

-- ============================================
-- 步骤 6: 显示所有 waiting 队列（如果 Admin 登录）
-- ============================================
SELECT 
  'Step 6: All Waiting Queues' AS step,
  id,
  patient_id,
  status,
  created_at
FROM public.consultation_queue
WHERE status = 'waiting'
ORDER BY created_at DESC;

-- ============================================
-- 完成！
-- ============================================
-- 重要提示：
-- 1. 确保以 Admin 用户 (56e324aa-e1dd-40a8-9e96-2473cfcba661) 登录 Supabase
-- 2. 查看 Step 5b 和 Step 5c 的结果
-- 3. 如果显示 ✅ SUCCESS，刷新浏览器应该能看到队列了

