-- 清理测试消息（包括自动发送的 "hi" 消息）
-- 在 Supabase SQL Editor 中运行此脚本

-- 删除所有包含 "hi" 的测试消息
DELETE FROM public.consultation_messages
WHERE LOWER(content) LIKE '%hi%'
   OR LOWER(content) LIKE '%hello%'
   OR LOWER(content) LIKE '%test%';

-- 查看清理后的消息数量
SELECT 
  COUNT(*) as total_messages,
  COUNT(*) FILTER (WHERE sender_type = 'doctor') as doctor_messages,
  COUNT(*) FILTER (WHERE sender_type = 'patient') as patient_messages
FROM public.consultation_messages;

