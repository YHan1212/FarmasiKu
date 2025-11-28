-- ============================================
-- 修复：允许用户创建自己的队列
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- ============================================
-- 步骤 1: 检查现有的 INSERT 策略
-- ============================================
SELECT 
  'Step 1: Current INSERT Policies' AS step,
  policyname,
  cmd AS command,
  qual AS condition,
  with_check AS with_check_clause
FROM pg_policies
WHERE tablename = 'consultation_queue'
AND cmd = 'INSERT';

-- ============================================
-- 步骤 2: 删除旧的 INSERT 策略（如果存在）
-- ============================================
DROP POLICY IF EXISTS "Users can create queue" ON public.consultation_queue;
DROP POLICY IF EXISTS "Anyone can create queue" ON public.consultation_queue;
DROP POLICY IF EXISTS "Patients can create queue" ON public.consultation_queue;

-- ============================================
-- 步骤 3: 创建新的 INSERT 策略
-- ============================================
-- 允许用户创建自己的队列（patient_id 必须等于 auth.uid()）
CREATE POLICY "Users can create own queue"
  ON public.consultation_queue
  FOR INSERT
  WITH CHECK (
    -- 确保 patient_id 是当前登录用户
    auth.uid() = patient_id
    -- 确保 status 是 'waiting'（新创建的队列应该是 waiting 状态）
    AND status = 'waiting'
  );

-- ============================================
-- 步骤 4: 验证策略
-- ============================================
SELECT 
  'Step 4: Verification' AS step,
  policyname,
  cmd AS command,
  with_check AS with_check_clause
FROM pg_policies
WHERE tablename = 'consultation_queue'
AND cmd = 'INSERT';

-- ============================================
-- 步骤 5: 测试（可选）
-- ============================================
-- 注意：这个测试需要在应用中以普通用户身份登录后运行
-- 或者使用 service_role key 来测试

-- 测试查询（模拟用户创建队列）
-- SELECT 
--   'Test: Can user create queue?' AS step,
--   CASE 
--     WHEN EXISTS (
--       SELECT 1 FROM pg_policies
--       WHERE tablename = 'consultation_queue'
--       AND cmd = 'INSERT'
--       AND with_check LIKE '%auth.uid() = patient_id%'
--     )
--     THEN '✅ INSERT policy exists and allows users to create own queue'
--     ELSE '❌ INSERT policy missing or incorrect'
--   END AS status;

