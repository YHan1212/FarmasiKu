-- 修复 consultation_sessions 表的 RLS 策略
-- 允许 Admin 和 Doctor 创建和更新会话
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 检查当前策略
-- ============================================
SELECT 
  '=== 当前 consultation_sessions 策略 ===' as step,
  policyname,
  cmd,
  qual::text as using_condition,
  with_check::text as with_check_condition
FROM pg_policies
WHERE tablename = 'consultation_sessions'
ORDER BY cmd, policyname;

-- ============================================
-- 步骤 2: 确保 RLS 已启用
-- ============================================
ALTER TABLE public.consultation_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 步骤 3: 删除可能存在的旧策略（可选）
-- ============================================
DROP POLICY IF EXISTS "Doctors can create sessions" ON public.consultation_sessions;
DROP POLICY IF EXISTS "Admins can create sessions" ON public.consultation_sessions;
DROP POLICY IF EXISTS "Linked pharmacists can create sessions" ON public.consultation_sessions;
DROP POLICY IF EXISTS "Doctors can update sessions" ON public.consultation_sessions;
DROP POLICY IF EXISTS "Admins can update sessions" ON public.consultation_sessions;

-- ============================================
-- 步骤 4: 创建 INSERT 策略（创建会话）
-- ============================================

-- 策略 1: role=doctor 可以创建会话
CREATE POLICY "Doctors can create sessions"
  ON public.consultation_sessions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'doctor'
    )
    AND EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.id = consultation_sessions.doctor_id
      AND doctors.user_id = auth.uid()
    )
  );

-- 策略 2: role=admin 可以创建会话
CREATE POLICY "Admins can create sessions"
  ON public.consultation_sessions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- 策略 3: 链接了 pharmacist account 的用户可以创建会话（向后兼容）
CREATE POLICY "Linked pharmacists can create sessions"
  ON public.consultation_sessions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.id = consultation_sessions.doctor_id
      AND doctors.user_id = auth.uid()
    )
  );

-- ============================================
-- 步骤 5: 创建 SELECT 策略（查看会话）
-- ============================================

-- 策略 1: 患者可以看到自己的会话
CREATE POLICY "Patients can view own sessions"
  ON public.consultation_sessions
  FOR SELECT
  USING (auth.uid() = patient_id);

-- 策略 2: role=doctor 可以查看自己的会话
CREATE POLICY "Doctors can view own sessions"
  ON public.consultation_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.id = consultation_sessions.doctor_id
      AND doctors.user_id = auth.uid()
    )
  );

-- 策略 3: role=admin 可以查看所有会话
CREATE POLICY "Admins can view all sessions"
  ON public.consultation_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================
-- 步骤 6: 创建 UPDATE 策略（更新会话）
-- ============================================

-- 策略 1: role=doctor 可以更新自己的会话
CREATE POLICY "Doctors can update own sessions"
  ON public.consultation_sessions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.id = consultation_sessions.doctor_id
      AND doctors.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.id = consultation_sessions.doctor_id
      AND doctors.user_id = auth.uid()
    )
  );

-- 策略 2: role=admin 可以更新所有会话
CREATE POLICY "Admins can update all sessions"
  ON public.consultation_sessions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================
-- 步骤 7: 验证策略已创建
-- ============================================
SELECT 
  '✅ 验证 consultation_sessions 策略' as status,
  policyname,
  cmd,
  qual::text as using_condition,
  with_check::text as with_check_condition
FROM pg_policies
WHERE tablename = 'consultation_sessions'
ORDER BY 
  CASE cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    ELSE 4
  END,
  policyname;

-- ============================================
-- 完成！
-- ============================================
SELECT '✅ consultation_sessions RLS 策略已修复！' as status;

