-- 允许 Admin 查看所有等待队列（即使没有 link pharmacist account）
-- 在 Supabase SQL Editor 中运行此脚本

-- 删除旧的策略（如果存在）
DROP POLICY IF EXISTS "Pharmacists can view all waiting queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Admins can view all queues" ON public.consultation_queue;

-- 创建新策略：允许 Admin 查看所有等待中的队列
CREATE POLICY "Admins can view all waiting queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    -- 允许 Admin 查看所有等待中的队列
    (status = 'waiting' AND public.is_current_user_admin()) OR
    -- 或者查看已匹配给自己的队列（如果 link 了 pharmacist account）
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

-- 允许链接了 pharmacist account 的用户查看所有等待中的队列
CREATE POLICY "Linked pharmacists can view all waiting queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    -- 允许查看所有等待中的队列（如果 link 了 pharmacist account）
    (status = 'waiting' AND EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.user_id = auth.uid()
    )) OR
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

-- 允许药剂师更新队列（接受咨询时）- 只有 link 了 pharmacist account 才能更新
DROP POLICY IF EXISTS "Pharmacists can update queues" ON public.consultation_queue;
CREATE POLICY "Pharmacists can update queues"
  ON public.consultation_queue
  FOR UPDATE
  USING (
    -- 可以更新等待中的队列（接受时）- 必须 link 了 pharmacist account
    (status = 'waiting' AND EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.user_id = auth.uid()
    )) OR
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
    consultation_queue.status IN ('matched', 'in_consultation')
  );

