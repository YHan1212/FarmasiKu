-- 清理测试会话和队列
-- 在 Supabase SQL Editor 中运行此脚本

-- 1. 查看所有活跃的会话
SELECT 
  cs.id,
  cs.patient_id,
  cs.doctor_id,
  cs.queue_id,
  cs.status,
  cs.created_at,
  d.name as doctor_name,
  up.name as patient_name
FROM public.consultation_sessions cs
LEFT JOIN public.doctors d ON d.id = cs.doctor_id
LEFT JOIN public.user_profiles up ON up.id = cs.patient_id
WHERE cs.status = 'active'
ORDER BY cs.created_at DESC;

-- 2. 查看所有等待中的队列
SELECT 
  cq.id,
  cq.patient_id,
  cq.status,
  cq.matched_pharmacist_id,
  cq.created_at,
  up.name as patient_name
FROM public.consultation_queue cq
LEFT JOIN public.user_profiles up ON up.id = cq.patient_id
WHERE cq.status IN ('waiting', 'matched', 'in_consultation')
ORDER BY cq.created_at DESC;

-- 3. 取消所有等待中的队列（如果需要）
-- ⚠️ 谨慎运行：这会取消所有等待中的队列
-- UPDATE public.consultation_queue
-- SET status = 'cancelled'
-- WHERE status IN ('waiting', 'matched', 'in_consultation');

-- 4. 结束所有活跃的会话（如果需要）
-- ⚠️ 谨慎运行：这会结束所有活跃的会话
-- UPDATE public.consultation_sessions
-- SET status = 'completed', ended_at = NOW()
-- WHERE status = 'active';

-- 5. 删除测试相关的会话（如果 doctor name 包含 'test' 或 'Test'）
-- ⚠️ 谨慎运行：这会删除测试会话
-- DELETE FROM public.consultation_sessions
-- WHERE EXISTS (
--   SELECT 1 FROM public.doctors d
--   WHERE d.id = consultation_sessions.doctor_id
--   AND (d.name ILIKE '%test%' OR d.name ILIKE '%Test%')
-- );

