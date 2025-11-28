-- 诊断 Admin 加载数据失败的问题
-- 运行此脚本以检查可能的原因

-- 1. 检查是否有 waiting 状态的队列
SELECT 
  '=== 检查 waiting 队列 ===' as step,
  COUNT(*) as waiting_count
FROM consultation_queue
WHERE status = 'waiting';

SELECT 
  id,
  patient_id,
  status,
  created_at
FROM consultation_queue
WHERE status = 'waiting'
ORDER BY created_at DESC
LIMIT 10;

-- 2. 检查 admin 用户的角色
SELECT 
  '=== 检查 Admin 用户 ===' as step,
  id,
  role,
  created_at
FROM user_profiles
WHERE role = 'admin';

-- 3. 检查 consultation_queue 的 RLS 策略
SELECT 
  '=== 检查 RLS 策略 ===' as step,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'consultation_queue'
ORDER BY policyname;

-- 4. 检查是否有允许 admin 查看 waiting 队列的策略
SELECT 
  '=== 检查 Admin 查看策略 ===' as step,
  policyname,
  qual::text as policy_condition
FROM pg_policies
WHERE tablename = 'consultation_queue'
  AND (qual::text LIKE '%admin%' OR qual::text LIKE '%role%')
ORDER BY policyname;

-- 5. 测试 RLS 策略（需要替换为实际的 admin user_id）
-- 替换 'YOUR_ADMIN_USER_ID' 为实际的 admin 用户 ID
DO $$
DECLARE
  admin_user_id uuid;
  test_result boolean;
BEGIN
  -- 获取第一个 admin 用户的 ID
  SELECT id INTO admin_user_id
  FROM user_profiles
  WHERE role = 'admin'
  LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    RAISE NOTICE '❌ 没有找到 admin 用户';
    RETURN;
  END IF;
  
  RAISE NOTICE '测试用户 ID: %', admin_user_id;
  
  -- 模拟查询（需要在实际的 RLS 上下文中测试）
  RAISE NOTICE '✅ Admin 用户 ID: %', admin_user_id;
  RAISE NOTICE '请使用此 ID 在 Supabase Dashboard 中测试查询';
END $$;

-- 6. 检查是否有 doctors 记录（可能影响权限）
SELECT 
  '=== 检查 Doctors 记录 ===' as step,
  COUNT(*) as doctors_count
FROM doctors;

SELECT 
  id,
  user_id,
  name,
  created_at
FROM doctors
LIMIT 10;

