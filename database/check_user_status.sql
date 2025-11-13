-- 🔍 检查用户状态和邮箱确认
-- 在 Supabase SQL Editor 中运行
-- 替换 'your-email@example.com' 为你的邮箱

-- 检查特定用户的状态
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ 未确认邮箱'
    ELSE '✅ 已确认邮箱'
  END as email_status
FROM auth.users
WHERE email = 'your-email@example.com';  -- 替换为你的邮箱

-- 或者查看所有用户的状态
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ 未确认'
    ELSE '✅ 已确认'
  END as email_status
FROM auth.users
ORDER BY created_at DESC;

-- 手动验证用户邮箱（如果需要）
-- 取消下面的注释并替换 user_id
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW()
-- WHERE id = 'user-id-here';

