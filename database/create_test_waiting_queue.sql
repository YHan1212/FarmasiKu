-- 创建一个测试 waiting 队列，用于验证 Admin 能否看到
-- 在 Supabase SQL Editor 中运行此脚本

-- 1. 首先检查是否有现有的 waiting 队列
SELECT 
  COUNT(*) as existing_waiting_queues
FROM public.consultation_queue
WHERE status = 'waiting';

-- 2. 获取一个测试用户 ID（如果有的话）
-- 如果没有，我们需要创建一个测试队列
DO $$
DECLARE
  test_user_id UUID;
  test_queue_id UUID;
BEGIN
  -- 尝试获取一个非 admin 用户作为测试患者
  SELECT id INTO test_user_id
  FROM public.user_profiles
  WHERE role != 'admin' OR role IS NULL
  LIMIT 1;
  
  -- 如果没有普通用户，使用第一个用户（除了当前 admin）
  IF test_user_id IS NULL THEN
    SELECT id INTO test_user_id
    FROM public.user_profiles
    WHERE id != auth.uid()
    LIMIT 1;
  END IF;
  
  -- 如果还是没有，就创建一个测试队列，patient_id 可以是任何有效的 UUID
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'No test user found, will create queue with a placeholder patient_id';
    test_user_id := '00000000-0000-0000-0000-000000000001'::UUID;
  END IF;
  
  -- 创建测试 waiting 队列
  INSERT INTO public.consultation_queue (
    patient_id,
    status,
    symptoms,
    notes,
    created_at,
    updated_at
  ) VALUES (
    test_user_id,
    'waiting',
    ARRAY['Test Symptom 1', 'Test Symptom 2'],
    '{"userAge": 30, "selectedBodyPart": "head", "symptomAssessments": {}}'::jsonb,
    NOW(),
    NOW()
  )
  RETURNING id INTO test_queue_id;
  
  RAISE NOTICE '✅ Created test waiting queue with ID: %', test_queue_id;
  RAISE NOTICE '✅ Patient ID: %', test_user_id;
END $$;

-- 3. 验证队列已创建
SELECT 
  id,
  patient_id,
  status,
  created_at,
  symptoms
FROM public.consultation_queue
WHERE status = 'waiting'
ORDER BY created_at DESC
LIMIT 5;

-- 4. 测试当前 Admin 用户能否看到这个队列
SELECT 
  COUNT(*) as visible_waiting_queues,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ SUCCESS: Admin can see waiting queues!'
    ELSE '❌ PROBLEM: Admin cannot see waiting queues - check RLS policies'
  END AS test_result
FROM public.consultation_queue
WHERE status = 'waiting';

