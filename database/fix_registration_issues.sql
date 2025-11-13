-- 🔧 修复注册和登录问题
-- 在 Supabase SQL Editor 中运行

-- ============================================
-- 步骤 1: 确保触发器存在并正确配置
-- ============================================

-- 删除旧的触发器和函数（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 创建函数（使用 SECURITY DEFINER 确保有权限）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- 插入用户 profile
  INSERT INTO public.user_profiles (id, age)
  VALUES (NEW.id, NULL)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 记录错误但不阻止用户创建
    RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 步骤 2: 检查并修复 RLS 策略
-- ============================================

-- 删除旧的策略（如果存在）
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Anyone can insert profile" ON public.user_profiles;

-- 重新创建策略
-- 策略 1: 用户可以查看自己的 profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 策略 2: 用户可以更新自己的 profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 策略 3: 允许插入（用于触发器和客户端）
CREATE POLICY "Anyone can insert profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 步骤 3: 为现有用户创建缺失的 profiles
-- ============================================

INSERT INTO public.user_profiles (id, age)
SELECT 
  u.id,
  NULL as age
FROM auth.users u
WHERE u.id NOT IN (
  SELECT id FROM public.user_profiles
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 步骤 4: 验证修复结果
-- ============================================

-- 检查所有用户是否都有 profile
SELECT 
  COUNT(*) as total_users,
  COUNT(p.id) as users_with_profile,
  COUNT(*) - COUNT(p.id) as missing_profiles
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id;

-- 显示结果
SELECT '✅ Trigger created successfully!' as status
UNION ALL
SELECT '✅ RLS policies updated!' as status
UNION ALL
SELECT '✅ Missing profiles created!' as status;

