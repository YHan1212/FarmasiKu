-- 最终诊断 - 找出为什么 visible_queues = 0
-- 在 Supabase SQL Editor 中运行此脚本（以 Admin 用户登录）

-- ============================================
-- 步骤 1: 检查当前登录用户
-- ============================================
SELECT 
  'Step 1: Current User' AS step,
  auth.uid() AS current_user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) AS email,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS role,
  CASE 
    WHEN auth.uid() = '56e324aa-e1dd-40a8-9e96-2473cfcba661' THEN '✅ Logged in as Admin user'
    WHEN auth.uid() = 'abf84f0a-5b14-4aa1-8521-54a1ffa8daab' THEN '❌ Logged in as User (not Admin)'
    WHEN auth.uid() IS NULL THEN '❌ Not logged in'
    ELSE '⚠️ Logged in as different user'
  END AS status;

-- ============================================
-- 步骤 2: 检查是否有 waiting 队列（绕过 RLS）
-- ============================================
SELECT 
  'Step 2: All Waiting Queues (Bypass RLS)' AS step,
  COUNT(*) AS total_count
FROM public.consultation_queue
WHERE status = 'waiting';

-- 显示所有 waiting 队列
SELECT 
  'Step 2b: Waiting Queue Details' AS step,
  id,
  patient_id,
  status,
  created_at
FROM public.consultation_queue
WHERE status = 'waiting'
ORDER BY created_at DESC;

-- ============================================
-- 步骤 3: 测试直接角色检查条件
-- ============================================
SELECT 
  'Step 3: Direct Role Check' AS step,
  auth.uid() AS user_id,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS role,
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) AS role_check_result,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    ) THEN '✅ Role check passes'
    ELSE '❌ Role check fails'
  END AS status;

-- ============================================
-- 步骤 4: 测试完整的 RLS 条件
-- ============================================
SELECT 
  'Step 4: Full RLS Condition Test' AS step,
  COUNT(*) AS matching_queues,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Condition matches queues'
    ELSE '❌ Condition does not match any queues'
  END AS status
FROM public.consultation_queue
WHERE status = 'waiting' 
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );

-- ============================================
-- 步骤 5: 检查 RLS 策略
-- ============================================
SELECT 
  'Step 5: RLS Policies' AS step,
  policyname,
  cmd,
  qual AS condition
FROM pg_policies
WHERE tablename = 'consultation_queue'
ORDER BY policyname;

-- ============================================
-- 步骤 6: 测试每个策略条件单独
-- ============================================
-- 条件 1: 用户自己的队列
SELECT 
  'Step 6a: Own Queue Condition' AS step,
  COUNT(*) AS count
FROM public.consultation_queue
WHERE status = 'waiting' AND patient_id = auth.uid();

-- 条件 2: Admin 条件（直接角色检查）
SELECT 
  'Step 6b: Admin Condition (Direct)' AS step,
  COUNT(*) AS count,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS role
FROM public.consultation_queue
WHERE status = 'waiting' 
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );

-- 条件 3: 链接的 pharmacist
SELECT 
  'Step 6c: Linked Pharmacist Condition' AS step,
  COUNT(*) AS count
FROM public.consultation_queue
WHERE status = 'waiting' 
  AND EXISTS (
    SELECT 1 FROM public.doctors
    WHERE doctors.user_id = auth.uid()
  );

-- ============================================
-- 步骤 7: 最终诊断
-- ============================================
SELECT 
  'Step 7: Final Diagnosis' AS step,
  (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting') AS total_waiting_queues,
  auth.uid() AS current_user_id,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS current_role,
  (SELECT COUNT(*) FROM public.consultation_queue 
   WHERE status = 'waiting' 
   AND EXISTS (
     SELECT 1 FROM public.user_profiles
     WHERE id = auth.uid()
     AND role = 'admin'
   )) AS visible_queues,
  CASE 
    WHEN auth.uid() != '56e324aa-e1dd-40a8-9e96-2473cfcba661' THEN 
      '❌ PROBLEM: Not logged in as Admin user. Login as user 56e324aa-e1dd-40a8-9e96-2473cfcba661'
    WHEN (SELECT role FROM public.user_profiles WHERE id = auth.uid()) != 'admin' THEN 
      '❌ PROBLEM: User role is not admin. Run: UPDATE public.user_profiles SET role = ''admin'' WHERE id = ''56e324aa-e1dd-40a8-9e96-2473cfcba661'''
    WHEN (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting') = 0 THEN 
      '⚠️ No waiting queues exist. Create a queue first.'
    WHEN (SELECT COUNT(*) FROM public.consultation_queue 
          WHERE status = 'waiting' 
          AND EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND role = 'admin'
          )) = 0 THEN 
      '❌ PROBLEM: RLS policy is blocking. Run fix_rls_with_direct_role_check.sql'
    ELSE 
      '✅ Everything should work - check browser console'
  END AS diagnosis;

-- ============================================
-- 完成！
-- ============================================
-- 查看 Step 7 的诊断结果，根据提示操作

