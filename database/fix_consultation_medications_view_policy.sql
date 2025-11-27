-- 修复 consultation_medications 的查看策略
-- 确保用户可以查看他们会话中的药物
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 1. 检查现有策略
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'consultation_medications'
ORDER BY policyname;

-- ============================================
-- 2. 删除并重新创建查看策略（更宽松）
-- ============================================

-- 删除现有策略
DROP POLICY IF EXISTS "Users can view session medications" ON public.consultation_medications;

-- 创建新的查看策略：允许会话的参与者查看药物
CREATE POLICY "Users can view session medications"
  ON public.consultation_medications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.consultation_sessions
      WHERE consultation_sessions.id = consultation_medications.session_id
      AND (
        -- 患者可以查看自己会话的药物
        consultation_sessions.patient_id = auth.uid() OR
        -- 药剂师可以查看自己会话的药物
        EXISTS (
          SELECT 1 FROM public.doctors
          WHERE doctors.id = consultation_sessions.doctor_id
          AND (
            doctors.user_id = auth.uid() OR 
            doctors.user_id IS NULL -- 允许测试模式（user_id 为 NULL）
          )
        )
      )
    )
  );

-- ============================================
-- 3. 验证策略
-- ============================================
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'consultation_medications'
AND policyname = 'Users can view session medications';

