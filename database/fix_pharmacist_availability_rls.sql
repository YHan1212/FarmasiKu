-- 修复 pharmacist_availability 的 RLS 策略
-- 允许所有用户查看在线药剂师状态（用于等待页面显示）

-- 添加策略：所有用户都可以查看在线且不忙碌的药剂师
DROP POLICY IF EXISTS "Anyone can view online pharmacists" ON public.pharmacist_availability;
CREATE POLICY "Anyone can view online pharmacists"
  ON public.pharmacist_availability
  FOR SELECT
  USING (
    is_online = true AND is_busy = false
  );

-- 或者更宽松的策略：允许所有用户查看所有药剂师状态（仅用于计数）
-- 如果上面的策略不够，可以使用这个
/*
DROP POLICY IF EXISTS "Anyone can view pharmacist availability for counting" ON public.pharmacist_availability;
CREATE POLICY "Anyone can view pharmacist availability for counting"
  ON public.pharmacist_availability
  FOR SELECT
  USING (true);
*/

