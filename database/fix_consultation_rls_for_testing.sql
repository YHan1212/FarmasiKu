-- 修复咨询相关的 RLS 策略，确保测试模式正常工作
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 1. 修复 consultation_messages 的 INSERT 策略
-- ============================================

-- 删除现有策略
DROP POLICY IF EXISTS "Users can send messages" ON public.consultation_messages;

-- 创建更宽松的策略：允许会话的参与者发送消息
CREATE POLICY "Users can send messages"
  ON public.consultation_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.consultation_sessions
      WHERE consultation_sessions.id = consultation_messages.session_id
      AND (
        consultation_sessions.patient_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.doctors
          WHERE doctors.id = consultation_sessions.doctor_id
          AND (doctors.user_id = auth.uid() OR doctors.user_id IS NULL)
        )
      )
    )
  );

-- ============================================
-- 2. 修复 consultation_medications 的 INSERT 策略
-- ============================================

-- 删除现有策略
DROP POLICY IF EXISTS "Pharmacists can insert medications" ON public.consultation_medications;

-- 创建更宽松的策略：允许会话的药剂师推荐药物
CREATE POLICY "Pharmacists can insert medications"
  ON public.consultation_medications
  FOR INSERT
  WITH CHECK (
    auth.uid() = recommended_by AND
    EXISTS (
      SELECT 1 FROM public.consultation_sessions
      WHERE consultation_sessions.id = consultation_medications.session_id
      AND EXISTS (
        SELECT 1 FROM public.doctors
        WHERE doctors.id = consultation_sessions.doctor_id
        AND (doctors.user_id = auth.uid() OR doctors.user_id IS NULL)
      )
    )
  );

-- ============================================
-- 3. 添加管理员策略（可选，用于调试）
-- ============================================

-- 允许管理员查看所有消息（用于调试）
DROP POLICY IF EXISTS "Admins can view all messages" ON public.consultation_messages;
CREATE POLICY "Admins can view all messages"
  ON public.consultation_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- 允许管理员插入消息（用于测试）
DROP POLICY IF EXISTS "Admins can insert messages" ON public.consultation_messages;
CREATE POLICY "Admins can insert messages"
  ON public.consultation_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- 允许所有认证用户插入消息到他们参与的会话（更宽松的策略用于测试）
DROP POLICY IF EXISTS "Authenticated users can send messages to own sessions" ON public.consultation_messages;
CREATE POLICY "Authenticated users can send messages to own sessions"
  ON public.consultation_messages
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.consultation_sessions
      WHERE consultation_sessions.id = consultation_messages.session_id
      AND (
        consultation_sessions.patient_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.doctors
          WHERE doctors.id = consultation_sessions.doctor_id
          AND (doctors.user_id = auth.uid() OR doctors.user_id IS NULL)
        )
      )
    )
  );

-- 允许管理员查看所有药物推荐（用于调试）
DROP POLICY IF EXISTS "Admins can view all medications" ON public.consultation_medications;
CREATE POLICY "Admins can view all medications"
  ON public.consultation_medications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- 允许管理员插入药物推荐（用于测试）
DROP POLICY IF EXISTS "Admins can insert medications" ON public.consultation_medications;
CREATE POLICY "Admins can insert medications"
  ON public.consultation_medications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

