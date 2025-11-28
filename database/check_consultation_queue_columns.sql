-- 检查 consultation_queue 表的列
-- 在 Supabase SQL Editor 中运行此脚本

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'consultation_queue'
ORDER BY ordinal_position;

