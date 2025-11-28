-- 检查 Admin 用户是否能查看等待队列
-- 运行此脚本前，请确保你已登录为 Admin 用户

-- 1. 检查当前用户角色
SELECT 
  id,
  role,
  created_at
FROM public.user_profiles
WHERE id = auth.uid();

-- 2. 检查是否有等待队列
SELECT 
  COUNT(*) as total_waiting_queues
FROM public.consultation_queue
WHERE status = 'waiting';

-- 3. 尝试直接查询等待队列（模拟前端查询）
SELECT 
  id,
  patient_id,
  status,
  created_at,
  position,
  estimated_wait_minutes
FROM public.consultation_queue
WHERE status = 'waiting'
ORDER BY created_at ASC;

-- 4. 检查 RLS 策略
SELECT 
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

-- 5. 检查当前用户是否是 admin（用于 RLS 策略）
SELECT 
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) as is_current_user_admin;

-- 6. 测试 RLS 策略是否允许查询
-- 这个查询应该返回等待队列（如果 RLS 策略正确）
DO $$
DECLARE
  queue_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO queue_count
  FROM public.consultation_queue
  WHERE status = 'waiting';
  
  RAISE NOTICE 'Total waiting queues visible to current user: %', queue_count;
END $$;

