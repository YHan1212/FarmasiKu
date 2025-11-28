-- 检查是否有自动匹配的触发器或函数
-- 在 Supabase SQL Editor 中运行此脚本

-- 1. 检查是否有触发器
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'consultation_queue'
ORDER BY trigger_name;

-- 2. 检查是否有函数涉及自动匹配
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (
  routine_definition ILIKE '%match%pharmacist%' OR
  routine_definition ILIKE '%自动匹配%' OR
  routine_definition ILIKE '%auto.*match%'
)
ORDER BY routine_name;

-- 3. 检查当前用户的队列状态
-- 替换 'YOUR_USER_ID' 为实际用户 ID
SELECT 
  id,
  patient_id,
  status,
  matched_pharmacist_id,
  matched_at,
  created_at
FROM public.consultation_queue
WHERE patient_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;

-- 4. 检查是否有已匹配但未完成的队列
SELECT 
  id,
  patient_id,
  status,
  matched_pharmacist_id,
  matched_at,
  created_at
FROM public.consultation_queue
WHERE status IN ('matched', 'in_consultation')
AND created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

