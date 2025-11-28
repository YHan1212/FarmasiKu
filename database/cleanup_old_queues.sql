-- 清理旧的已匹配队列（用于测试）
-- 在 Supabase SQL Editor 中运行此脚本
-- ⚠️ 注意：这会删除所有状态为 'matched' 或 'in_consultation' 的队列

-- 1. 查看将要删除的队列
SELECT 
  id,
  patient_id,
  status,
  matched_pharmacist_id,
  matched_at,
  created_at
FROM public.consultation_queue
WHERE status IN ('matched', 'in_consultation')
ORDER BY created_at DESC;

-- 2. 删除已匹配的队列（取消注释下面的行来执行）
-- ⚠️ 警告：这会删除所有已匹配的队列
-- DELETE FROM public.consultation_queue
-- WHERE status IN ('matched', 'in_consultation');

-- 3. 或者只删除特定用户的队列（更安全）
-- 替换 'YOUR_USER_ID' 为实际用户 ID
-- DELETE FROM public.consultation_queue
-- WHERE patient_id = 'YOUR_USER_ID'::uuid
-- AND status IN ('matched', 'in_consultation');

-- 4. 或者将状态改为 'cancelled'（保留记录）
-- UPDATE public.consultation_queue
-- SET status = 'cancelled'
-- WHERE status IN ('matched', 'in_consultation')
-- AND created_at < NOW() - INTERVAL '1 hour';

