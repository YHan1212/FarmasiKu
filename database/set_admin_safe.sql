-- 安全地设置当前用户为 Admin（带错误检查）
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 检查当前用户
-- ============================================
SELECT 
  'Step 1: Check Current User' AS step,
  auth.uid() AS current_user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ No authenticated user - Please login first'
    ELSE '✅ User authenticated'
  END AS status;

-- ============================================
-- 步骤 2: 检查 user_profiles 是否存在
-- ============================================
SELECT 
  'Step 2: Check User Profile' AS step,
  up.id,
  up.role AS current_role,
  up.age,
  CASE 
    WHEN up.id IS NULL THEN '❌ Profile does not exist'
    WHEN up.role = 'admin' THEN '✅ Already admin'
    ELSE '⚠️ Profile exists but not admin'
  END AS status
FROM public.user_profiles up
WHERE up.id = auth.uid();

-- ============================================
-- 步骤 3: 设置用户为 Admin（安全方式）
-- ============================================
-- 方法 1: 如果 profile 已存在，直接 UPDATE
UPDATE public.user_profiles
SET role = 'admin'
WHERE id = auth.uid();

-- 方法 2: 如果 profile 不存在，INSERT（但通常不应该发生，因为有触发器）
-- 注意：如果 auth.uid() 是 NULL，这个会失败
DO $$
DECLARE
  current_user_id UUID;
  profile_exists BOOLEAN;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user found. Please make sure you are logged in to Supabase.';
  END IF;
  
  -- 检查 profile 是否存在
  SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE id = current_user_id) INTO profile_exists;
  
  IF NOT profile_exists THEN
    -- 如果不存在，创建（但通常不应该发生）
    INSERT INTO public.user_profiles (id, role, age)
    VALUES (current_user_id, 'admin', NULL);
    RAISE NOTICE 'Created new profile for user % and set as admin', current_user_id;
  ELSE
    -- 如果存在，更新
    UPDATE public.user_profiles
    SET role = 'admin'
    WHERE id = current_user_id;
    RAISE NOTICE 'Updated user % to admin', current_user_id;
  END IF;
END $$;

-- ============================================
-- 步骤 4: 验证设置
-- ============================================
SELECT 
  'Step 4: Verify Admin Role' AS step,
  id,
  role,
  public.is_current_user_admin() AS is_admin_function_result,
  CASE 
    WHEN role = 'admin' AND public.is_current_user_admin() = true THEN '✅ SUCCESS - User is Admin'
    WHEN role = 'admin' AND public.is_current_user_admin() = false THEN '⚠️ Role is admin but function returns false - check function'
    WHEN role != 'admin' THEN '❌ FAILED - Role is NOT admin'
    ELSE '❌ Unknown issue'
  END AS final_status
FROM public.user_profiles
WHERE id = auth.uid();

-- ============================================
-- 步骤 5: 测试查询 waiting 队列
-- ============================================
SELECT 
  'Step 5: Test Waiting Queues Query' AS step,
  COUNT(*) AS waiting_queues_count,
  public.is_current_user_admin() AS is_admin,
  CASE 
    WHEN public.is_current_user_admin() = true AND COUNT(*) > 0 THEN '✅ SUCCESS - Admin can see waiting queues!'
    WHEN public.is_current_user_admin() = true AND COUNT(*) = 0 THEN '⚠️ Admin but no waiting queues exist'
    WHEN public.is_current_user_admin() = false THEN '❌ FAILED - User is NOT admin'
    ELSE '❌ Unknown issue'
  END AS status
FROM public.consultation_queue
WHERE status = 'waiting' AND public.is_current_user_admin();

-- ============================================
-- 完成！
-- ============================================
-- 查看 Step 4 和 Step 5 的结果
-- 如果都显示 ✅ SUCCESS，刷新浏览器应该能看到队列了

