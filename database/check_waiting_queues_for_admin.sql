-- 检查是否有 waiting 队列，以及 Admin 是否能查看
-- 在 Supabase SQL Editor 中运行此脚本

-- 1. 检查所有 waiting 队列
SELECT 
  id,
  patient_id,
  status,
  created_at,
  position,
  estimated_wait_minutes,
  pharmacist_id
FROM public.consultation_queue
WHERE status = 'waiting'
ORDER BY created_at ASC;

-- 2. 检查当前用户是否是 admin
SELECT 
  id,
  role,
  CASE 
    WHEN role = 'admin' THEN '✅ You are admin'
    ELSE '❌ You are NOT admin'
  END AS admin_status
FROM public.user_profiles
WHERE id = auth.uid();

-- 3. 测试 Admin 能否看到 waiting 队列（模拟前端查询）
SELECT 
  COUNT(*) as visible_waiting_queues,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Admin can see waiting queues'
    WHEN EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN '⚠️ Admin user but no waiting queues found'
    ELSE '❌ Cannot see waiting queues'
  END AS test_result
FROM public.consultation_queue
WHERE status = 'waiting';

-- 4. 如果有 waiting 队列但看不到，检查 RLS 策略
SELECT 
  policyname,
  cmd AS command,
  qual AS condition
FROM pg_policies
WHERE tablename = 'consultation_queue'
  AND cmd = 'SELECT'
  AND qual::text LIKE '%waiting%'
ORDER BY policyname;

