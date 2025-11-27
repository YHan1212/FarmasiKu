-- 设置现有药剂师在线状态
-- 使用方法：将 YOUR_DOCTOR_ID 替换为实际的 doctor id

-- ============================================
-- 方法 1: 如果你知道 doctor id（推荐）
-- ============================================
-- 将下面的 'YOUR_DOCTOR_ID' 替换为实际的 UUID

DO $$
DECLARE
  doctor_id_to_use UUID := 'YOUR_DOCTOR_ID'::uuid;  -- 替换这里
BEGIN
  -- 检查药剂师是否存在
  IF NOT EXISTS (SELECT 1 FROM public.doctors WHERE id = doctor_id_to_use) THEN
    RAISE EXCEPTION 'Doctor with id % does not exist', doctor_id_to_use;
  END IF;

  -- 设置或更新在线状态
  INSERT INTO public.pharmacist_availability (
    pharmacist_id, 
    is_online, 
    is_busy, 
    max_concurrent_sessions,
    current_sessions_count,
    last_active_at
  )
  VALUES (
    doctor_id_to_use,
    true,
    false,
    3,
    0,
    NOW()
  )
  ON CONFLICT (pharmacist_id) 
  DO UPDATE SET
    is_online = true,
    is_busy = false,
    current_sessions_count = 0,
    last_active_at = NOW();

  RAISE NOTICE 'Pharmacist % is now online', doctor_id_to_use;
END $$;

-- ============================================
-- 方法 2: 设置所有可用药剂师在线（批量）
-- ============================================
-- 取消下面的注释来使用

/*
INSERT INTO public.pharmacist_availability (
  pharmacist_id, 
  is_online, 
  is_busy, 
  max_concurrent_sessions
)
SELECT 
  id,
  true,
  false,
  3
FROM public.doctors
WHERE is_available = true
ON CONFLICT (pharmacist_id) 
DO UPDATE SET
  is_online = true,
  is_busy = false;
*/

-- ============================================
-- 验证设置
-- ============================================
SELECT 
  d.id as doctor_id,
  d.name,
  d.specialization,
  pa.is_online,
  pa.is_busy,
  pa.current_sessions_count,
  pa.max_concurrent_sessions
FROM public.doctors d
LEFT JOIN public.pharmacist_availability pa ON pa.pharmacist_id = d.id
WHERE d.is_available = true
ORDER BY d.created_at DESC;

