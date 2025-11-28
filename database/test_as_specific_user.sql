-- 测试特定用户的权限（模拟）
-- 注意：这个脚本不能真正切换用户，但可以测试特定用户的权限逻辑

-- ============================================
-- 方法 1: 测试 Admin 用户的权限逻辑
-- ============================================
-- 直接使用 Admin 用户 ID 测试条件
SELECT 
  'Test as Admin User' AS step,
  '56e324aa-e1dd-40a8-9e96-2473cfcba661'::uuid AS test_user_id,
  (SELECT role FROM public.user_profiles WHERE id = '56e324aa-e1dd-40a8-9e96-2473cfcba661') AS role,
  (SELECT COUNT(*) FROM public.consultation_queue 
   WHERE status = 'waiting' 
   AND EXISTS (
     SELECT 1 FROM public.user_profiles
     WHERE user_profiles.id = '56e324aa-e1dd-40a8-9e96-2473cfcba661'::uuid
     AND user_profiles.role = 'admin'
   )) AS would_see_queues,
  CASE 
    WHEN (SELECT role FROM public.user_profiles WHERE id = '56e324aa-e1dd-40a8-9e96-2473cfcba661') = 'admin' 
         AND (SELECT COUNT(*) FROM public.consultation_queue 
              WHERE status = 'waiting' 
              AND EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_profiles.id = '56e324aa-e1dd-40a8-9e96-2473cfcba661'::uuid
                AND user_profiles.role = 'admin'
              )) > 0
    THEN '✅ Admin user would see queues'
    WHEN (SELECT role FROM public.user_profiles WHERE id = '56e324aa-e1dd-40a8-9e96-2473cfcba661') = 'admin' 
         AND (SELECT COUNT(*) FROM public.consultation_queue 
              WHERE status = 'waiting' 
              AND EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_profiles.id = '56e324aa-e1dd-40a8-9e96-2473cfcba661'::uuid
                AND user_profiles.role = 'admin'
              )) = 0
    THEN '❌ Admin user but RLS blocking or no queues'
    ELSE '❌ User is not admin'
  END AS status;

-- ============================================
-- 方法 2: 测试 User 用户的权限逻辑
-- ============================================
SELECT 
  'Test as Regular User' AS step,
  'abf84f0a-5b14-4aa1-8521-54a1ffa8daab'::uuid AS test_user_id,
  (SELECT role FROM public.user_profiles WHERE id = 'abf84f0a-5b14-4aa1-8521-54a1ffa8daab') AS role,
  (SELECT COUNT(*) FROM public.consultation_queue 
   WHERE status = 'waiting' 
   AND patient_id = 'abf84f0a-5b14-4aa1-8521-54a1ffa8daab'::uuid) AS own_queues,
  CASE 
    WHEN (SELECT role FROM public.user_profiles WHERE id = 'abf84f0a-5b14-4aa1-8521-54a1ffa8daab') = 'user' 
    THEN '✅ User role is correct'
    ELSE '⚠️ User role is: ' || COALESCE((SELECT role FROM public.user_profiles WHERE id = 'abf84f0a-5b14-4aa1-8521-54a1ffa8daab'), 'NULL')
  END AS status;

-- ============================================
-- 方法 3: 检查 RLS 策略对所有用户的适用性
-- ============================================
SELECT 
  'RLS Policy Check' AS step,
  'Admin user' AS user_type,
  '56e324aa-e1dd-40a8-9e96-2473cfcba661'::uuid AS user_id,
  (SELECT role FROM public.user_profiles WHERE id = '56e324aa-e1dd-40a8-9e96-2473cfcba661') AS role,
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = '56e324aa-e1dd-40a8-9e96-2473cfcba661'::uuid
    AND user_profiles.role = 'admin'
  ) AS admin_check_passes,
  (SELECT COUNT(*) FROM public.consultation_queue 
   WHERE status = 'waiting' 
   AND EXISTS (
     SELECT 1 FROM public.user_profiles
     WHERE user_profiles.id = '56e324aa-e1dd-40a8-9e96-2473cfcba661'::uuid
     AND user_profiles.role = 'admin'
   )) AS visible_queues;

-- ============================================
-- 重要提示
-- ============================================
-- 在 Supabase SQL Editor 中，auth.uid() 可能返回：
-- 1. NULL（如果没有用户上下文）
-- 2. 项目所有者的 ID
-- 3. 你登录 Supabase Dashboard 时使用的账户
-- 
-- 最佳测试方法：在应用中测试
-- 1. 以 Admin 用户登录应用
-- 2. 打开浏览器控制台
-- 3. 进入 Pharmacist Dashboard
-- 4. 查看日志和 Network 请求

