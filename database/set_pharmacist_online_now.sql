-- 设置药剂师在线状态 - 直接运行
-- Doctor ID: 7259664b-56b3-4f96-a0e1-92cdf0efdf78

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
  '7259664b-56b3-4f96-a0e1-92cdf0efdf78'::uuid,
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

-- 验证设置
SELECT 
  d.id as doctor_id,
  d.name,
  d.specialization,
  d.is_available,
  pa.is_online,
  pa.is_busy,
  pa.current_sessions_count,
  pa.max_concurrent_sessions,
  pa.last_active_at
FROM public.doctors d
LEFT JOIN public.pharmacist_availability pa ON pa.pharmacist_id = d.id
WHERE d.id = '7259664b-56b3-4f96-a0e1-92cdf0efdf78'::uuid;

