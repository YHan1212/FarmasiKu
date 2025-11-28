-- 快速检查是否有 waiting 队列
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 检查 1: 所有队列状态统计
-- ============================================
SELECT 
  'Queue Status Summary' AS step,
  status,
  COUNT(*) AS count
FROM public.consultation_queue
GROUP BY status
ORDER BY status;

-- ============================================
-- 检查 2: 所有 waiting 队列详情
-- ============================================
SELECT 
  'All Waiting Queues' AS step,
  id,
  patient_id,
  status,
  created_at
FROM public.consultation_queue
WHERE status = 'waiting'
ORDER BY created_at DESC;

-- ============================================
-- 检查 3: 如果没有 waiting 队列，创建一个测试队列
-- ============================================
-- 注意：这个查询只是检查，不会创建
-- 如果需要创建测试队列，取消下面的注释

-- INSERT INTO public.consultation_queue (patient_id, status, symptoms, notes)
-- VALUES (
--   'abf84f0a-5b14-4aa1-8521-54a1ffa8daab'::uuid, -- User ID
--   'waiting',
--   ARRAY['headache', 'fever'],
--   '{"userAge": 25, "symptomAssessments": {}}'::jsonb
-- );

-- ============================================
-- 检查 4: 验证 Admin 用户角色
-- ============================================
SELECT 
  'Admin User Check' AS step,
  id,
  role,
  CASE 
    WHEN role = 'admin' THEN '✅ Admin role is correct'
    ELSE '❌ Role is: ' || COALESCE(role, 'NULL')
  END AS status
FROM public.user_profiles
WHERE id = '56e324aa-e1dd-40a8-9e96-2473cfcba661';

