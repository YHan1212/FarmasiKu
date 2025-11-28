-- 设置当前用户为 Admin
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 检查当前用户
-- ============================================
SELECT 
  'Current User Info' AS step,
  auth.uid() AS user_id,
  up.role AS current_role,
  up.id AS profile_id
FROM public.user_profiles up
WHERE up.id = auth.uid();

-- ============================================
-- 步骤 2: 设置当前用户为 Admin
-- ============================================
UPDATE public.user_profiles
SET role = 'admin'
WHERE id = auth.uid();

-- ============================================
-- 步骤 3: 验证设置
-- ============================================
SELECT 
  'Verification' AS step,
  id AS user_id,
  role AS new_role,
  public.is_current_user_admin() AS is_admin_function_result,
  CASE 
    WHEN role = 'admin' THEN '✅ User is now Admin'
    ELSE '❌ Failed to set as Admin'
  END AS status
FROM public.user_profiles
WHERE id = auth.uid();

-- ============================================
-- 步骤 4: 测试查询 waiting 队列
-- ============================================
SELECT 
  'Test Query' AS step,
  COUNT(*) AS waiting_queues_count,
  public.is_current_user_admin() AS is_admin,
  CASE 
    WHEN public.is_current_user_admin() = true THEN '✅ Can now view waiting queues'
    ELSE '❌ Still not admin - check user_profiles table'
  END AS status
FROM public.consultation_queue
WHERE status = 'waiting';

-- ============================================
-- 完成！
-- ============================================
-- 如果 is_admin_function_result 是 true，说明设置成功
-- 刷新浏览器页面，应该能看到 waiting 队列了

