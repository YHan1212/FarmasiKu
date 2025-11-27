-- 启用 Supabase Realtime 用于咨询消息和药物推荐
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 启用 Realtime 发布
-- ============================================

-- 为 consultation_messages 表启用 Realtime（如果还没有启用）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'consultation_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_messages;
  END IF;
END $$;

-- 为 consultation_medications 表启用 Realtime（如果还没有启用）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'consultation_medications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_medications;
  END IF;
END $$;

-- 为 consultation_sessions 表启用 Realtime（如果需要，如果还没有启用）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'consultation_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_sessions;
  END IF;
END $$;

-- 为 consultation_queue 表启用 Realtime（如果需要，如果还没有启用）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'consultation_queue'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_queue;
  END IF;
END $$;

-- ============================================
-- 验证 Realtime 是否已启用
-- ============================================

-- 检查哪些表已启用 Realtime
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND schemaname = 'public'
AND tablename IN (
  'consultation_messages',
  'consultation_medications',
  'consultation_sessions',
  'consultation_queue'
);

