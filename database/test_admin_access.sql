-- 测试 Admin 访问权限
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 检查当前用户和角色
-- ============================================
SELECT 
  'Step 1: Current User & Role' AS step,
  auth.uid() AS current_user_id,
  up.id AS profile_id,
  up.role AS role_in_table,
  up.age,
  CASE 
    WHEN up.role = 'admin' THEN '✅ Role is admin in table'
    ELSE '❌ Role is NOT admin in table'
  END AS table_status
FROM public.user_profiles up
WHERE up.id = auth.uid();

-- ============================================
-- 步骤 2: 测试 is_current_user_admin() 函数
-- ============================================
SELECT 
  'Step 2: Test Function' AS step,
  public.is_current_user_admin() AS function_result,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS role_from_table,
  CASE 
    WHEN public.is_current_user_admin() = true THEN '✅ Function returns TRUE'
    WHEN public.is_current_user_admin() = false AND (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin' THEN '❌ PROBLEM: Function returns FALSE but role is admin!'
    ELSE '❌ Function returns FALSE (role is not admin)'
  END AS function_status;

-- ============================================
-- 步骤 3: 检查函数定义
-- ============================================
SELECT 
  'Step 3: Function Definition' AS step,
  proname AS function_name,
  prosrc AS function_source
FROM pg_proc
WHERE proname = 'is_current_user_admin';

-- ============================================
-- 步骤 4: 手动测试函数逻辑
-- ============================================
SELECT 
  'Step 4: Manual Function Test' AS step,
  auth.uid() AS user_id,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS role_value,
  COALESCE((SELECT role FROM public.user_profiles WHERE id = auth.uid()), 'user') AS coalesced_role,
  (COALESCE((SELECT role FROM public.user_profiles WHERE id = auth.uid()), 'user') = 'admin') AS should_be_admin,
  public.is_current_user_admin() AS actual_result,
  CASE 
    WHEN (COALESCE((SELECT role FROM public.user_profiles WHERE id = auth.uid()), 'user') = 'admin') = public.is_current_user_admin() THEN '✅ Function logic is correct'
    ELSE '❌ Function logic is WRONG!'
  END AS logic_status;

-- ============================================
-- 步骤 5: 检查 consultation_queue RLS 策略
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
-- 步骤 6: 测试直接查询（绕过 RLS，看数据是否存在）
-- ============================================
-- 注意：这个查询会绕过 RLS，只检查数据是否存在
SELECT 
  'Step 6: Check Data Exists (Bypass RLS)' AS step,
  COUNT(*) AS total_waiting_queues
FROM public.consultation_queue
WHERE status = 'waiting';

-- ============================================
-- 步骤 7: 测试通过 RLS 查询（实际查询）
-- ============================================
SELECT 
  'Step 7: Test RLS Query' AS step,
  COUNT(*) AS visible_waiting_queues,
  public.is_current_user_admin() AS is_admin,
  CASE 
    WHEN public.is_current_user_admin() = true AND COUNT(*) > 0 THEN '✅ SUCCESS - Admin can see queues!'
    WHEN public.is_current_user_admin() = true AND COUNT(*) = 0 THEN '⚠️ Admin but no queues visible (RLS blocking or no data)'
    WHEN public.is_current_user_admin() = false THEN '❌ NOT admin - cannot see queues'
    ELSE '❌ Unknown issue'
  END AS query_status
FROM public.consultation_queue
WHERE status = 'waiting';

-- ============================================
-- 步骤 8: 显示所有 waiting 队列（如果能看到）
-- ============================================
SELECT 
  'Step 8: All Visible Waiting Queues' AS step,
  id,
  patient_id,
  status,
  created_at
FROM public.consultation_queue
WHERE status = 'waiting'
ORDER BY created_at DESC;

-- ============================================
-- 步骤 9: 诊断总结
-- ============================================
SELECT 
  'Step 9: Diagnosis Summary' AS step,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS role_in_table,
  public.is_current_user_admin() AS function_result,
  (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting') AS total_waiting_queues,
  (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting' AND public.is_current_user_admin()) AS visible_queues,
  CASE 
    WHEN (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin' 
         AND public.is_current_user_admin() = false 
    THEN '❌ PROBLEM: Role is admin but function returns false - RECREATE FUNCTION'
    
    WHEN (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin' 
         AND public.is_current_user_admin() = true 
         AND (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting' AND public.is_current_user_admin()) = 0
    THEN '❌ PROBLEM: Admin but cannot see queues - CHECK RLS POLICIES'
    
    WHEN (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin' 
         AND public.is_current_user_admin() = true 
         AND (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting' AND public.is_current_user_admin()) > 0
    THEN '✅ SUCCESS - Everything works! Refresh browser.'
    
    WHEN (SELECT role FROM public.user_profiles WHERE id = auth.uid()) != 'admin'
    THEN '❌ PROBLEM: Role is NOT admin - SET ROLE TO ADMIN'
    
    ELSE '❌ Unknown issue'
  END AS diagnosis;

-- ============================================
-- 完成！
-- ============================================
-- 查看 Step 9 的诊断结果，根据提示操作

