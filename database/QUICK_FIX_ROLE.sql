-- 快速修复：添加 role 字段（如果不存在）
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 检查 role 字段是否存在
-- ============================================
DO $$
BEGIN
  -- 检查 role 列是否存在
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'role'
  ) THEN
    -- 如果不存在，添加 role 字段
    ALTER TABLE public.user_profiles 
    ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
    
    -- 为现有用户设置默认角色
    UPDATE public.user_profiles 
    SET role = 'user' 
    WHERE role IS NULL;
    
    RAISE NOTICE 'Role column added successfully!';
  ELSE
    RAISE NOTICE 'Role column already exists.';
  END IF;
END $$;

-- ============================================
-- 步骤 2: 验证设置
-- ============================================
SELECT 
  id,
  role,
  created_at
FROM public.user_profiles
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 步骤 3: 创建索引（如果不存在）
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- ============================================
-- 完成！
-- ============================================
-- 现在你可以设置管理员了：
-- UPDATE public.user_profiles 
-- SET role = 'admin' 
-- WHERE id = '你的用户 UUID';

