-- 🚀 快速清空所有测试数据
-- 在 Supabase SQL Editor 中运行

-- 1. 删除所有订单数据
TRUNCATE TABLE public.order_items CASCADE;
TRUNCATE TABLE public.orders CASCADE;

-- 2. 删除咨询和评估数据
TRUNCATE TABLE public.consultations CASCADE;
TRUNCATE TABLE public.symptom_assessments CASCADE;

-- 3. 删除用户 profiles
TRUNCATE TABLE public.user_profiles CASCADE;

-- 4. 删除所有认证用户
-- ⚠️ 警告：这会删除所有用户！
-- 注意：某些 Supabase 版本可能需要通过 Dashboard 删除
DELETE FROM auth.users;

-- ✅ 完成！如果上面的 DELETE 失败，请通过 Dashboard 删除：
-- Authentication → Users → 选择所有 → Delete

