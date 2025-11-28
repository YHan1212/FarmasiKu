-- ============================================
-- 完整修复：允许用户创建自己的队列
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- ============================================
-- 步骤 1: 删除所有现有的 INSERT 策略
-- ============================================
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'consultation_queue'
    AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.consultation_queue', policy_record.policyname);
    RAISE NOTICE 'Dropped INSERT policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- ============================================
-- 步骤 2: 创建新的 INSERT 策略
-- ============================================
-- 允许用户创建自己的队列
-- 条件：patient_id 必须等于 auth.uid()，status 必须是 'waiting'
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
-- 步骤 3: 验证
-- ============================================
SELECT 
  'Verification' AS step,
  policyname,
  cmd AS command,
  with_check AS with_check_clause,
  CASE 
    WHEN with_check LIKE '%auth.uid() = patient_id%' 
         AND with_check LIKE '%status = ''waiting''%'
    THEN '✅ Policy is correct'
    ELSE '⚠️ Policy might need adjustment'
  END AS status
FROM pg_policies
WHERE tablename = 'consultation_queue'
AND cmd = 'INSERT';

-- ============================================
-- 步骤 4: 测试说明
-- ============================================
-- 现在普通用户应该能够创建队列了
-- 测试步骤：
-- 1. 以普通用户身份登录应用
-- 2. 完成症状选择流程
-- 3. 选择 "More severe" 或点击 "Consult Pharmacist Now"
-- 4. 应该能够成功创建队列，不再出现 RLS 错误

