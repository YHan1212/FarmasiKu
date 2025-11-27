-- 检查用户角色系统设置
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 检查 role 字段是否存在
-- ============================================
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name = 'role';

-- ============================================
-- 步骤 2: 查看所有用户及其角色
-- ============================================
SELECT 
  id,
  role,
  age,
  created_at
FROM public.user_profiles
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 步骤 3: 查看所有管理员
-- ============================================
SELECT 
  id,
  role,
  created_at
FROM public.user_profiles
WHERE role = 'admin';

-- ============================================
-- 步骤 4: 检查 RLS 策略
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- ============================================
-- 如果 role 字段不存在，运行以下命令：
-- ============================================
-- ALTER TABLE public.user_profiles 
-- ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
--
-- UPDATE public.user_profiles 
-- SET role = 'user' 
-- WHERE role IS NULL;

