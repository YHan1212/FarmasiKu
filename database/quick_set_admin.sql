-- 快速设置 Admin - 查看所有用户并选择
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 查看所有用户（找到你的用户）
-- ============================================
SELECT 
  au.id AS user_id,
  au.email AS email,
  up.role AS current_role,
  au.created_at AS created_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
ORDER BY au.created_at DESC;

-- ============================================
-- 步骤 2: 复制你的用户 ID，然后运行下面的查询
-- ============================================
-- 替换 'PASTE_YOUR_USER_ID_HERE' 为从步骤 1 复制的用户 ID

-- 设置用户为 Admin：
UPDATE public.user_profiles
SET role = 'admin'
WHERE id = 'PASTE_YOUR_USER_ID_HERE';

-- 如果 profile 不存在，创建它：
INSERT INTO public.user_profiles (id, role, age)
VALUES ('PASTE_YOUR_USER_ID_HERE', 'admin', NULL)
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ============================================
-- 步骤 3: 验证
-- ============================================
-- 替换 'PASTE_YOUR_USER_ID_HERE' 为你的用户 ID
-- SELECT 
--   id,
--   role,
--   public.is_current_user_admin() AS is_admin
-- FROM public.user_profiles
-- WHERE id = 'PASTE_YOUR_USER_ID_HERE';

