-- 设置测试药剂师 - 一键运行脚本
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 创建测试药剂师（如果不存在）
-- ============================================

-- 先检查是否已存在测试药剂师
DO $$
DECLARE
  test_pharmacist_id UUID;
BEGIN
  -- 查找名为 'Dr. Test Pharmacist' 的药剂师
  SELECT id INTO test_pharmacist_id
  FROM public.doctors
  WHERE name = 'Dr. Test Pharmacist'
  LIMIT 1;

  -- 如果不存在，创建新的
  IF test_pharmacist_id IS NULL THEN
    INSERT INTO public.doctors (name, specialization, bio, is_available)
    VALUES ('Dr. Test Pharmacist', 'General Pharmacy', 'Test pharmacist for realtime consultation', true)
    RETURNING id INTO test_pharmacist_id;
    
    RAISE NOTICE 'Created new test pharmacist with ID: %', test_pharmacist_id;
  ELSE
    RAISE NOTICE 'Test pharmacist already exists with ID: %', test_pharmacist_id;
  END IF;

  -- ============================================
  -- 步骤 2: 设置药剂师在线状态
  -- ============================================
  
  -- 检查是否已有可用性记录
  IF NOT EXISTS (
    SELECT 1 FROM public.pharmacist_availability 
    WHERE pharmacist_id = test_pharmacist_id
  ) THEN
    -- 创建新的可用性记录
    INSERT INTO public.pharmacist_availability (
      pharmacist_id, 
      is_online, 
      is_busy, 
      max_concurrent_sessions,
      current_sessions_count
    )
    VALUES (
      test_pharmacist_id,
      true,
      false,
      3,
      0
    );
    
    RAISE NOTICE 'Created pharmacist availability record';
  ELSE
    -- 更新现有记录为在线状态
    UPDATE public.pharmacist_availability
    SET 
      is_online = true,
      is_busy = false,
      current_sessions_count = 0,
      last_active_at = NOW()
    WHERE pharmacist_id = test_pharmacist_id;
    
    RAISE NOTICE 'Updated pharmacist availability to online';
  END IF;

END $$;

-- ============================================
-- 步骤 3: 验证设置
-- ============================================

-- 显示创建的药剂师信息
SELECT 
  d.id as doctor_id,
  d.name,
  d.specialization,
  d.is_available,
  pa.is_online,
  pa.is_busy,
  pa.current_sessions_count,
  pa.max_concurrent_sessions
FROM public.doctors d
LEFT JOIN public.pharmacist_availability pa ON pa.pharmacist_id = d.id
WHERE d.name = 'Dr. Test Pharmacist';

-- ============================================
-- 完成！
-- ============================================
-- 现在测试药剂师已经在线并可以接收咨询请求

