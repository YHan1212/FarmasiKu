-- 修复药剂师查看所有等待队列的 RLS 策略
-- 允许药剂师查看所有 status = 'waiting' 的队列，而不仅仅是匹配给自己的

-- 删除旧的策略（如果存在）
DROP POLICY IF EXISTS "Pharmacists can view all queues" ON public.consultation_queue;

-- 创建新策略：药剂师可以查看所有等待中的队列
CREATE POLICY "Pharmacists can view all waiting queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    -- 允许查看所有等待中的队列
    status = 'waiting' OR
    -- 或者查看已匹配给自己的队列
    (
      status IN ('matched', 'in_consultation') AND
      EXISTS (
        SELECT 1 FROM public.doctors
        WHERE doctors.id = consultation_queue.matched_pharmacist_id
        AND doctors.user_id = auth.uid()
      )
    ) OR
    -- 或者查看自己的队列（如果是患者）
    patient_id = auth.uid()
  );

-- 允许药剂师更新队列（接受咨询时）
DROP POLICY IF EXISTS "Pharmacists can update queues" ON public.consultation_queue;
CREATE POLICY "Pharmacists can update queues"
  ON public.consultation_queue
  FOR UPDATE
  USING (
    -- 可以更新等待中的队列（接受时）
    status = 'waiting' OR
    -- 或者更新已匹配给自己的队列
    (
      status IN ('matched', 'in_consultation') AND
      EXISTS (
        SELECT 1 FROM public.doctors
        WHERE doctors.id = consultation_queue.matched_pharmacist_id
        AND doctors.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    -- 更新后的状态必须是 matched 或 in_consultation
    -- 在 WITH CHECK 中，直接使用列名，不需要 new. 前缀
    consultation_queue.status IN ('matched', 'in_consultation')
  );

