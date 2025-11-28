-- 直接测试 RLS 策略（不依赖函数）
-- 在 Supabase SQL Editor 中运行此脚本
-- 需要以 Admin 用户登录

-- ============================================
-- 步骤 1: 检查当前登录用户和角色
-- ============================================
SELECT 
  'Step 1: Current User' AS step,
  auth.uid() AS current_user_id,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS role_in_table,
  CASE 
    WHEN (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin' THEN '✅ Logged in as Admin'
    ELSE '⚠️ Not logged in as Admin'
  END AS status;

-- ============================================
-- 步骤 2: 检查所有 waiting 队列（绕过 RLS，看数据是否存在）
-- ============================================
-- 这个查询会显示所有数据，不管 RLS
SELECT 
  'Step 2: All Waiting Queues (Bypass RLS)' AS step,
  COUNT(*) AS total_count,
  id,
  patient_id,
  status,
  created_at
FROM public.consultation_queue
WHERE status = 'waiting'
GROUP BY id, patient_id, status, created_at
ORDER BY created_at DESC;

-- ============================================
-- 步骤 3: 测试通过 RLS 查询（实际查询）
-- ============================================
SELECT 
  'Step 3: RLS Query Test' AS step,
  COUNT(*) AS visible_count,
  id,
  patient_id,
  status
FROM public.consultation_queue
WHERE status = 'waiting'
GROUP BY id, patient_id, status
ORDER BY created_at DESC;

-- 如果 Step 3 返回 0 但 Step 2 有数据，说明 RLS 策略阻止了查询

-- ============================================
-- 步骤 4: 检查所有 RLS 策略
-- ============================================
SELECT 
  'Step 4: All RLS Policies' AS step,
  policyname,
  cmd,
  qual AS condition,
  with_check
FROM pg_policies
WHERE tablename = 'consultation_queue'
ORDER BY policyname;

-- ============================================
-- 步骤 5: 测试每个策略条件
-- ============================================
-- 测试条件 1: 用户是自己的队列
SELECT 
  'Step 5a: Own Queue Condition' AS step,
  COUNT(*) AS own_queues
FROM public.consultation_queue
WHERE status = 'waiting' AND patient_id = auth.uid();

-- 测试条件 2: Admin 查看 waiting 队列（使用函数）
SELECT 
  'Step 5b: Admin Condition (Function)' AS step,
  COUNT(*) AS admin_queues,
  public.is_current_user_admin() AS function_result
FROM public.consultation_queue
WHERE status = 'waiting' AND public.is_current_user_admin();

-- 测试条件 3: Admin 查看 waiting 队列（直接查询角色）
SELECT 
  'Step 5c: Admin Condition (Direct)' AS step,
  COUNT(*) AS admin_queues_direct,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS role_direct
FROM public.consultation_queue
WHERE status = 'waiting' 
  AND (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin';

-- ============================================
-- 诊断
-- ============================================
SELECT 
  'Diagnosis' AS step,
  (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting') AS total_queues,
  (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting' AND patient_id = auth.uid()) AS own_queues,
  (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting' AND public.is_current_user_admin()) AS admin_queues_function,
  (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting' AND (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin') AS admin_queues_direct,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting' AND public.is_current_user_admin()) = 0 
         AND (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting' AND (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin') > 0
    THEN '❌ PROBLEM: Function is broken - use direct role check in RLS'
    WHEN (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting' AND public.is_current_user_admin()) > 0
    THEN '✅ Function works - RLS should allow access'
    ELSE '❌ Both methods fail - check RLS policies'
  END AS diagnosis;

