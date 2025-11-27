-- 验证 Realtime 设置是否正确
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 1. 检查表是否已添加到 Realtime 发布
-- ============================================
SELECT 
  schemaname,
  tablename,
  '✅ Enabled' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND schemaname = 'public'
AND tablename IN (
  'consultation_messages',
  'consultation_medications',
  'consultation_sessions',
  'consultation_queue',
  'pharmacist_availability'
)
ORDER BY tablename;

-- ============================================
-- 2. 检查 RLS 策略是否允许实时更新
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'consultation_messages',
  'consultation_medications',
  'consultation_sessions',
  'consultation_queue',
  'pharmacist_availability'
)
ORDER BY tablename, policyname;

-- ============================================
-- 3. 检查表结构（确保有必要的列）
-- ============================================
-- consultation_messages 表
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'consultation_messages'
ORDER BY ordinal_position;

-- consultation_medications 表
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'consultation_medications'
ORDER BY ordinal_position;

-- ============================================
-- 4. 测试数据（可选，用于验证）
-- ============================================
-- 查看最近的咨询会话
SELECT 
  id,
  patient_id,
  doctor_id,
  status,
  consultation_type,
  created_at
FROM public.consultation_sessions
ORDER BY created_at DESC
LIMIT 5;

-- 查看最近的咨询消息
SELECT 
  id,
  session_id,
  sender_id,
  sender_type,
  message_type,
  content,
  created_at
FROM public.consultation_messages
ORDER BY created_at DESC
LIMIT 5;

-- 查看最近的药物推荐
SELECT 
  id,
  session_id,
  medication_name,
  recommended_by,
  status,
  created_at
FROM public.consultation_medications
ORDER BY created_at DESC
LIMIT 5;

