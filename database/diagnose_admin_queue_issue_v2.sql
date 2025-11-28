-- 诊断 Admin 无法查看 waiting 队列的问题 - 更新版
-- 适用于：只有 Admin 账号可以 link pharmacist account
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 检查当前用户是否为 Admin
-- ============================================
SELECT 
  'Step 1: Check Current User Role' AS step,
  auth.uid() AS current_user_id,
  up.role AS user_role,
  public.is_current_user_admin() AS is_admin_function_result,
  CASE 
    WHEN up.role = 'admin' THEN '✅ User is Admin'
    ELSE '❌ User is NOT Admin - This is the problem!'
  END AS status
FROM public.user_profiles up
WHERE up.id = auth.uid();

-- ============================================
-- 步骤 2: 检查是否有 waiting 状态的队列
-- ============================================
SELECT 
  'Step 2: Check Waiting Queues' AS step,
  COUNT(*) AS total_queues,
  COUNT(*) FILTER (WHERE status = 'waiting') AS waiting_count,
  COUNT(*) FILTER (WHERE status = 'matched') AS matched_count,
  COUNT(*) FILTER (WHERE status = 'in_consultation') AS in_consultation_count
FROM public.consultation_queue;

-- 显示所有 waiting 队列的详细信息
SELECT 
  'Step 2b: Waiting Queue Details' AS step,
  id,
  patient_id,
  status,
  matched_pharmacist_id,
  created_at
FROM public.consultation_queue
WHERE status = 'waiting'
ORDER BY created_at DESC;

-- ============================================
-- 步骤 3: 检查 is_current_user_admin() 函数
-- ============================================
SELECT 
  'Step 3: Check is_current_user_admin Function' AS step,
  proname AS function_name,
  CASE 
    WHEN proname = 'is_current_user_admin' THEN '✅ Function exists'
    ELSE '❌ Function does NOT exist'
  END AS status
FROM pg_proc
WHERE proname = 'is_current_user_admin';

-- 测试函数
SELECT 
  'Step 3b: Test Function' AS step,
  public.is_current_user_admin() AS function_result,
  auth.uid() AS current_user_id,
  CASE 
    WHEN public.is_current_user_admin() = true THEN '✅ Function returns TRUE (user is admin)'
    ELSE '❌ Function returns FALSE (user is NOT admin)'
  END AS status;

-- ============================================
-- 步骤 4: 检查 consultation_queue 的 RLS 策略
-- ============================================
SELECT 
  'Step 4: Check RLS Policies' AS step,
  policyname,
  cmd AS command,
  qual AS using_expression
FROM pg_policies
WHERE tablename = 'consultation_queue'
ORDER BY policyname;

-- ============================================
-- 步骤 5: 检查 RLS 是否已启用
-- ============================================
SELECT 
  'Step 5: Check RLS Enabled' AS step,
  tablename,
  rowsecurity AS rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS is enabled'
    ELSE '❌ RLS is NOT enabled'
  END AS status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'consultation_queue';

-- ============================================
-- 步骤 6: 测试 Admin 查询（关键测试！）
-- ============================================
-- 这个查询应该返回所有 waiting 队列（如果用户是 admin）
SELECT 
  'Step 6: Test Admin Query (CRITICAL)' AS step,
  id,
  patient_id,
  status,
  created_at,
  public.is_current_user_admin() AS is_admin
FROM public.consultation_queue
WHERE status = 'waiting'
ORDER BY created_at DESC;

-- 如果上面的查询返回空，说明 RLS 策略有问题

-- ============================================
-- 步骤 7: 检查是否有链接的 pharmacist account
-- ============================================
SELECT 
  'Step 7: Check Linked Pharmacist Accounts' AS step,
  d.id AS doctor_id,
  d.name AS doctor_name,
  d.user_id AS linked_user_id,
  CASE 
    WHEN d.user_id = auth.uid() THEN '✅ Linked to current user'
    WHEN d.user_id IS NULL THEN '⚠️ Not linked to any user'
    ELSE '❌ Linked to another user'
  END AS link_status
FROM public.doctors d
WHERE d.user_id = auth.uid() OR d.user_id IS NULL
ORDER BY d.created_at DESC;

-- ============================================
-- 步骤 8: 手动测试 Admin 策略条件
-- ============================================
-- 测试条件：Admin 查看 waiting 队列
SELECT 
  'Step 8: Test Admin Waiting Condition' AS step,
  COUNT(*) AS admin_waiting_queues_count,
  public.is_current_user_admin() AS is_admin,
  CASE 
    WHEN public.is_current_user_admin() = true AND COUNT(*) > 0 THEN '✅ Admin can see waiting queues'
    WHEN public.is_current_user_admin() = true AND COUNT(*) = 0 THEN '⚠️ Admin can query but no waiting queues exist'
    WHEN public.is_current_user_admin() = false THEN '❌ User is NOT admin - cannot see queues'
    ELSE '❌ Unknown issue'
  END AS status
FROM public.consultation_queue
WHERE status = 'waiting' AND public.is_current_user_admin();

-- ============================================
-- 步骤 9: 检查策略的详细定义
-- ============================================
SELECT 
  'Step 9: Detailed Policy Information' AS step,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'consultation_queue'
ORDER BY policyname;

-- ============================================
-- 步骤 10: 诊断总结
-- ============================================
SELECT 
  'Step 10: Diagnosis Summary' AS step,
  public.is_current_user_admin() AS is_admin,
  (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting') AS waiting_queues_count,
  (SELECT COUNT(*) FROM public.doctors WHERE user_id = auth.uid()) AS linked_pharmacist_count,
  CASE 
    WHEN public.is_current_user_admin() = false THEN '❌ PROBLEM: User is NOT admin - Set role to "admin" in user_profiles'
    WHEN (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting') = 0 THEN '⚠️ No waiting queues exist - Create a queue first'
    WHEN (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting' AND public.is_current_user_admin()) = 0 THEN '❌ PROBLEM: RLS policy is blocking - Run fix_admin_view_queues_final.sql'
    ELSE '✅ Everything looks correct - Check frontend code'
  END AS diagnosis;

