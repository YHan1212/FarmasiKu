-- ============================================
-- 新咨询系统数据库架构（客服排队模式）
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- ============================================
-- 步骤 1: 清理并重建 consultation_queue 表
-- ============================================

-- 注意：这会删除现有数据！如果不想删除，请先备份
-- DROP TABLE IF EXISTS public.consultation_queue CASCADE;

-- 如果表已存在，只添加缺失的列
DO $$
BEGIN
  -- 检查表是否存在
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'consultation_queue') THEN
    -- 步骤 1: 先删除旧约束（如果存在）
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'consultation_queue_status_check'
    ) THEN
      ALTER TABLE public.consultation_queue
        DROP CONSTRAINT consultation_queue_status_check;
      RAISE NOTICE 'Dropped old status constraint';
    END IF;
    
    -- 步骤 2: 添加缺失的列（如果不存在）
    ALTER TABLE public.consultation_queue 
      ADD COLUMN IF NOT EXISTS position INTEGER,
      ADD COLUMN IF NOT EXISTS estimated_wait_minutes INTEGER,
      ADD COLUMN IF NOT EXISTS pharmacist_id UUID REFERENCES public.doctors(id);
    
    -- 步骤 3: 迁移旧的状态值到新状态
    -- 'matched' → 'accepted'
    -- 'in_consultation' → 'in_chat'
    UPDATE public.consultation_queue
    SET status = CASE 
      WHEN status = 'matched' THEN 'accepted'
      WHEN status = 'in_consultation' THEN 'in_chat'
      ELSE status
    END
    WHERE status IN ('matched', 'in_consultation');
    
    -- 步骤 4: 确保所有状态都是新状态之一，否则设为 'cancelled'
    UPDATE public.consultation_queue
    SET status = 'cancelled'
    WHERE status NOT IN ('waiting', 'accepted', 'in_chat', 'completed', 'cancelled');
    
    -- 步骤 5: 添加新约束
    ALTER TABLE public.consultation_queue
      ADD CONSTRAINT consultation_queue_status_check 
      CHECK (status IN ('waiting', 'accepted', 'in_chat', 'completed', 'cancelled'));
    
    RAISE NOTICE 'Migrated status values and added new constraint';
  ELSE
    -- 创建新表
    CREATE TABLE public.consultation_queue (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'accepted', 'in_chat', 'completed', 'cancelled')),
      
      -- 用户信息
      symptoms TEXT[],
      notes JSONB, -- { symptomAssessments, selectedBodyPart, userAge }
      
      -- 匹配信息（保持向后兼容）
      matched_pharmacist_id UUID REFERENCES public.doctors(id),
      pharmacist_id UUID REFERENCES public.doctors(id), -- 新字段，与 matched_pharmacist_id 相同
      accepted_at TIMESTAMP WITH TIME ZONE,
      matched_at TIMESTAMP WITH TIME ZONE,
      
      -- 队列信息
      position INTEGER, -- 队列位置（1, 2, 3...）
      estimated_wait_minutes INTEGER, -- 预计等待时间（分钟）
      
      -- 时间戳
      started_at TIMESTAMP WITH TIME ZONE,
      ended_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_consultation_queue_patient_id ON public.consultation_queue(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_queue_status ON public.consultation_queue(status);
CREATE INDEX IF NOT EXISTS idx_consultation_queue_created_at ON public.consultation_queue(created_at);

-- 如果 pharmacist_id 列存在，创建索引
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'consultation_queue' 
    AND column_name = 'pharmacist_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_consultation_queue_pharmacist_id ON public.consultation_queue(pharmacist_id);
  END IF;
END $$;

-- ============================================
-- 步骤 2: 确保 consultation_sessions 有 queue_id
-- ============================================
ALTER TABLE public.consultation_sessions 
  ADD COLUMN IF NOT EXISTS queue_id UUID REFERENCES public.consultation_queue(id);

CREATE INDEX IF NOT EXISTS idx_consultation_sessions_queue_id ON public.consultation_sessions(queue_id);

-- ============================================
-- 步骤 3: 创建触发器自动更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_consultation_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_consultation_queue_updated_at ON public.consultation_queue;
CREATE TRIGGER trigger_update_consultation_queue_updated_at
  BEFORE UPDATE ON public.consultation_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_consultation_queue_updated_at();

-- ============================================
-- 步骤 4: 启用 RLS
-- ============================================
ALTER TABLE public.consultation_queue ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 步骤 5: 删除所有旧的 RLS 策略
-- ============================================
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'consultation_queue'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.consultation_queue', policy_record.policyname);
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- ============================================
-- 步骤 6: 创建新的 RLS 策略
-- ============================================

-- SELECT 策略 1: 用户可以查看自己的队列
CREATE POLICY "Users can view own queue"
  ON public.consultation_queue
  FOR SELECT
  USING (auth.uid() = patient_id);

-- SELECT 策略 2: 管理员可以查看所有 waiting 队列
CREATE POLICY "Admins can view all waiting queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    status = 'waiting' AND 
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- SELECT 策略 3: 管理员可以查看所有 accepted/in_chat 队列
CREATE POLICY "Admins can view active queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    status IN ('accepted', 'in_chat') AND 
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- SELECT 策略 4: 链接了 pharmacist 的用户可以查看 waiting 队列
CREATE POLICY "Linked pharmacists can view waiting queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    status = 'waiting' AND 
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.user_id = auth.uid()
    )
  );

-- INSERT 策略: 用户可以创建自己的队列
CREATE POLICY "Users can create own queue"
  ON public.consultation_queue
  FOR INSERT
  WITH CHECK (
    auth.uid() = patient_id
    AND status = 'waiting'
  );

-- UPDATE 策略 1: 用户可以更新自己的队列（取消）
CREATE POLICY "Users can update own queue"
  ON public.consultation_queue
  FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (
    auth.uid() = patient_id
    AND (status = 'cancelled' OR status = consultation_queue.status)
  );

-- UPDATE 策略 2: 链接了 pharmacist 的用户可以接受队列
CREATE POLICY "Linked pharmacists can accept queues"
  ON public.consultation_queue
  FOR UPDATE
  USING (
    status = 'waiting' AND 
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.user_id = auth.uid()
    )
  )
  WITH CHECK (
    consultation_queue.status IN ('accepted', 'in_chat')
    AND EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.user_id = auth.uid()
      AND doctors.id = consultation_queue.pharmacist_id
    )
  );

-- UPDATE 策略 3: 链接了 pharmacist 的用户可以更新已接受的队列
CREATE POLICY "Linked pharmacists can update accepted queues"
  ON public.consultation_queue
  FOR UPDATE
  USING (
    status IN ('accepted', 'in_chat') AND 
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.id = consultation_queue.pharmacist_id
      AND doctors.user_id = auth.uid()
    )
  )
  WITH CHECK (
    consultation_queue.status IN ('accepted', 'in_chat', 'completed')
  );

-- ============================================
-- 步骤 7: 启用 Realtime
-- ============================================
-- 注意：ALTER PUBLICATION 不支持 IF NOT EXISTS，需要先检查
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'consultation_queue'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_queue;
    RAISE NOTICE 'Added consultation_queue to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'consultation_queue is already in supabase_realtime publication';
  END IF;
END $$;

-- ============================================
-- 完成！
-- ============================================
SELECT 'New consultation system schema created successfully!' AS status;

