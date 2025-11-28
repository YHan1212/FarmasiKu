-- ============================================
-- 修复特定用户的 role（如果 auth.uid() 不工作）
-- 替换 'YOUR_USER_ID' 为实际的用户 ID
-- ============================================

-- 方法 1: 使用你的 Admin 用户 ID
-- 替换下面的 ID 为你的 Admin 用户 ID: 56e324aa-e1dd-40a8-9e96-2473cfcba661

UPDATE public.user_profiles 
SET 
  role = 'admin',
  updated_at = NOW()
WHERE id = '56e324aa-e1dd-40a8-9e96-2473cfcba661'::uuid;

-- 如果 profile 不存在，创建它
INSERT INTO public.user_profiles (id, role, created_at, updated_at)
VALUES (
  '56e324aa-e1dd-40a8-9e96-2473cfcba661'::uuid,
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

-- 验证
SELECT 
  'Verification' AS step,
  id,
  role,
  CASE 
    WHEN role = 'admin' THEN '✅ Role is admin'
    WHEN role IS NULL THEN '❌ Role is NULL'
    ELSE '⚠️ Role is: ' || role
  END AS status
FROM public.user_profiles
WHERE id = '56e324aa-e1dd-40a8-9e96-2473cfcba661'::uuid;

-- 测试查询
SELECT 
  'Test Query' AS step,
  (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting') AS total_waiting,
  (SELECT COUNT(*) FROM public.consultation_queue 
   WHERE status = 'waiting' 
   AND EXISTS (
     SELECT 1 FROM public.user_profiles
     WHERE user_profiles.id = '56e324aa-e1dd-40a8-9e96-2473cfcba661'::uuid
     AND user_profiles.role = 'admin'
   )) AS admin_can_see;

