-- 快速设置药剂师在线 - 最简单的方法
-- 只需要替换 YOUR_DOCTOR_ID 为实际的 UUID

-- 步骤 1: 先查看所有可用的药剂师
SELECT 
  id,
  name,
  specialization,
  is_available
FROM public.doctors
WHERE is_available = true
ORDER BY created_at DESC;

-- 步骤 2: 复制上面查询结果中的 id，替换下面的 YOUR_DOCTOR_ID
-- 然后运行下面的 INSERT 语句

INSERT INTO public.pharmacist_availability (
  pharmacist_id, 
  is_online, 
  is_busy, 
  max_concurrent_sessions,
  current_sessions_count
)
VALUES (
  'YOUR_DOCTOR_ID'::uuid,  -- 替换为实际的 doctor id（UUID格式）
  true,
  false,
  3,
  0
)
ON CONFLICT (pharmacist_id) 
DO UPDATE SET
  is_online = true,
  is_busy = false,
  current_sessions_count = 0,
  last_active_at = NOW();

-- 步骤 3: 验证是否成功
SELECT 
  d.name,
  pa.is_online,
  pa.is_busy
FROM public.doctors d
JOIN public.pharmacist_availability pa ON pa.pharmacist_id = d.id
WHERE d.id = 'YOUR_DOCTOR_ID'::uuid;  -- 替换为相同的 doctor id

