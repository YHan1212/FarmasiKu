-- 验证新的 RLS 策略是否正确工作
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 检查策略数量
-- ============================================
SELECT 
  'Step 1: Policy Count' AS step,
  COUNT(*) AS total_policies,
  COUNT(*) FILTER (WHERE cmd = 'SELECT') AS select_policies,
  COUNT(*) FILTER (WHERE cmd = 'INSERT') AS insert_policies,
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') AS update_policies,
  CASE 
    WHEN COUNT(*) >= 7 THEN '✅ Policy count looks good'
    ELSE '⚠️ Expected at least 7 policies'
  END AS status
FROM pg_policies
WHERE tablename = 'consultation_queue';

-- ============================================
-- 步骤 2: 列出所有策略
-- ============================================
SELECT 
  'Step 2: All Policies' AS step,
  policyname,
  cmd,
  qual AS condition
FROM pg_policies
WHERE tablename = 'consultation_queue'
ORDER BY 
  CASE cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    ELSE 4
  END,
  policyname;

-- ============================================
-- 步骤 3: 检查当前用户和角色
-- ============================================
SELECT 
  'Step 3: Current User' AS step,
  auth.uid() AS user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) AS email,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS role,
  CASE 
    WHEN (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin' THEN '✅ Admin user'
    WHEN (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'user' THEN 'User'
    ELSE '⚠️ Role: ' || COALESCE((SELECT role FROM public.user_profiles WHERE id = auth.uid()), 'NULL')
  END AS status;

-- ============================================
-- 步骤 4: 检查是否有 waiting 队列
-- ============================================
SELECT 
  'Step 4: Waiting Queues Count' AS step,
  COUNT(*) AS total_waiting_queues
FROM public.consultation_queue
WHERE status = 'waiting';

-- ============================================
-- 步骤 5: 测试 Admin 用户查询（需要以 Admin 登录）
-- ============================================
SELECT 
  'Step 5: Admin Query Test' AS step,
  auth.uid() AS current_user_id,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS role,
  COUNT(*) AS visible_queues,
  CASE 
    WHEN (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin' 
         AND COUNT(*) > 0 
    THEN '✅ SUCCESS - Admin can see waiting queues!'
    WHEN (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin' 
         AND COUNT(*) = 0 
    THEN '⚠️ Admin but no queues (check if queues exist)'
    WHEN (SELECT role FROM public.user_profiles WHERE id = auth.uid()) != 'admin' 
    THEN '⚠️ Not logged in as Admin - test in application instead'
    ELSE '❌ Unknown issue'
  END AS status
FROM public.consultation_queue
WHERE status = 'waiting' 
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  );

-- ============================================
-- 步骤 6: 显示所有可见的 waiting 队列
-- ============================================
SELECT 
  'Step 6: Visible Waiting Queues' AS step,
  id,
  patient_id,
  status,
  created_at
FROM public.consultation_queue
WHERE status = 'waiting' 
  AND (
    -- 用户自己的队列
    patient_id = auth.uid() OR
    -- Admin 用户
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    ) OR
    -- 链接了 pharmacist account
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.user_id = auth.uid()
    )
  )
ORDER BY created_at DESC;

-- ============================================
-- 步骤 7: 测试特定用户（Admin）
-- ============================================
SELECT 
  'Step 7: Test as Admin User (56e324aa-e1dd-40a8-9e96-2473cfcba661)' AS step,
  (SELECT role FROM public.user_profiles WHERE id = '56e324aa-e1dd-40a8-9e96-2473cfcba661') AS admin_role,
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
    THEN '⚠️ Admin user but no queues visible (check if queues exist)'
    ELSE '❌ Admin user role is not admin'
  END AS status;

-- ============================================
-- 完成！
-- ============================================
-- 查看 Step 5 和 Step 7 的结果
-- 如果都显示 ✅，说明策略正确工作
-- 然后在应用中测试

