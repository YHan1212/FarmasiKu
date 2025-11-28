-- 彻底修复 RLS 策略 - 确保 Admin 能看到 waiting 队列
-- 在 Supabase SQL Editor 中运行此脚本（以 Admin 用户登录）

-- ============================================
-- 步骤 1: 删除所有现有的 consultation_queue RLS 策略
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

-- 手动删除可能遗漏的策略
DROP POLICY IF EXISTS "Users can view own queue" ON public.consultation_queue;
DROP POLICY IF EXISTS "Users can create queue" ON public.consultation_queue;
DROP POLICY IF EXISTS "Users can update own queue" ON public.consultation_queue;
DROP POLICY IF EXISTS "Pharmacists can view all queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Pharmacists can view all waiting queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Admins can view all queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Admins can view all waiting queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Admins can view matched queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Linked pharmacists can view waiting queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Linked pharmacists can view all waiting queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Pharmacists can update queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Pharmacists can view matched queues" ON public.consultation_queue;

-- ============================================
-- 步骤 2: 确保 RLS 已启用
-- ============================================
ALTER TABLE public.consultation_queue ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 步骤 3: 重新创建 RLS 策略（使用直接角色检查，不使用函数）
-- ============================================

-- 策略 1: 用户可以看到自己的队列
CREATE POLICY "Users can view own queue"
  ON public.consultation_queue
  FOR SELECT
  USING (auth.uid() = patient_id);

-- 策略 2: Admin 可以查看所有等待中的队列（最重要！）
-- 使用直接角色检查，不使用函数
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

-- 策略 3: Admin 可以查看已匹配的队列
CREATE POLICY "Admins can view matched queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    status IN ('matched', 'in_consultation') AND 
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- 策略 4: 链接了 pharmacist account 的用户可以查看所有等待中的队列
CREATE POLICY "Linked pharmacists can view waiting queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    status = 'waiting' AND EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.user_id = auth.uid()
    )
  );

-- ============================================
-- 步骤 4: INSERT 策略
-- ============================================
CREATE POLICY "Users can create queue"
  ON public.consultation_queue
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- ============================================
-- 步骤 5: UPDATE 策略
-- ============================================
CREATE POLICY "Users can update own queue"
  ON public.consultation_queue
  FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Linked pharmacists can update queues"
  ON public.consultation_queue
  FOR UPDATE
  USING (
    (status = 'waiting' AND EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.user_id = auth.uid()
    )) OR
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
    consultation_queue.status IN ('matched', 'in_consultation')
  );

-- ============================================
-- 步骤 6: 验证策略已创建
-- ============================================
SELECT 
  'Verification: Policies Created' AS step,
  policyname,
  cmd,
  qual AS condition
FROM pg_policies
WHERE tablename = 'consultation_queue'
ORDER BY 
  CASE cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    ELSE 4
  END,
  policyname;

-- ============================================
-- 步骤 7: 测试查询（需要以 Admin 用户登录）
-- ============================================
SELECT 
  'Verification: Test Query' AS step,
  auth.uid() AS current_user_id,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AS current_role,
  (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting') AS total_waiting_queues,
  COUNT(*) AS visible_queues,
  CASE 
    WHEN auth.uid() = '56e324aa-e1dd-40a8-9e96-2473cfcba661' 
         AND (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
         AND COUNT(*) > 0 
    THEN '✅ SUCCESS - Admin can see waiting queues!'
    WHEN auth.uid() = '56e324aa-e1dd-40a8-9e96-2473cfcba661' 
         AND (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
         AND COUNT(*) = 0 
    THEN '⚠️ Admin but no queues visible (check if queues exist or RLS still blocking)'
    WHEN auth.uid() != '56e324aa-e1dd-40a8-9e96-2473cfcba661' 
    THEN '⚠️ Not logged in as Admin user - login as 56e324aa-e1dd-40a8-9e96-2473cfcba661'
    ELSE '❌ Check user role and login'
  END AS status
FROM public.consultation_queue
WHERE status = 'waiting' 
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  );

-- ============================================
-- 步骤 8: 显示所有可见的 waiting 队列
-- ============================================
SELECT 
  'All Visible Waiting Queues' AS step,
  id,
  patient_id,
  status,
  created_at
FROM public.consultation_queue
WHERE status = 'waiting' 
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
ORDER BY created_at DESC;

-- ============================================
-- 完成！
-- ============================================
-- 查看 Step 7 的结果
-- 如果显示 ✅ SUCCESS，刷新浏览器应该能看到队列了
-- 如果还是 0，检查：
-- 1. 是否以 Admin 用户登录（56e324aa-e1dd-40a8-9e96-2473cfcba661）
-- 2. 是否有 waiting 队列存在
-- 3. 浏览器控制台的错误信息

