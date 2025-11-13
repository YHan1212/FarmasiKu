-- 🚀 一键清空所有数据（包括用户）
-- 在 Supabase SQL Editor 中运行
-- ⚠️ 警告：这会删除所有数据，无法恢复！

-- 1. 删除所有订单数据
TRUNCATE TABLE public.order_items CASCADE;
TRUNCATE TABLE public.orders CASCADE;

-- 2. 删除咨询和评估数据
TRUNCATE TABLE public.consultations CASCADE;
TRUNCATE TABLE public.symptom_assessments CASCADE;

-- 3. 删除用户 profiles
TRUNCATE TABLE public.user_profiles CASCADE;

-- 4. 删除所有认证用户
-- 注意：如果这个命令失败（权限错误），请通过 Dashboard 删除：
-- Authentication → Users → 选择所有 → Delete
DELETE FROM auth.users;

-- ✅ 验证：检查是否还有数据
SELECT 
  (SELECT COUNT(*) FROM auth.users) as remaining_users,
  (SELECT COUNT(*) FROM public.user_profiles) as remaining_profiles,
  (SELECT COUNT(*) FROM public.orders) as remaining_orders;

-- 所有数字应该是 0

