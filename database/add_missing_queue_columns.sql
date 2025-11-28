-- 添加缺失的列到 consultation_queue 表
-- 在 Supabase SQL Editor 中运行此脚本

-- 添加 accepted_at 列（如果不存在）
ALTER TABLE public.consultation_queue
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;

-- 添加 matched_at 列（如果不存在）
ALTER TABLE public.consultation_queue
ADD COLUMN IF NOT EXISTS matched_at TIMESTAMP WITH TIME ZONE;

-- 验证列已添加
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'consultation_queue'
  AND column_name IN ('accepted_at', 'matched_at')
ORDER BY column_name;

SELECT '✅ 列已添加（如果之前不存在）' as status;

