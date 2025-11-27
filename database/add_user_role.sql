-- 添加用户角色系统
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 在 user_profiles 表中添加 role 字段
-- ============================================

-- 添加 role 字段（默认为 'user'）
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- 为现有用户设置默认角色（如果还没有设置）
UPDATE public.user_profiles 
SET role = 'user' 
WHERE role IS NULL;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- ============================================
-- 步骤 2: 更新 RLS 策略以支持角色检查
-- ============================================

-- 允许用户查看自己的角色
-- （已有的策略已经允许用户查看自己的 profile，所以角色也会被包含）

-- 允许管理员查看所有用户（用于管理功能）
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- 允许管理员更新用户角色
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_profiles;
CREATE POLICY "Admins can update user roles"
  ON public.user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================
-- 步骤 3: 创建函数来检查用户是否为管理员
-- ============================================

-- 创建函数来检查当前用户是否为管理员
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id
    AND role = 'admin'
  );
END;
$$;

-- 创建函数来获取当前用户的角色
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = user_id;
  
  RETURN COALESCE(user_role, 'user');
END;
$$;

-- ============================================
-- 步骤 4: 更新触发器以确保新用户有默认角色
-- ============================================

-- 更新 handle_new_user 函数以包含角色
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- 插入用户 profile，默认角色为 'user'
  INSERT INTO public.user_profiles (id, age, role)
  VALUES (NEW.id, NULL, 'user')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 记录错误但不阻止用户创建
    RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- ============================================
-- 步骤 5: 使用说明
-- ============================================

-- 如何将用户设置为管理员：
-- UPDATE public.user_profiles 
-- SET role = 'admin' 
-- WHERE id = '用户的 UUID';

-- 如何将用户改回普通用户：
-- UPDATE public.user_profiles 
-- SET role = 'user' 
-- WHERE id = '用户的 UUID';

-- 如何查看所有管理员：
-- SELECT id, role FROM public.user_profiles WHERE role = 'admin';

