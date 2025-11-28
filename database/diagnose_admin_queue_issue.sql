-- 诊断 Admin 无法查看 waiting 队列的问题
-- 在 Supabase SQL Editor 中运行此脚本，逐步检查每个环节

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
    ELSE '❌ User is NOT Admin'
  END AS status
FROM public.user_profiles up
WHERE up.id = auth.uid();

-- ============================================
-- 步骤 2: 检查是否有 waiting 状态的队列
-- ============================================
SELECT 
  'Step 2: Check Waiting Queues' AS step,
  COUNT(*) AS total_waiting_queues,
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
  created_at,
  updated_at
FROM public.consultation_queue
WHERE status = 'waiting'
ORDER BY created_at DESC;

-- ============================================
-- 步骤 3: 检查 is_current_user_admin() 函数是否存在
-- ============================================
SELECT 
  'Step 3: Check is_current_user_admin Function' AS step,
  proname AS function_name,
  prosrc AS function_source
FROM pg_proc
WHERE proname = 'is_current_user_admin';

-- 测试函数
SELECT 
  'Step 3b: Test Function' AS step,
  public.is_current_user_admin() AS function_result,
  auth.uid() AS current_user_id;

-- ============================================
-- 步骤 4: 检查 consultation_queue 的 RLS 策略
-- ============================================
SELECT 
  'Step 4: Check RLS Policies' AS step,
  policyname,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'consultation_queue'
ORDER BY policyname;

-- ============================================
-- 步骤 5: 检查 RLS 是否已启用
-- ============================================
SELECT 
  'Step 5: Check RLS Enabled' AS step,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'consultation_queue';

-- ============================================
-- 步骤 6: 模拟 Admin 查询（测试 RLS 策略）
-- ============================================
-- 这个查询应该返回所有 waiting 队列（如果用户是 admin）
SELECT 
  'Step 6: Test Admin Query' AS step,
  id,
  patient_id,
  status,
  matched_pharmacist_id,
  created_at
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
    ELSE '❌ Not linked to current user'
  END AS link_status
FROM public.doctors d
WHERE d.user_id = auth.uid();

-- ============================================
-- 步骤 8: 检查所有 RLS 策略的详细定义
-- ============================================
SELECT 
  'Step 8: Detailed Policy Information' AS step,
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
-- 步骤 9: 手动测试每个策略条件
-- ============================================
-- 测试条件 1: 用户是自己的队列
SELECT 
  'Step 9a: Test Own Queue Condition' AS step,
  COUNT(*) AS own_queues_count
FROM public.consultation_queue
WHERE patient_id = auth.uid();

-- 测试条件 2: Admin 查看 waiting 队列
SELECT 
  'Step 9b: Test Admin Waiting Condition' AS step,
  COUNT(*) AS admin_waiting_queues_count,
  public.is_current_user_admin() AS is_admin
FROM public.consultation_queue
WHERE status = 'waiting' AND public.is_current_user_admin();

-- 测试条件 3: 链接的 pharmacist 查看 waiting 队列
SELECT 
  'Step 9c: Test Linked Pharmacist Condition' AS step,
  COUNT(*) AS linked_pharmacist_waiting_queues_count,
  EXISTS (
    SELECT 1 FROM public.doctors
    WHERE doctors.user_id = auth.uid()
  ) AS has_linked_pharmacist
FROM public.consultation_queue
WHERE status = 'waiting' AND EXISTS (
  SELECT 1 FROM public.doctors
  WHERE doctors.user_id = auth.uid()
);

-- ============================================
-- 步骤 10: 检查是否有其他策略可能阻止访问
-- ============================================
-- 检查是否有 DENY 策略或其他限制
SELECT 
  'Step 10: Check for Conflicting Policies' AS step,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'consultation_queue'
AND (permissive = 'RESTRICTIVE' OR qual LIKE '%DENY%' OR qual LIKE '%NOT%');

