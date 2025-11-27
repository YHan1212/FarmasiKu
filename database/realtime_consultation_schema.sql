-- 实时1对1咨询系统数据库架构
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 创建咨询队列表
-- ============================================

CREATE TABLE IF NOT EXISTS public.consultation_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched', 'in_consultation', 'completed', 'cancelled')),
  priority INTEGER DEFAULT 0, -- 优先级（紧急情况可提高）
  symptoms TEXT[], -- 用户症状（可选）
  notes TEXT, -- 用户备注
  matched_pharmacist_id UUID REFERENCES public.doctors(id), -- 匹配的药剂师
  matched_at TIMESTAMP WITH TIME ZONE, -- 匹配时间
  started_at TIMESTAMP WITH TIME ZONE, -- 开始咨询时间
  ended_at TIMESTAMP WITH TIME ZONE, -- 结束咨询时间
  position_in_queue INTEGER, -- 队列位置
  estimated_wait_time INTEGER, -- 预计等待时间（分钟）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_consultation_queue_patient_id ON public.consultation_queue(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_queue_status ON public.consultation_queue(status);
CREATE INDEX IF NOT EXISTS idx_consultation_queue_matched_pharmacist_id ON public.consultation_queue(matched_pharmacist_id);
CREATE INDEX IF NOT EXISTS idx_consultation_queue_created_at ON public.consultation_queue(created_at);

-- ============================================
-- 步骤 2: 扩展咨询会话表
-- ============================================

ALTER TABLE public.consultation_sessions 
ADD COLUMN IF NOT EXISTS queue_id UUID REFERENCES public.consultation_queue(id),
ADD COLUMN IF NOT EXISTS consultation_type TEXT DEFAULT 'scheduled' CHECK (consultation_type IN ('realtime', 'scheduled')),
ADD COLUMN IF NOT EXISTS estimated_wait_time INTEGER, -- 预计等待时间（分钟）
ADD COLUMN IF NOT EXISTS position_in_queue INTEGER; -- 队列位置

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_queue_id ON public.consultation_sessions(queue_id);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_consultation_type ON public.consultation_sessions(consultation_type);

-- ============================================
-- 步骤 3: 创建药物推荐表
-- ============================================

CREATE TABLE IF NOT EXISTS public.consultation_medications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.consultation_sessions(id) ON DELETE CASCADE NOT NULL,
  medication_name TEXT NOT NULL,
  medication_id UUID, -- 关联药物表（如果存在）
  dosage TEXT, -- 用法用量
  frequency TEXT, -- 服用频率（如：每日3次）
  duration TEXT, -- 服用时长（如：7天）
  instructions TEXT, -- 特殊说明
  recommended_by UUID REFERENCES auth.users(id) NOT NULL, -- 推荐人（药剂师）
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  patient_notes TEXT, -- 患者备注
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_consultation_medications_session_id ON public.consultation_medications(session_id);
CREATE INDEX IF NOT EXISTS idx_consultation_medications_status ON public.consultation_medications(status);
CREATE INDEX IF NOT EXISTS idx_consultation_medications_recommended_by ON public.consultation_medications(recommended_by);

-- ============================================
-- 步骤 4: 创建药剂师状态表
-- ============================================

CREATE TABLE IF NOT EXISTS public.pharmacist_availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pharmacist_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_online BOOLEAN DEFAULT false, -- 是否在线
  is_busy BOOLEAN DEFAULT false, -- 是否忙碌
  current_session_id UUID REFERENCES public.consultation_sessions(id), -- 当前咨询会话
  max_concurrent_sessions INTEGER DEFAULT 3, -- 最大并发咨询数
  current_sessions_count INTEGER DEFAULT 0, -- 当前咨询数
  last_active_at TIMESTAMP WITH TIME ZONE, -- 最后活跃时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_pharmacist_availability_pharmacist_id ON public.pharmacist_availability(pharmacist_id);
CREATE INDEX IF NOT EXISTS idx_pharmacist_availability_is_online ON public.pharmacist_availability(is_online);
CREATE INDEX IF NOT EXISTS idx_pharmacist_availability_is_busy ON public.pharmacist_availability(is_busy);

-- ============================================
-- 步骤 5: 启用 RLS
-- ============================================

ALTER TABLE public.consultation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacist_availability ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 步骤 6: 创建 RLS 策略
-- ============================================

-- 咨询队列策略
DROP POLICY IF EXISTS "Users can view own queue" ON public.consultation_queue;
CREATE POLICY "Users can view own queue"
  ON public.consultation_queue
  FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Users can create queue" ON public.consultation_queue;
CREATE POLICY "Users can create queue"
  ON public.consultation_queue
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Users can update own queue" ON public.consultation_queue;
CREATE POLICY "Users can update own queue"
  ON public.consultation_queue
  FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- 药剂师可以查看所有队列
DROP POLICY IF EXISTS "Pharmacists can view all queues" ON public.consultation_queue;
CREATE POLICY "Pharmacists can view all queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.id = consultation_queue.matched_pharmacist_id
      AND doctors.user_id = auth.uid()
    )
  );

-- 药物推荐策略
DROP POLICY IF EXISTS "Users can view session medications" ON public.consultation_medications;
CREATE POLICY "Users can view session medications"
  ON public.consultation_medications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.consultation_sessions
      WHERE consultation_sessions.id = consultation_medications.session_id
      AND (
        consultation_sessions.patient_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.doctors
          WHERE doctors.id = consultation_sessions.doctor_id
          AND doctors.user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Pharmacists can insert medications" ON public.consultation_medications;
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
        AND doctors.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update own medications" ON public.consultation_medications;
CREATE POLICY "Users can update own medications"
  ON public.consultation_medications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.consultation_sessions
      WHERE consultation_sessions.id = consultation_medications.session_id
      AND consultation_sessions.patient_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.consultation_sessions
      WHERE consultation_sessions.id = consultation_medications.session_id
      AND consultation_sessions.patient_id = auth.uid()
    )
  );

-- 药剂师状态策略
DROP POLICY IF EXISTS "Pharmacists can view own availability" ON public.pharmacist_availability;
CREATE POLICY "Pharmacists can view own availability"
  ON public.pharmacist_availability
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.id = pharmacist_availability.pharmacist_id
      AND doctors.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Pharmacists can update own availability" ON public.pharmacist_availability;
CREATE POLICY "Pharmacists can update own availability"
  ON public.pharmacist_availability
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.id = pharmacist_availability.pharmacist_id
      AND doctors.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.id = pharmacist_availability.pharmacist_id
      AND doctors.user_id = auth.uid()
    )
  );

-- 管理员可以查看所有药剂师状态
DROP POLICY IF EXISTS "Admins can view all availability" ON public.pharmacist_availability;
CREATE POLICY "Admins can view all availability"
  ON public.pharmacist_availability
  FOR SELECT
  USING (public.is_current_user_admin());

-- ============================================
-- 步骤 7: 创建触发器
-- ============================================

-- 更新时间触发器
CREATE OR REPLACE FUNCTION public.update_consultation_queue_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_consultation_queue_updated_at ON public.consultation_queue;
CREATE TRIGGER update_consultation_queue_updated_at
  BEFORE UPDATE ON public.consultation_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_consultation_queue_updated_at();

CREATE OR REPLACE FUNCTION public.update_consultation_medications_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_consultation_medications_updated_at ON public.consultation_medications;
CREATE TRIGGER update_consultation_medications_updated_at
  BEFORE UPDATE ON public.consultation_medications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_consultation_medications_updated_at();

CREATE OR REPLACE FUNCTION public.update_pharmacist_availability_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_pharmacist_availability_updated_at ON public.pharmacist_availability;
CREATE TRIGGER update_pharmacist_availability_updated_at
  BEFORE UPDATE ON public.pharmacist_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pharmacist_availability_updated_at();

-- ============================================
-- 步骤 8: 启用 Realtime（需要在 Supabase Dashboard 中手动启用）
-- ============================================

-- 注意：需要在 Supabase Dashboard → Database → Replication 中手动启用以下表的 Realtime
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_queue;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_medications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.pharmacist_availability;

-- ============================================
-- 完成！
-- ============================================
-- 现在可以开始使用实时咨询系统了

