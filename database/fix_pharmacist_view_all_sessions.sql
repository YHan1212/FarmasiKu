-- 修复药剂师查看所有会话的 RLS 策略
-- 允许任何链接的药剂师（通过 doctors.user_id）都能查看和访问会话

-- 1. 修复 consultation_sessions 的 SELECT 策略
-- 允许患者查看自己的会话，也允许任何链接的药剂师查看会话
DROP POLICY IF EXISTS "Users can view own sessions" ON public.consultation_sessions;
CREATE POLICY "Users can view own sessions"
  ON public.consultation_sessions
  FOR SELECT
  USING (
    -- 患者可以查看自己的会话
    auth.uid() = patient_id OR 
    -- 任何链接的药剂师都可以查看会话（通过 doctors.user_id）
    EXISTS (
      SELECT 1 FROM public.doctors 
      WHERE doctors.user_id = auth.uid()
      AND (
        -- 如果会话有 doctor_id，检查是否匹配
        (consultation_sessions.doctor_id IS NOT NULL AND doctors.id = consultation_sessions.doctor_id) OR
        -- 或者通过队列匹配的药剂师
        EXISTS (
          SELECT 1 FROM public.consultation_queue
          WHERE consultation_queue.id = consultation_sessions.queue_id
          AND consultation_queue.matched_pharmacist_id = doctors.id
        )
      )
    )
  );

-- 2. 修复 consultation_sessions 的 UPDATE 策略
DROP POLICY IF EXISTS "Users can update own sessions" ON public.consultation_sessions;
CREATE POLICY "Users can update own sessions"
  ON public.consultation_sessions
  FOR UPDATE
  USING (
    -- 患者可以更新自己的会话
    auth.uid() = patient_id OR 
    -- 任何链接的药剂师都可以更新会话
    EXISTS (
      SELECT 1 FROM public.doctors 
      WHERE doctors.user_id = auth.uid()
      AND (
        (consultation_sessions.doctor_id IS NOT NULL AND doctors.id = consultation_sessions.doctor_id) OR
        EXISTS (
          SELECT 1 FROM public.consultation_queue
          WHERE consultation_queue.id = consultation_sessions.queue_id
          AND consultation_queue.matched_pharmacist_id = doctors.id
        )
      )
    )
  )
  WITH CHECK (
    auth.uid() = patient_id OR 
    EXISTS (
      SELECT 1 FROM public.doctors 
      WHERE doctors.user_id = auth.uid()
      AND (
        (consultation_sessions.doctor_id IS NOT NULL AND doctors.id = consultation_sessions.doctor_id) OR
        EXISTS (
          SELECT 1 FROM public.consultation_queue
          WHERE consultation_queue.id = consultation_sessions.queue_id
          AND consultation_queue.matched_pharmacist_id = doctors.id
        )
      )
    )
  );

-- 3. 修复 consultation_messages 的 SELECT 策略
-- 允许任何链接的药剂师查看消息
DROP POLICY IF EXISTS "Users can view session messages" ON public.consultation_messages;
CREATE POLICY "Users can view session messages"
  ON public.consultation_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.consultation_sessions
      WHERE consultation_sessions.id = consultation_messages.session_id
      AND (
        -- 患者可以查看自己会话的消息
        consultation_sessions.patient_id = auth.uid() OR
        -- 任何链接的药剂师都可以查看消息
        EXISTS (
          SELECT 1 FROM public.doctors 
          WHERE doctors.user_id = auth.uid()
          AND (
            (consultation_sessions.doctor_id IS NOT NULL AND doctors.id = consultation_sessions.doctor_id) OR
            EXISTS (
              SELECT 1 FROM public.consultation_queue
              WHERE consultation_queue.id = consultation_sessions.queue_id
              AND consultation_queue.matched_pharmacist_id = doctors.id
            )
          )
        )
      )
    )
  );

-- 4. 修复 consultation_messages 的 INSERT 策略
-- 允许任何链接的药剂师发送消息
DROP POLICY IF EXISTS "Users can send messages" ON public.consultation_messages;
CREATE POLICY "Users can send messages"
  ON public.consultation_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.consultation_sessions
      WHERE consultation_sessions.id = consultation_messages.session_id
      AND (
        -- 患者可以发送消息
        consultation_sessions.patient_id = auth.uid() OR
        -- 任何链接的药剂师都可以发送消息
        EXISTS (
          SELECT 1 FROM public.doctors 
          WHERE doctors.user_id = auth.uid()
          AND (
            (consultation_sessions.doctor_id IS NOT NULL AND doctors.id = consultation_sessions.doctor_id) OR
            EXISTS (
              SELECT 1 FROM public.consultation_queue
              WHERE consultation_queue.id = consultation_sessions.queue_id
              AND consultation_queue.matched_pharmacist_id = doctors.id
            )
          )
        )
      )
    )
  );

